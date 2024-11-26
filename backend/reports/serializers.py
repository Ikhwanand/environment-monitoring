from rest_framework import serializers
from .models import Report, Category, ReportImage, ReportVideo, Comment
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ReportImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportImage
        fields = ('id', 'image', 'caption', 'uploaded_at', 'is_primary', 'size')

class ReportVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportVideo
        fields = ('id', 'video', 'caption', 'uploaded_at', 'size', 'duration')

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    helpful_count = serializers.SerializerMethodField()
    has_voted = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = (
            'id', 'user', 'content', 'created_at', 'updated_at',
            'is_staff_response', 'helpful_count', 'has_voted',
            'can_edit', 'can_delete', 'parent', 'replies',
            'edited', 'is_hidden'
        )
        read_only_fields = (
            'user', 'created_at', 'updated_at', 'is_staff_response',
            'helpful_count', 'has_voted', 'can_edit', 'can_delete',
            'edited', 'is_hidden'
        )

    def get_helpful_count(self, obj):
        return obj.helpful_votes.count()

    def get_has_voted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user in obj.helpful_votes.all()
        return False

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user == obj.user or request.user.is_staff
        return False

    def get_can_delete(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user == obj.user or request.user.is_staff
        return False

    def get_replies(self, obj):
        # Only get direct replies, not nested ones
        replies = obj.replies.filter(parent=obj)
        return CommentSerializer(replies, many=True, context=self.context).data

class ReportSerializer(serializers.ModelSerializer):
    reporter = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        write_only=True,
        source='category',
        required=False,
        allow_null=True
    )
    images = ReportImageSerializer(many=True, read_only=True)
    videos = ReportVideoSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Report
        fields = (
            'id', 'title', 'description', 'location_name', 'latitude', 'longitude',
            'category', 'category_id', 'reporter', 'status', 'severity',
            'created_at', 'updated_at', 'verified', 'images', 'videos', 'comments'
        )
        read_only_fields = ('reporter', 'verified', 'created_at', 'updated_at')