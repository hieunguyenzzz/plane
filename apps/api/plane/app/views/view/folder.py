# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Mobelaris fork — View Folders.
# Project-scoped CRUD for folders that group IssueViews in the sidebar nav.

from django.db import transaction

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import ViewFolderSerializer
from plane.db.models import ViewFolder

from .. import BaseViewSet


class ViewFolderViewSet(BaseViewSet):
    serializer_class = ViewFolderSerializer
    model = ViewFolder

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_id"))

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .distinct()
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        folders = self.get_queryset().order_by("sort_order", "name")
        serializer = ViewFolderSerializer(folders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        serializer = ViewFolderSerializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def retrieve(self, request, slug, project_id, pk):
        folder = self.get_queryset().filter(pk=pk).first()
        if folder is None:
            return Response({"error": "Folder not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ViewFolderSerializer(folder)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    def partial_update(self, request, slug, project_id, pk):
        with transaction.atomic():
            folder = (
                ViewFolder.objects.select_for_update()
                .filter(pk=pk, workspace__slug=slug, project_id=project_id)
                .first()
            )
            if folder is None:
                return Response({"error": "Folder not found"}, status=status.HTTP_404_NOT_FOUND)
            serializer = ViewFolderSerializer(folder, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, project_id, pk):
        folder = (
            ViewFolder.objects.filter(pk=pk, workspace__slug=slug, project_id=project_id).first()
        )
        if folder is None:
            return Response({"error": "Folder not found"}, status=status.HTTP_404_NOT_FOUND)
        # Views inside this folder are demoted to root via on_delete=SET_NULL.
        folder.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
