import type { APIError } from '../types';

/**
 * Parse API error response
 */
export const parseApiError = (error: any): APIError => {
  if (error.response?.data) {
    return {
      status: error.response.status || 500,
      message: error.response.data.message || 'An error occurred',
      code: error.response.data.code || error.response.status?.toString(),
      details: error.response.data.details,
    };
  }

  if (error.request) {
    return {
      status: 0,
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
    };
  }

  return {
    status: 0,
    message: error.message || 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyErrorMessage = (error: APIError): string => {
  const errorMessages: Record<string, string> = {
    NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
    UNAUTHORIZED: 'Your session has expired. Please log in again.',
    FORBIDDEN: 'You do not have permission to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    SERVER_ERROR: 'A server error occurred. Please try again later.',
  };

  return errorMessages[error.code || ''] || error.message;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: any): boolean => {
  return !error.response && !!error.request;
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: any): boolean => {
  return error.response?.status === 401;
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error: any): boolean => {
  return error.response?.status === 400 || error.response?.data?.code === 'VALIDATION_ERROR';
};
