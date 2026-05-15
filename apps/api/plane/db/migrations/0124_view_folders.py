# Mobelaris fork — View Folders.
# Adds a project-scoped ViewFolder model and a nullable folder FK on IssueView
# so users can group views in the left sidebar nav.

import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0123_custom_properties"),
    ]

    operations = [
        migrations.CreateModel(
            name="ViewFolder",
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
                ("sort_order", models.FloatField(default=65535)),
                ("logo_props", models.JSONField(default=dict)),
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
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_viewfolder",
                        to="db.project",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_viewfolder",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "View Folder",
                "verbose_name_plural": "View Folders",
                "db_table": "view_folders",
                "ordering": ("sort_order", "name"),
            },
        ),
        migrations.AddConstraint(
            model_name="viewfolder",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("project", "name"),
                name="unique_project_view_folder_name_when_not_deleted",
            ),
        ),
        migrations.AddField(
            model_name="issueview",
            name="folder",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="views",
                to="db.viewfolder",
            ),
        ),
    ]
