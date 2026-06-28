import axios from 'axios';
import { storage } from '../utils/storage';

/* ✅ Ensure correct base URL */
const BASE_URL =
  import.meta.env.VITE_API_URL?.trim() ||
  'http://localhost:5001/api'; // fallback

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ✅ important for CORS cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ✅ Attach token automatically */
api.interceptors.request.use(
  (config) => {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ✅ Handle global errors (optional but useful) */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API ERROR:", error?.response || error.message);
    if (error?.response?.status === 401) {
      storage.clearAuth();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;