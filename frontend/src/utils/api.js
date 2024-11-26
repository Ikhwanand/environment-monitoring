import axios from 'axios';

const API_URL = 'http://localhost:8000';

// Function to get CSRF token from cookies
function getCsrfToken() {
  const name = 'csrftoken';
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add CSRF token to headers
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }

    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    
    console.log('Making request:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export const auth = {
  async login(credentials) {
    try {
      console.log('Attempting login with:', credentials);
      const response = await api.post('/api/auth/custom-login/', {
        email: credentials.email,
        password: credentials.password
      });
      console.log('Login response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  async register(userData) {
    try {
      console.log('Attempting registration with:', userData);
      const response = await api.post('/api/auth/registration/', userData);
      console.log('Register response:', response.data);
      
      if (response.data?.key) {
        localStorage.setItem('token', response.data.key);
      }
      return response.data;
    } catch (error) {
      console.error('Register error:', error.response?.data || error.message);
      throw error;
    }
  },

  async logout() {
    try {
      await api.post('/api/auth/logout/');
    } finally {
      localStorage.removeItem('token');
    }
  },

  async getUser() {
    try {
      const response = await api.get('/api/auth/user/');
      return response.data;
    } catch (error) {
      console.error('Get user error:', error.response?.data || error);
      throw error;
    }
  }
};

export const reports = {
  async getAll(params = {}) {
    const response = await api.get('/api/reports/', { params });
    return response.data;
  },

  async get(id) {
    const response = await api.get(`/api/reports/${id}/`);
    return response.data;
  },

  async create(data) {
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      const response = await api.post('/api/reports/', data, config);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        console.error('API Error:', error.response.data);
      }
      throw error;
    }
  },

  async update(id, data) {
    const response = await api.put(`/api/reports/${id}/`, data);
    return response.data;
  },

  async delete(id) {
    await api.delete(`/api/reports/${id}/`);
  },

  async getStatistics() {
    try {
      const response = await api.get('/api/reports/dashboard_statistics/');
      return response.data;
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  async getDashboardStats() {
    return api.get('/api/reports/dashboard_stats/');
  },

  async addComment(reportId, content) {
    try {
      const response = await api.post(`/api/reports/${reportId}/add_comment/`, {
        content: content
      });
      return response.data;
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  async getComments(reportId) {
    try {
      const response = await api.get(`/api/reports/${reportId}/`);
      return response.data.comments;
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  },
};

export const comments = {
  getAll: async (reportId) => {
    try {
      const response = await api.get(`/api/reports/${reportId}/comments/`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  create: async (reportId, content) => {
    try {
      const response = await api.post(`/api/reports/${reportId}/comments/`, { content });
      return response.data;
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  update: async (commentId, content) => {
    try {
      const response = await api.put(`/api/comments/${commentId}/`, { content });
      return response.data;
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  delete: async (commentId) => {
    try {
      await api.delete(`/api/comments/${commentId}/`);
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  reply: async (commentId, content) => {
    try {
      const response = await api.post(`/api/comments/${commentId}/reply/`, { content });
      return response.data;
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  toggleHelpful: async (commentId) => {
    try {
      const response = await api.post(`/api/comments/${commentId}/toggle_helpful/`);
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw { response: { data: { error: error.response.data.error } } };
      }
      throw error;
    }
  },

  moderate: async (commentId, action) => {
    try {
      const response = await api.post(`/api/comments/${commentId}/moderate/`, { action });
      return response.data;
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default api;
