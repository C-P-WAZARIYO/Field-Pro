import axios from 'axios';

const api = axios.create({
  // Use your backend URL
  baseURL: import.meta.env.VITE_API_URL || 'https://field-pro.onrender.com',
  withCredentials: true, // IMPORTANT: This allows cookies to be sent/received
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add an interceptor to handle global error logging (optional but helpful)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error:', error.response?.data?.message || 'Something went wrong');

    const originalRequest = error.config;

    // Don't retry refresh endpoint itself - prevent infinite loops
    if (originalRequest.url.includes('/auth/refresh')) {
      // Refresh failed - clear tokens and redirect to login
      localStorage.removeItem('accessToken');
      window.location.href = '/auth/login';
      return Promise.reject(error);
    }

    // If 401, try refreshing access token once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Call refresh endpoint (cookie-based refresh token)
        const refreshRes = await api.post('/auth/refresh');
        const newAccess = refreshRes.data?.data?.accessToken || refreshRes.data?.accessToken;
        if (newAccess) {
          localStorage.setItem('accessToken', newAccess);
          api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Request interceptor: attach access token from localStorage
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Don't set Content-Type for FormData - let browser handle it
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
    } catch (e) {
      // ignore (e.g., SSR)
    }
    return config;
  },
  (err) => Promise.reject(err)
);

export default api;