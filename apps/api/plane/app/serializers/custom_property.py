# Mobelaris fork — Tier B custom properties serializers.

from rest_framework import serializers

from .base import BaseSerializer
from plane.db.models import (
    CustomProperty,
    CustomPropertyOption,
    CustomPropertyValue,
)


class CustomPropertyOptionSerializer(BaseSerializer):
    class Meta:
        model = CustomPropertyOption
        fields = [
            "id",
            "property",
            "name",
            "color",
            "display_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["property", "created_at", "updated_at"]


class CustomPropertySerializer(BaseSerializer):
    options = CustomPropertyOptionSerializer(many=True, read_only=True)

    class Meta:
        model = CustomProperty
        fields = [
            "id",
            "project",
            "workspace",
            "name",
            "type",
            "display_order",
            "is_active",
            "config",
            "options",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["project", "workspace", "created_at", "updated_at"]


class CustomPropertyValueWriteSerializer(serializers.Serializer):
    """Accepts {property_id, value} for upsert."""

    property_id = serializers.UUIDField()
    value = serializers.JSONField(allow_null=True)


class CustomPropertyValueReadSerializer(BaseSerializer):
    """Lightweight read serializer returning a typed value primitive."""

    value = serializers.SerializerMethodField()
    property_type = serializers.CharField(source="property.type", read_only=True)

    class Meta:
        model = CustomPropertyValue
        fields = [
            "id",
            "issue",
            "property",
            "property_type",
            "value",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_value(self, obj):
        # Delegate to issue serializer's helper to keep formats in sync.
        from .issue import _serialize_custom_value

        return _serialize_custom_value(obj)
