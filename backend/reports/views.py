from rest_framework import viewsets, status, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
from .models import Report, Category, ReportImage, ReportVideo, Comment, ReportSubscription
from .serializers import (
    ReportSerializer, CategorySerializer,
    ReportImageSerializer, ReportVideoSerializer, CommentSerializer
)
from rest_framework.exceptions import ValidationError

class IsOwnerOrStaff(permissions.BasePermission):
    """
    Custom permission to only allow owners of a report or staff to edit it.
    """
    def has_object_permission(self, request, view, obj):
        return obj.reporter == request.user or request.user.is_staff

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter categories based on user if not staff"""
        if self.request.user.is_staff:
            return Category.objects.all()
        return Category.objects.filter(reports__reporter=self.request.user).distinct()

class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'location_name']
    ordering_fields = ['created_at', 'updated_at', 'severity']
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        """Get all reports for viewing, but maintain edit restrictions"""
        return Report.objects.all().select_related('reporter', 'category')

    def get_permissions(self):
        """Allow viewing for all authenticated users, but restrict edit operations"""
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsOwnerOrStaff()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get dashboard statistics including recent reports"""
        queryset = self.get_queryset()
        
        # Get total counts
        total_reports = queryset.count()
        resolved_reports = queryset.filter(status='resolved').count()
        pending_reports = queryset.filter(status='pending').count()
        
        # Get recent reports
        recent_reports = queryset.order_by('-created_at')[:5]
        recent_reports_data = ReportSerializer(recent_reports, many=True).data
        
        return Response({
            'totalReports': total_reports,
            'resolvedReports': resolved_reports,
            'pendingReports': pending_reports,
            'recentReports': recent_reports_data
        })

    def perform_create(self, serializer):
        """Create a new report with optional image or video"""
        report = serializer.save(reporter=self.request.user)
        
        # Handle image upload
        if 'image' in self.request.FILES:
            image_file = self.request.FILES['image']
            ReportImage.objects.create(
                report=report,
                image=image_file,
                is_primary=True
            )
        
        # Handle video upload
        if 'video' in self.request.FILES:
            video_file = self.request.FILES['video']
            ReportVideo.objects.create(
                report=report,
                video=video_file
            )

    @action(detail=True, methods=['post'])
    def add_image(self, request, pk=None):
        try:
            report = self.get_object()
            serializer = ReportImageSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(report=report)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def add_video(self, request, pk=None):
        try:
            report = self.get_object()
            serializer = ReportVideoSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(report=report)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        """Create or list comments for a report"""
        try:
            report = self.get_object()
            
            if request.method == 'POST':
                data = request.data.copy()
                data['report'] = report.id
                serializer = CommentSerializer(data=data, context={'request': request})
                if serializer.is_valid():
                    serializer.save(user=request.user, report=report)
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # GET method
            comments = Comment.objects.filter(report=report, parent=None).order_by('-created_at')
            serializer = CommentSerializer(comments, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def dashboard_statistics(self, request):
        """Get statistics for the dashboard"""
        try:
            # Get the last 30 days
            thirty_days_ago = timezone.now() - timedelta(days=30)
            
            # Get total reports
            total_reports = Report.objects.count()
            
            # Get reports in the last 30 days
            recent_reports = Report.objects.filter(created_at__gte=thirty_days_ago).count()
            
            # Get reports by category
            reports_by_category = Category.objects.annotate(
                report_count=Count('reports')
            ).values('name', 'report_count')
            
            # Get reports by severity
            reports_by_severity = Report.objects.values('severity').annotate(
                count=Count('id')
            )
            
            # Get user's reports count
            user_reports = Report.objects.filter(reporter=request.user).count()
            
            return Response({
                'total_reports': total_reports,
                'recent_reports': recent_reports,
                'reports_by_category': list(reports_by_category),
                'reports_by_severity': list(reports_by_severity),
                'user_reports': user_reports
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        try:
            # Get base queryset based on user permissions
            queryset = self.get_queryset()
            
            # Calculate statistics
            total_reports = queryset.count()
            pending_reports = queryset.filter(status='pending').count()
            resolved_reports = queryset.filter(status='resolved').count()
            recent_reports = queryset.filter(
                created_at__gte=timezone.now() - timedelta(days=7)
            ).count()

            by_category = queryset.values('category__name').annotate(
                count=Count('id')
            )
            by_severity = queryset.values('severity').annotate(
                count=Count('id')
            )

            return Response({
                'total_reports': total_reports,
                'pending_reports': pending_reports,
                'resolved_reports': resolved_reports,
                'recent_reports': recent_reports,
                'by_category': list(by_category),
                'by_severity': list(by_severity)
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Comment.objects.select_related('user', 'parent', 'report').prefetch_related('helpful_votes', 'replies')

    def perform_create(self, serializer):
        report_id = self.request.data.get('report')
        if not report_id:
            raise ValidationError("Report ID is required")
        try:
            report = Report.objects.get(id=report_id)
        except Report.DoesNotExist:
            raise ValidationError("Report not found")
            
        serializer.save(
            user=self.request.user,
            report=report,
            is_staff_response=self.request.user.is_staff
        )

    def perform_update(self, serializer):
        comment = self.get_object()
        if self.request.user == comment.user or self.request.user.is_staff:
            serializer.save()
        else:
            raise permissions.PermissionDenied("You don't have permission to edit this comment")

    def perform_destroy(self, instance):
        if self.request.user == instance.user or self.request.user.is_staff:
            instance.delete()
        else:
            raise permissions.PermissionDenied("You don't have permission to delete this comment")

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        try:
            parent_comment = self.get_object()
            serializer = self.get_serializer(data=request.data)
            
            if serializer.is_valid():
                serializer.save(
                    user=request.user,
                    report=parent_comment.report,
                    parent=parent_comment,
                    is_staff_response=request.user.is_staff
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def toggle_helpful(self, request, pk=None):
        try:
            comment = self.get_object()
            user = request.user
            
            if user == comment.user:
                return Response(
                    {"error": "You cannot vote on your own comment"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            if user in comment.helpful_votes.all():
                comment.helpful_votes.remove(user)
            else:
                comment.helpful_votes.add(user)
                
            # Return the full serialized comment data
            serializer = self.get_serializer(comment)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def moderate(self, request, pk=None):
        if not request.user.is_staff:
            return Response(
                {"error": "Only staff members can moderate comments"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        comment = self.get_object()
        action = request.data.get('action')
        
        if action == 'hide':
            comment.is_hidden = True
        elif action == 'show':
            comment.is_hidden = False
        else:
            return Response(
                {"error": "Invalid moderation action"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        comment.save()
        return Response(self.get_serializer(comment).data)