# Mobelaris fork — Tier B custom properties URLs.

from django.urls import path

from plane.app.views import (
    CustomPropertyViewSet,
    CustomPropertyOptionViewSet,
    IssueCustomPropertyValueEndpoint,
)


urlpatterns = [
    # Custom property CRUD
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/custom-properties/",
        CustomPropertyViewSet.as_view({"get": "list", "post": "create"}),
        name="custom-properties",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/custom-properties/<uuid:pk>/",
        CustomPropertyViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="custom-property-detail",
    ),
    # Custom property options
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/custom-properties/<uuid:property_id>/options/",
        CustomPropertyOptionViewSet.as_view({"get": "list", "post": "create"}),
        name="custom-property-options",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/custom-properties/<uuid:property_id>/options/<uuid:pk>/",
        CustomPropertyOptionViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="custom-property-option-detail",
    ),
    # Custom property values on issues
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/custom-property-values/",
        IssueCustomPropertyValueEndpoint.as_view(),
        name="issue-custom-property-values",
    ),
]
