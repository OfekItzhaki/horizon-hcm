import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { APIError, AuthTokens } from '../types';

// Default API base URL - can be overridden via configureAPIClient
let API_BASE_URL = 'http://localhost:3001';

// Token storage utilities (to be implemented by platform)
let getTokens: (() => AuthTokens | null) | undefined;
let saveTokens: ((tokens: AuthTokens) => void) | undefined;
let clearTokens: (() => void) | undefined;
let onUnauthorized: (() => void) | undefined;

export const configureAPIClient = (config: {
  baseURL?: string;
  getTokens: () => AuthTokens | null;
  saveTokens: (tokens: AuthTokens) => void;
  clearTokens: () => void;
  onUnauthorized: () => void;
}) => {
  if (config.baseURL) {
    API_BASE_URL = config.baseURL;
    apiClient.defaults.baseURL = config.baseURL;
  }
  getTokens = config.getTokens;
  saveTokens = config.saveTokens;
  clearTokens = config.clearTokens;
  onUnauthorized = config.onUnauthorized;
};

// Legacy alias for backward compatibility
export const configureTokenStorage = configureAPIClient;

// Create Axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = getTokens?.();
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = getTokens?.();
        if (tokens?.refreshToken) {
          const response = await axios.post<AuthTokens>(`${API_BASE_URL}/auth-override/refresh`, {
            refreshToken: tokens.refreshToken,
          });

          const newTokens = response.data;
          saveTokens?.(newTokens);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        clearTokens?.();
        onUnauthorized?.();
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

// Error handler utility
export const handleAPIError = (error: unknown): APIError => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 500;
    const data = error.response?.data;

    return {
      status,
      code: data?.code || 'UNKNOWN_ERROR',
      message: data?.message || 'An unexpected error occurred',
      details: data?.details,
    };
  }

  return {
    status: 500,
    code: 'NETWORK_ERROR',
    message: 'Network error occurred. Please check your connection.',
  };
};

// Retry utility with exponential backoff
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      // Don't retry on 4xx errors (client errors)
      if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};
