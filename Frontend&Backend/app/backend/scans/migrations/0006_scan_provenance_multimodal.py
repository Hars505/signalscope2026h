from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("scans", "0005_scan_adversarial_result"),
    ]

    operations = [
        migrations.AddField(
            model_name="scan",
            name="provenance",
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="scan",
            name="multimodal_result",
            field=models.JSONField(blank=True, null=True),
        ),
    ]
