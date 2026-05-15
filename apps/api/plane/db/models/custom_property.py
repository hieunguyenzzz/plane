# Mobelaris fork — Tier B generic custom properties.
# User-definable, project-scoped properties with typed values.

from django.conf import settings
from django.db import models

from .base import BaseModel
from .project import Project
from .issue import Issue


PROPERTY_TYPES = (
    ("text", "Text"),
    ("number", "Number"),
    ("currency", "Currency"),
    ("rating", "Rating"),
    ("single_select", "Single select"),
    ("multi_select", "Multi select"),
    ("date", "Date"),
    ("checkbox", "Checkbox"),
    ("person", "Person"),
    ("url", "URL"),
    ("email", "Email"),
)


class CustomProperty(BaseModel):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="custom_properties",
    )
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="custom_properties",
    )
    name = models.CharField(max_length=80)
    type = models.CharField(max_length=24, choices=PROPERTY_TYPES)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    config = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Custom Property"
        verbose_name_plural = "Custom Properties"
        db_table = "custom_properties"
        ordering = ("display_order", "id")
        constraints = [
            models.UniqueConstraint(
                fields=["project", "name"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_project_custom_property_name_when_not_deleted",
            ),
        ]

    def save(self, *args, **kwargs):
        self.workspace = self.project.workspace
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.project_id}:{self.name}"


class CustomPropertyOption(BaseModel):
    property = models.ForeignKey(
        CustomProperty,
        on_delete=models.CASCADE,
        related_name="options",
    )
    name = models.CharField(max_length=80)
    color = models.CharField(max_length=16, blank=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Custom Property Option"
        verbose_name_plural = "Custom Property Options"
        db_table = "custom_property_options"
        ordering = ("display_order", "id")
        constraints = [
            models.UniqueConstraint(
                fields=["property", "name"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_property_option_name_when_not_deleted",
            ),
        ]

    def __str__(self):
        return f"{self.property_id}:{self.name}"


class CustomPropertyValue(BaseModel):
    issue = models.ForeignKey(
        Issue,
        on_delete=models.CASCADE,
        related_name="custom_values",
    )
    property = models.ForeignKey(
        CustomProperty,
        on_delete=models.CASCADE,
        related_name="values",
    )
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="custom_property_values",
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="custom_property_values",
    )

    value_text = models.TextField(null=True, blank=True)
    value_number = models.DecimalField(
        max_digits=20,
        decimal_places=4,
        null=True,
        blank=True,
    )
    value_date = models.DateTimeField(null=True, blank=True)
    value_boolean = models.BooleanField(null=True)
    value_options = models.ManyToManyField(
        CustomPropertyOption,
        blank=True,
        related_name="values",
    )
    value_member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="custom_property_assignments",
    )

    class Meta:
        verbose_name = "Custom Property Value"
        verbose_name_plural = "Custom Property Values"
        db_table = "custom_property_values"
        ordering = ("created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "property"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_issue_property_when_not_deleted",
            ),
        ]
        indexes = [
            models.Index(fields=["property", "issue"]),
            models.Index(fields=["property", "value_text"]),
            models.Index(fields=["property", "value_number"]),
            models.Index(fields=["property", "value_date"]),
        ]

    def save(self, *args, **kwargs):
        self.workspace = self.issue.workspace
        self.project = self.issue.project
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.issue_id}:{self.property_id}"
