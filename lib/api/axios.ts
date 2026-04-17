import axios from "axios";
import { store } from "@/lib/store";
import { forceLogout } from "@/lib/slices/authSlice";

export const baseURL = "https://api.dev.epicridesapp.com/api/admin";

const headers = {
  "Content-Type": "application/json",
};

// Create an Axios instance
export const API = axios.create({
  baseURL: baseURL,
  timeout: 100000,
  headers: headers,
});

// Request Interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth endpoints that should NOT trigger a forced logout on 401
const AUTH_ENDPOINTS = ["/login", "/forgot-password", "/verify-otp", "/reset-password"];

// Response Interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error?.config?.url || "";
    const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => requestUrl.includes(ep));

    if (error?.response?.status === 401 && !isAuthEndpoint) {
      store.dispatch(forceLogout());
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);
