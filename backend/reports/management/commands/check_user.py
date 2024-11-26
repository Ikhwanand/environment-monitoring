from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password

User = get_user_model()

class Command(BaseCommand):
    help = 'Check user details in the database'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str)
        parser.add_argument('password', type=str)

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']

        try:
            user = User.objects.get(email=email)
            self.stdout.write(f"\nUser found:")
            self.stdout.write(f"ID: {user.id}")
            self.stdout.write(f"Username: {user.username}")
            self.stdout.write(f"Email: {user.email}")
            self.stdout.write(f"Is active: {user.is_active}")
            self.stdout.write(f"Password valid: {check_password(password, user.password)}\n")
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"\nNo user found with email: {email}\n"))
            # List all users for debugging
            self.stdout.write("All users in database:")
            for u in User.objects.all():
                self.stdout.write(f"- {u.username} ({u.email})")
