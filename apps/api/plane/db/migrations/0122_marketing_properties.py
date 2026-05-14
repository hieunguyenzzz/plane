# Mobelaris fork — Tier A marketing properties.
# Adds three nullable issue fields and a per-project toggle.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0121_alter_estimate_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="issue",
            name="marketing_campaign",
            field=models.CharField(blank=True, max_length=120, null=True),
        ),
        migrations.AddField(
            model_name="issue",
            name="marketing_channel",
            field=models.CharField(
                blank=True,
                choices=[
                    ("email_outbound", "Email Outbound"),
                    ("newsletter", "Newsletter"),
                    ("social", "Social"),
                    ("paid_ads", "Paid Ads"),
                    ("seo", "SEO"),
                    ("content", "Content"),
                    ("pr", "PR"),
                    ("influencer", "Influencer"),
                    ("other", "Other"),
                ],
                max_length=32,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="issue",
            name="marketing_budget_gbp",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                max_digits=10,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="project",
            name="marketing_properties_enabled",
            field=models.BooleanField(default=False),
        ),
    ]
