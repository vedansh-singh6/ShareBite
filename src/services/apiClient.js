// ---------------------------------------------------------------------------
// API client. The frontend always calls the service layer (authService,
// donationService, ...). Services run against the mock DB by default and can
// be switched to the Flask backend with VITE_API_MODE=flask — no UI changes.
// ---------------------------------------------------------------------------
import axios from 'axios';

export const API_MODE = import.meta.env?.VITE_API_MODE || 'mock';
export const IS_MOCK = API_MODE !== 'flask';

export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the auth token (set by authService on login) to every request.
let authToken = null;
export function setAuthToken(token) {
  authToken = token;
  if (token) http.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete http.defaults.headers.common.Authorization;
}

http.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);