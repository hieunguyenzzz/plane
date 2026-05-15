# Mobelaris fork — Tier B custom properties viewsets.

from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status
from rest_framework.response import Response

from plane.app.views.base import BaseViewSet, BaseAPIView
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import (
    CustomPropertySerializer,
    CustomPropertyOptionSerializer,
    CustomPropertyValueReadSerializer,
)
from plane.db.models import (
    CustomProperty,
    CustomPropertyOption,
    CustomPropertyValue,
    Issue,
)


class CustomPropertyViewSet(BaseViewSet):
    serializer_class = CustomPropertySerializer
    model = CustomProperty

    def get_queryset(self):
        return (
            CustomProperty.objects.filter(
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .prefetch_related("options")
            .distinct()
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        properties = self.get_queryset()
        serializer = CustomPropertySerializer(properties, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    def create(self, request, slug, project_id):
        serializer = CustomPropertySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN])
    def partial_update(self, request, slug, project_id, pk):
        prop = get_object_or_404(
            self.get_queryset(),
            pk=pk,
        )
        serializer = CustomPropertySerializer(prop, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN])
    def destroy(self, request, slug, project_id, pk):
        prop = get_object_or_404(self.get_queryset(), pk=pk)
        prop.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CustomPropertyOptionViewSet(BaseViewSet):
    serializer_class = CustomPropertyOptionSerializer
    model = CustomPropertyOption

    def get_queryset(self):
        return CustomPropertyOption.objects.filter(
            property_id=self.kwargs.get("property_id"),
            property__workspace__slug=self.kwargs.get("slug"),
            property__project_id=self.kwargs.get("project_id"),
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id, property_id):
        options = self.get_queryset()
        serializer = CustomPropertyOptionSerializer(options, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    def create(self, request, slug, project_id, property_id):
        prop = get_object_or_404(
            CustomProperty,
            pk=property_id,
            project_id=project_id,
            workspace__slug=slug,
        )
        serializer = CustomPropertyOptionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(property=prop)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN])
    def partial_update(self, request, slug, project_id, property_id, pk):
        option = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = CustomPropertyOptionSerializer(option, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN])
    def destroy(self, request, slug, project_id, property_id, pk):
        option = get_object_or_404(self.get_queryset(), pk=pk)
        option.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


def _coerce_value_for_type(prop_type, value):
    """Validate + coerce a wire payload to typed value columns.

    Returns a dict of model-field -> value, plus an `options` list of UUIDs.
    Raises ValueError on invalid input.
    """
    cleared = {
        "value_text": None,
        "value_number": None,
        "value_date": None,
        "value_boolean": None,
        "value_member_id": None,
    }
    options = []

    if value is None or value == "":
        return cleared, options

    if prop_type in ("text", "url", "email"):
        cleared["value_text"] = str(value)
    elif prop_type in ("number", "currency", "rating"):
        try:
            cleared["value_number"] = Decimal(str(value))
        except (InvalidOperation, TypeError):
            raise ValueError(f"Invalid numeric value for property type {prop_type}")
    elif prop_type == "date":
        # Accept ISO string or datetime
        try:
            from django.utils.dateparse import parse_datetime, parse_date
            parsed = parse_datetime(str(value)) or parse_date(str(value))
            if parsed is None:
                raise ValueError("Invalid date")
            cleared["value_date"] = parsed if hasattr(parsed, "hour") else timezone.make_aware(
                timezone.datetime.combine(parsed, timezone.datetime.min.time())
            )
        except Exception:
            raise ValueError(f"Invalid date value for property type {prop_type}")
    elif prop_type == "checkbox":
        cleared["value_boolean"] = bool(value)
    elif prop_type == "person":
        cleared["value_member_id"] = value
    elif prop_type == "single_select":
        options = [value] if not isinstance(value, list) else value[:1]
    elif prop_type == "multi_select":
        options = list(value) if isinstance(value, list) else [value]
    else:
        raise ValueError(f"Unknown property type {prop_type}")

    return cleared, options


class IssueCustomPropertyValueEndpoint(BaseAPIView):
    """List or upsert custom property values for a single issue."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_id):
        values = CustomPropertyValue.objects.filter(
            issue_id=issue_id,
            issue__workspace__slug=slug,
            project_id=project_id,
        ).select_related("property").prefetch_related("value_options")
        serializer = CustomPropertyValueReadSerializer(values, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def patch(self, request, slug, project_id, issue_id):
        """Upsert one value. Body: {property_id, value}."""
        property_id = request.data.get("property_id")
        value = request.data.get("value")
        if not property_id:
            return Response(
                {"error": "property_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        prop = get_object_or_404(
            CustomProperty,
            pk=property_id,
            project_id=project_id,
            workspace__slug=slug,
        )
        issue = get_object_or_404(
            Issue,
            pk=issue_id,
            project_id=project_id,
            workspace__slug=slug,
        )

        try:
            field_values, options = _coerce_value_for_type(prop.type, value)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            cpv, _ = CustomPropertyValue.objects.update_or_create(
                issue=issue,
                property=prop,
                defaults=field_values,
            )
            if prop.type in ("single_select", "multi_select"):
                if options:
                    valid_options = list(
                        CustomPropertyOption.objects.filter(
                            property=prop,
                            pk__in=options,
                        )
                    )
                    cpv.value_options.set(valid_options)
                else:
                    cpv.value_options.clear()

        cpv.refresh_from_db()
        serializer = CustomPropertyValueReadSerializer(cpv)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def delete(self, request, slug, project_id, issue_id):
        """Clear a single value. Body or query: ?property_id=..."""
        property_id = request.data.get("property_id") or request.query_params.get("property_id")
        if not property_id:
            return Response(
                {"error": "property_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        CustomPropertyValue.objects.filter(
            issue_id=issue_id,
            property_id=property_id,
            project_id=project_id,
            issue__workspace__slug=slug,
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
