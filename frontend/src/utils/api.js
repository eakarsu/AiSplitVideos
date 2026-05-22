import axios from 'axios';

export const API_URL = (typeof window !== 'undefined' && window.__API_BASE_URL__) || process.env.REACT_APP_API_URL || 'http://localhost:3091/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
