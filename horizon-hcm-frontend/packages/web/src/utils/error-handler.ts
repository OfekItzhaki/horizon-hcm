import { AxiosError } from 'axios';

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
}

/**
 * Parse API error response
 */
export function parseApiError(error: unknown): AppError {
  if (error instanceof AxiosError) {
    const statusCode = error.response?.status;
    const data = error.response?.data;

    // Handle specific status codes
    switch (statusCode) {
      case 400:
        return {
          message: data?.message || 'Invalid request. Please check your input.',
          code: 'BAD_REQUEST',
          statusCode,
          details: data?.errors,
        };
      case 401:
        return {
          message: 'Your session has expired. Please log in again.',
          code: 'UNAUTHORIZED',
          statusCode,
        };
      case 403:
        return {
          message: 'You do not have permission to perform this action.',
          code: 'FORBIDDEN',
          statusCode,
        };
      case 404:
        return {
          message: data?.message || 'The requested resource was not found.',
          code: 'NOT_FOUND',
          statusCode,
        };
      case 409:
        return {
          message: data?.message || 'This resource already exists.',
          code: 'CONFLICT',
          statusCode,
        };
      case 422:
        return {
          message: data?.message || 'Validation failed. Please check your input.',
          code: 'VALIDATION_ERROR',
          statusCode,
          details: data?.errors,
        };
      case 429:
        return {
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT',
          statusCode,
        };
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          message: 'Server error. Please try again later.',
          code: 'SERVER_ERROR',
          statusCode,
        };
      default:
        return {
          message: data?.message || 'An unexpected error occurred.',
          code: 'UNKNOWN_ERROR',
          statusCode,
        };
    }
  }

  // Handle network errors
  if (error instanceof Error) {
    if (error.message === 'Network Error') {
      return {
        message: 'Unable to connect to the server. Please check your internet connection.',
        code: 'NETWORK_ERROR',
      };
    }
    return {
      message: error.message,
      code: 'CLIENT_ERROR',
    };
  }

  return {
    message: 'An unexpected error occurred.',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: AppError): string {
  return error.message;
}

/**
 * Get suggested action for error
 */
export function getSuggestedAction(error: AppError): string | null {
  switch (error.code) {
    case 'NETWORK_ERROR':
      return 'Check your internet connection and try again.';
    case 'UNAUTHORIZED':
      return 'Please log in again to continue.';
    case 'FORBIDDEN':
      return 'Contact your administrator if you believe this is an error.';
    case 'VALIDATION_ERROR':
      return 'Please correct the highlighted fields and try again.';
    case 'RATE_LIMIT':
      return 'Wait a few minutes before trying again.';
    case 'SERVER_ERROR':
      return 'Our team has been notified. Please try again later.';
    default:
      return null;
  }
}

/**
 * Log error for debugging/monitoring
 */
export function logError(error: AppError, context?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.error('Error:', error, 'Context:', context);
  } else {
    // In production, send to error tracking service (e.g., Sentry)
    // Sentry.captureException(error, { extra: context });
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: AppError): boolean {
  const retryableCodes = ['NETWORK_ERROR', 'RATE_LIMIT', 'SERVER_ERROR'];
  return retryableCodes.includes(error.code || '');
}
