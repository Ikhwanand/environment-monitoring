import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, Box, CSSReset } from '@chakra-ui/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardProvider } from './contexts/DashboardContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import ReportForm from './components/ReportForm';
import ReportDetail from './components/reports/ReportDetail';
import ReportList from './components/reports/ReportList';
import Navbar from './components/layout/Navbar';
import theme from './theme';

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
  </div>
);

// Error Boundary Component
const ErrorFallback = ({ error }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center text-red-600">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="mb-4">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (currentUser) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <ChakraProvider theme={theme}>
      <CSSReset />
      <AuthProvider>
        <DashboardProvider>
          <Router>
            <Box minH="100vh" bg="gray.50">
              <Navbar />
              <Box p={4}>
                <Routes>
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicRoute>
                        <Register />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute>
                        <ReportList />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports/new"
                    element={
                      <ProtectedRoute>
                        <ReportForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports/:id"
                    element={
                      <ProtectedRoute>
                        <ReportDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Box>
            </Box>
          </Router>
        </DashboardProvider>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
