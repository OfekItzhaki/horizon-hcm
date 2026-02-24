/**
 * Analytics Utility
 * 
 * Integrates with Google Analytics for usage tracking.
 * Configure GA tracking ID in environment variables.
 */

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

interface PageViewData {
  path: string;
  title?: string;
}

class Analytics {
  private isInitialized = false;
  private isDevelopment = import.meta.env.DEV;
  private isEnabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';

  /**
   * Initialize analytics
   */
  init() {
    if (this.isInitialized) return;

    const trackingId = import.meta.env.VITE_GA_TRACKING_ID;

    if (!this.isEnabled || !trackingId) {
      console.log('Analytics disabled or tracking ID not configured');
      return;
    }

    // In production, you would initialize Google Analytics here:
    // import ReactGA from 'react-ga4';
    // ReactGA.initialize(trackingId, {
    //   gaOptions: {
    //     anonymizeIp: true,
    //   },
    // });

    this.isInitialized = true;
    console.log('Analytics initialized');
  }

  /**
   * Track page view
   */
  pageView(data: PageViewData) {
    if (this.isDevelopment) {
      console.log('Page view:', data);
      return;
    }

    if (!this.isInitialized) return;

    // In production, track page view:
    // ReactGA.send({ hitType: 'pageview', page: data.path, title: data.title });
  }

  /**
   * Track event
   */
  event(event: AnalyticsEvent) {
    if (this.isDevelopment) {
      console.log('Event:', event);
      return;
    }

    if (!this.isInitialized) return;

    // In production, track event:
    // ReactGA.event({
    //   category: event.category,
    //   action: event.action,
    //   label: event.label,
    //   value: event.value,
    // });
  }

  /**
   * Track user login
   */
  trackLogin(method: string) {
    this.event({
      category: 'Authentication',
      action: 'Login',
      label: method,
    });
  }

  /**
   * Track user logout
   */
  trackLogout() {
    this.event({
      category: 'Authentication',
      action: 'Logout',
    });
  }

  /**
   * Track user registration
   */
  trackRegistration() {
    this.event({
      category: 'Authentication',
      action: 'Register',
    });
  }

  /**
   * Track invoice creation
   */
  trackInvoiceCreated(amount: number) {
    this.event({
      category: 'Invoice',
      action: 'Create',
      value: amount,
    });
  }

  /**
   * Track payment
   */
  trackPayment(amount: number, method: string) {
    this.event({
      category: 'Payment',
      action: 'Complete',
      label: method,
      value: amount,
    });
  }

  /**
   * Track maintenance request
   */
  trackMaintenanceRequest(category: string) {
    this.event({
      category: 'Maintenance',
      action: 'Create Request',
      label: category,
    });
  }

  /**
   * Track announcement creation
   */
  trackAnnouncementCreated(priority: string) {
    this.event({
      category: 'Communication',
      action: 'Create Announcement',
      label: priority,
    });
  }

  /**
   * Track poll creation
   */
  trackPollCreated() {
    this.event({
      category: 'Communication',
      action: 'Create Poll',
    });
  }

  /**
   * Track poll vote
   */
  trackPollVote(pollId: string) {
    this.event({
      category: 'Communication',
      action: 'Vote on Poll',
      label: pollId,
    });
  }

  /**
   * Track document upload
   */
  trackDocumentUpload(fileType: string, fileSize: number) {
    this.event({
      category: 'Document',
      action: 'Upload',
      label: fileType,
      value: fileSize,
    });
  }

  /**
   * Track search
   */
  trackSearch(query: string, resultsCount: number) {
    this.event({
      category: 'Search',
      action: 'Query',
      label: query,
      value: resultsCount,
    });
  }

  /**
   * Track error
   */
  trackError(errorType: string, errorMessage: string) {
    this.event({
      category: 'Error',
      action: errorType,
      label: errorMessage,
    });
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: string, value: number) {
    this.event({
      category: 'Performance',
      action: metric,
      value: Math.round(value),
    });
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, string>) {
    if (this.isDevelopment) {
      console.log('User properties:', properties);
      return;
    }

    if (!this.isInitialized) return;

    // In production, set user properties:
    // ReactGA.set(properties);
  }

  /**
   * Track timing
   */
  trackTiming(category: string, variable: string, value: number, label?: string) {
    if (this.isDevelopment) {
      console.log('Timing:', { category, variable, value, label });
      return;
    }

    if (!this.isInitialized) return;

    // In production, track timing:
    // ReactGA.timing({
    //   category,
    //   variable,
    //   value: Math.round(value),
    //   label,
    // });
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Initialize on import
analytics.init();
