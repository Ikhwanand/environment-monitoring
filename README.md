# Environment Monitoring System

A full-stack web application for reporting and tracking environmental issues. This system allows users to submit reports about environmental concerns, track their status, and engage in community discussions through comments and voting.

## Features

- **User Authentication**
  - Secure login and registration
  - Token-based authentication
  - Role-based access control (regular users and staff)

- **Report Management**
  - Create environmental reports with location data
  - Upload images for visual documentation
  - Track report status (pending/resolved)
  - Categorize reports by type and severity
  - Real-time dashboard statistics

- **Community Engagement**
  - Comment on reports
  - Reply to comments
  - Vote on helpful comments
  - Subscribe to report updates

- **Dashboard**
  - Overview of total reports
  - Statistics on resolved vs pending reports
  - Recent reports feed
  - Interactive data visualization

## Technology Stack

### Backend
- Django REST Framework
- PostgreSQL Database
- Token Authentication
- Django ORM

### Frontend
- React (Vite)
- Chakra UI
- React Router
- Axios for API communication
- Context API for state management

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL

### Backend Setup
1. Create and activate virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Run migrations:
   ```bash
   python manage.py migrate
   ```

4. Start the server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
environment-monitoring/
├── backend/
│   ├── reports/              # Main Django app
│   │   ├── models.py         # Database models
│   │   ├── serializers.py    # API serializers
│   │   ├── views.py          # API endpoints
│   │   └── urls.py          # URL routing
│   └── requirements.txt      # Python dependencies
└── frontend/
    ├── src/
    │   ├── components/       # React components
    │   ├── contexts/         # React contexts
    │   ├── utils/           # Utility functions
    │   └── App.jsx          # Main application
    └── package.json         # Node.js dependencies
```

## API Endpoints

- `/api/auth/` - Authentication endpoints
- `/api/reports/` - Report management
- `/api/reports/dashboard_stats/` - Dashboard statistics
- `/api/comments/` - Comment management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.