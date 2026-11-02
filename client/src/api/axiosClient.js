import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Request interceptor to attach JWT token if present
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('finflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors cleanly
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = error.response?.data?.message;
    if (!message) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        message = 'Server connection timed out while waking up. Please try again.';
      } else if (error.message?.includes('Network Error')) {
        message = 'Unable to reach backend server. Please verify your connection.';
      } else {
        message = error.message || 'An unexpected error occurred.';
      }
    }

    const customError = {
      message,
      status: error.response?.status,
      data: error.response?.data,
    };

    // If 401 Unauthorized and not already on login page
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('finflow_token');
    }

    return Promise.reject(customError);
  }
);

export default axiosClient;
