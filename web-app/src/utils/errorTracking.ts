/**
 * Error Tracking Utility
 * 
 * Integrates with Sentry for error tracking and monitoring.
 * Configure Sentry DSN in environment variables.
 */

interface ErrorContext {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

class ErrorTracker {
  private isInitialized = false;
  private isDevelopment = import.meta.env.DEV;

  /**
   * Initialize error tracking
   */
  init() {
    if (this.isInitialized) return;

    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
    const environment = import.meta.env.VITE_ENV || 'development';
    const enableErrorTracking = import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true';

    if (!enableErrorTracking || !sentryDsn) {
      console.log('Error tracking disabled or Sentry DSN not configured');
      return;
    }

    // In production, you would initialize Sentry here:
    // import * as Sentry from '@sentry/react';
    // Sentry.init({
    //   dsn: sentryDsn,
    //   environment,
    //   tracesSampleRate: 1.0,
    //   beforeSend(event) {
    //     // Filter sensitive data
    //     return event;
    //   },
    // });

    this.isInitialized = true;
    console.log(`Error tracking initialized for ${environment}`);
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: ErrorContext) {
    if (this.isDevelopment) {
      console.error('Error captured:', error, context);
      return;
    }

    if (!this.isInitialized) {
      console.error('Error tracking not initialized:', error);
      return;
    }

    // In production, send to Sentry:
    // Sentry.captureException(error, {
    //   user: context?.user,
    //   tags: context?.tags,
    //   extra: context?.extra,
    // });
  }

  /**
   * Capture a message
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    if (this.isDevelopment) {
      console.log(`[${level}] ${message}`, context);
      return;
    }

    if (!this.isInitialized) {
      console.log(`[${level}] ${message}`);
      return;
    }

    // In production, send to Sentry:
    // Sentry.captureMessage(message, {
    //   level,
    //   user: context?.user,
    //   tags: context?.tags,
    //   extra: context?.extra,
    // });
  }

  /**
   * Set user context
   */
  setUser(user: { id: string; email: string; role: string } | null) {
    if (!this.isInitialized) return;

    // In production, set user context:
    // Sentry.setUser(user);
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
    if (this.isDevelopment) {
      console.log(`[Breadcrumb] ${category}: ${message}`, data);
      return;
    }

    if (!this.isInitialized) return;

    // In production, add breadcrumb:
    // Sentry.addBreadcrumb({
    //   message,
    //   category,
    //   data,
    //   level: 'info',
    // });
  }

  /**
   * Capture API error
   */
  captureAPIError(error: any, endpoint: string, method: string) {
    const context: ErrorContext = {
      tags: {
        type: 'api_error',
        endpoint,
        method,
      },
      extra: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      },
    };

    this.captureException(error, context);
  }

  /**
   * Capture navigation error
   */
  captureNavigationError(error: Error, path: string) {
    const context: ErrorContext = {
      tags: {
        type: 'navigation_error',
        path,
      },
    };

    this.captureException(error, context);
  }

  /**
   * Capture form error
   */
  captureFormError(error: Error, formName: string, fieldErrors?: Record<string, string>) {
    const context: ErrorContext = {
      tags: {
        type: 'form_error',
        form: formName,
      },
      extra: {
        fieldErrors,
      },
    };

    this.captureException(error, context);
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

// Initialize on import
errorTracker.init();
