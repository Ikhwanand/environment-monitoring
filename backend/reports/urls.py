from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportViewSet, CategoryViewSet, CommentViewSet
from .views_auth import custom_login

router = DefaultRouter()
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'comments', CommentViewSet, basename='comment')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/custom-login/', custom_login, name='custom-login'),
]
