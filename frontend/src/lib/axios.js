import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081/api', // Spring Boot Backend (port 8081)
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('Auth error:', error.response?.data);
      // Check if token exists but is invalid
      const token = localStorage.getItem('token');
      if (!token) {
        error.response.data = { message: 'Please login to continue' };
      } else {
        error.response.data = { 
          message: error.response?.data?.error || 'Authentication failed. Please login again.' 
        };
      }
    }
    return Promise.reject(error);
  }
);

export default api;