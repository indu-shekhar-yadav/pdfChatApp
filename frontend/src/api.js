import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 30000, // Increase timeout to 30 seconds
});

// Add a retry mechanism
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    if (error.code === 'ECONNABORTED' && !originalRequest._retry) {
      originalRequest._retry = true;
      return api(originalRequest); // Retry the request once
    }
    return Promise.reject(error);
  }
);

export default api;