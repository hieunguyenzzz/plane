# Mobelaris fork — Tier B custom properties.
# Drops Tier A marketing fields and creates 3 new tables.

import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0122_marketing_properties"),
    ]

    operations = [
        # 1. Drop Tier A marketing fields (no production data — all NULL).
        migrations.RemoveField(model_name="issue", name="marketing_campaign"),
        migrations.RemoveField(model_name="issue", name="marketing_channel"),
        migrations.RemoveField(model_name="issue", name="marketing_budget_gbp"),
        migrations.RemoveField(model_name="project", name="marketing_properties_enabled"),

        # 2. CustomProperty
        migrations.CreateModel(
            name="CustomProperty",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                (
                    "id",
                    models.UUIDField(
                        db_index=True,
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                ("name", models.CharField(max_length=80)),
                (
                    "type",
                    models.CharField(
                        choices=[
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
                        ],
                        max_length=24,
                    ),
                ),
                ("display_order", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("config", models.JSONField(blank=True, default=dict)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="custom_properties",
                        to="db.project",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="custom_properties",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Custom Property",
                "verbose_name_plural": "Custom Properties",
                "db_table": "custom_properties",
                "ordering": ("display_order", "id"),
            },
        ),
        migrations.AddConstraint(
            model_name="customproperty",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("project", "name"),
                name="unique_project_custom_property_name_when_not_deleted",
            ),
        ),

        # 3. CustomPropertyOption
        migrations.CreateModel(
            name="CustomPropertyOption",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                (
                    "id",
                    models.UUIDField(
                        db_index=True,
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                ("name", models.CharField(max_length=80)),
                ("color", models.CharField(blank=True, max_length=16)),
                ("display_order", models.PositiveIntegerField(default=0)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "property",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="options",
                        to="db.customproperty",
                    ),
                ),
            ],
            options={
                "verbose_name": "Custom Property Option",
                "verbose_name_plural": "Custom Property Options",
                "db_table": "custom_property_options",
                "ordering": ("display_order", "id"),
            },
        ),
        migrations.AddConstraint(
            model_name="custompropertyoption",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("property", "name"),
                name="unique_property_option_name_when_not_deleted",
            ),
        ),

        # 4. CustomPropertyValue
        migrations.CreateModel(
            name="CustomPropertyValue",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                (
                    "id",
                    models.UUIDField(
                        db_index=True,
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                ("value_text", models.TextField(blank=True, null=True)),
                (
                    "value_number",
                    models.DecimalField(
                        blank=True, decimal_places=4, max_digits=20, null=True
                    ),
                ),
                ("value_date", models.DateTimeField(blank=True, null=True)),
                ("value_boolean", models.BooleanField(null=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "issue",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="custom_values",
                        to="db.issue",
                    ),
                ),
                (
                    "property",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="values",
                        to="db.customproperty",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="custom_property_values",
                        to="db.project",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="custom_property_values",
                        to="db.workspace",
                    ),
                ),
                (
                    "value_member",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="custom_property_assignments",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "value_options",
                    models.ManyToManyField(
                        blank=True,
                        related_name="values",
                        to="db.custompropertyoption",
                    ),
                ),
            ],
            options={
                "verbose_name": "Custom Property Value",
                "verbose_name_plural": "Custom Property Values",
                "db_table": "custom_property_values",
                "ordering": ("created_at",),
            },
        ),
        migrations.AddConstraint(
            model_name="custompropertyvalue",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("issue", "property"),
                name="unique_issue_property_when_not_deleted",
            ),
        ),
        migrations.AddIndex(
            model_name="custompropertyvalue",
            index=models.Index(
                fields=["property", "issue"],
                name="cpv_prop_issue_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="custompropertyvalue",
            index=models.Index(
                fields=["property", "value_text"],
                name="cpv_prop_text_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="custompropertyvalue",
            index=models.Index(
                fields=["property", "value_number"],
                name="cpv_prop_num_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="custompropertyvalue",
            index=models.Index(
                fields=["property", "value_date"],
                name="cpv_prop_date_idx",
            ),
        ),
    ]
