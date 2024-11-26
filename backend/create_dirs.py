import os

# Create static directory
os.makedirs('static', exist_ok=True)
os.makedirs('staticfiles', exist_ok=True)
os.makedirs('media', exist_ok=True)
print("Created required directories")
