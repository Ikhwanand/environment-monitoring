from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Font Awesome icon name (e.g., 'fa-tree')")
    color = models.CharField(max_length=20, default="#3182CE", help_text="Hex color code for the category")
    created_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

class Report(models.Model):
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('investigating', _('Under Investigation')),
        ('in_progress', _('In Progress')),
        ('resolved', _('Resolved')),
        ('rejected', _('Rejected')),
    ]

    SEVERITY_CHOICES = [
        ('low', _('Low')),
        ('medium', _('Medium')),
        ('high', _('High')),
        ('critical', _('Critical')),
    ]

    PRIORITY_CHOICES = [
        (1, _('Low')),
        (2, _('Medium')),
        (3, _('High')),
        (4, _('Urgent')),
        (5, _('Emergency')),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    location_name = models.CharField(max_length=200)
    latitude = models.DecimalField(max_digits=10, decimal_places=6)
    longitude = models.DecimalField(max_digits=10, decimal_places=6)
    category = models.ForeignKey(Category, related_name='reports', on_delete=models.SET_NULL, null=True)
    reporter = models.ForeignKey(User, related_name='reported_issues', on_delete=models.CASCADE)
    assigned_to = models.ForeignKey(User, related_name='assigned_reports', null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    priority = models.IntegerField(choices=PRIORITY_CHOICES, default=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    verified = models.BooleanField(default=False)
    verification_notes = models.TextField(blank=True)
    is_public = models.BooleanField(default=True, help_text="If false, only staff can view this report")
    upvotes = models.ManyToManyField(User, related_name='upvoted_reports', blank=True)
    views_count = models.PositiveIntegerField(default=0)
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    resolution_time_days = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.status == 'resolved' and not self.resolved_at:
            self.resolved_at = timezone.now()
            if self.created_at:
                time_diff = self.resolved_at - self.created_at
                self.resolution_time_days = time_diff.days
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['severity', 'priority']),
        ]

class ReportImage(models.Model):
    report = models.ForeignKey(Report, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='reports/%Y/%m/%d/')
    caption = models.CharField(max_length=200, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_primary = models.BooleanField(default=False)
    size = models.PositiveIntegerField(help_text="File size in bytes", null=True)
    
    def __str__(self):
        return f"Image for {self.report.title}"

    def save(self, *args, **kwargs):
        if self.is_primary:
            # Set all other images of this report to not primary
            ReportImage.objects.filter(report=self.report).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-is_primary', '-uploaded_at']

class ReportVideo(models.Model):
    report = models.ForeignKey(Report, related_name='videos', on_delete=models.CASCADE)
    video = models.FileField(upload_to='reports/videos/%Y/%m/%d/')
    caption = models.CharField(max_length=200, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    size = models.PositiveIntegerField(help_text="File size in bytes", null=True)
    duration = models.PositiveIntegerField(help_text="Duration in seconds", null=True)
    
    def __str__(self):
        return f"Video for {self.report.title}"

    class Meta:
        ordering = ['-uploaded_at']

class Comment(models.Model):
    report = models.ForeignKey(Report, related_name='comments', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    parent = models.ForeignKey('self', null=True, blank=True, related_name='replies', on_delete=models.CASCADE)
    is_staff_response = models.BooleanField(default=False)
    helpful_votes = models.ManyToManyField(User, related_name='helpful_comments', blank=True)
    is_hidden = models.BooleanField(default=False, help_text="Hidden comments are only visible to staff")
    edited = models.BooleanField(default=False)

    def __str__(self):
        return f"Comment by {self.user.username} on {self.report.title}"

    def save(self, *args, **kwargs):
        if self.pk:  # If the comment already exists
            self.edited = True
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-created_at']

class ReportSubscription(models.Model):
    user = models.ForeignKey(User, related_name='report_subscriptions', on_delete=models.CASCADE)
    report = models.ForeignKey(Report, related_name='subscriptions', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    notification_frequency = models.CharField(
        max_length=20,
        choices=[
            ('instant', _('Instant')),
            ('daily', _('Daily Digest')),
            ('weekly', _('Weekly Digest')),
        ],
        default='instant'
    )

    class Meta:
        unique_together = ['user', 'report']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username}'s subscription to {self.report.title}"