from django.contrib import admin
from .models import Report, Category, ReportImage, ReportVideo, Comment, ReportSubscription
# Register your models here.
admin.site.register(Report)
admin.site.register(Category)
admin.site.register(ReportImage)
admin.site.register(ReportVideo)
admin.site.register(Comment)
admin.site.register(ReportSubscription)
