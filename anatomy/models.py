
from django.db import models


class BrainPart(models.Model):

    CATEGORY_CHOICES = [
        ("lobe", "Lobe"),
        ("cortex", "Cortex"),
        ("structure", "Internal Structure"),
        ("region", "Functional Region"),
    ]

    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(unique=True)

    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES,
    )

    color = models.CharField(
        max_length=7,
        default="#808080",
    )

    location = models.TextField()
    function = models.TextField()
    damage_effects = models.TextField()
    fact = models.TextField(blank=True)

    # Used to connect database records to 3D model meshes
    mesh_name = models.CharField(
        max_length=150,
        blank=True,
    )

    is_deep = models.BooleanField(default=False)
    is_midline = models.BooleanField(default=False)

    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name
