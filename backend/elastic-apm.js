/**
 * Elastic APM Configuration
 * 
 * This file configures Elastic APM for application performance monitoring.
 * APM must be started BEFORE any other modules are loaded.
 * 
 * To enable APM:
 * 1. Set ELASTIC_APM_ACTIVE=true in environment
 * 2. Configure ELASTIC_APM_SERVER_URL and ELASTIC_APM_SECRET_TOKEN
 * 3. Restart application
 * 
 * @see https://www.elastic.co/guide/en/apm/agent/nodejs/current/index.html
 */

module.exports = {
  // Service name as it appears in APM
  serviceName: process.env.ELASTIC_APM_SERVICE_NAME || 'horizon-hcm',

  // APM Server URL
  serverUrl: process.env.ELASTIC_APM_SERVER_URL || 'http://localhost:8200',

  // Secret token for authentication
  secretToken: process.env.ELASTIC_APM_SECRET_TOKEN,

  // Environment (development, staging, production)
  environment: process.env.NODE_ENV || 'development',

  // Enable/disable APM
  active: process.env.ELASTIC_APM_ACTIVE === 'true',

  // Capture request body for debugging
  captureBody: process.env.NODE_ENV === 'production' ? 'errors' : 'all',

  // Capture error stack traces
  captureErrorLogStackTraces: 'always',

  // Error on aborted requests
  errorOnAbortedRequests: true,

  // Transaction sample rate (1.0 = 100%, 0.1 = 10%)
  transactionSampleRate: parseFloat(process.env.ELASTIC_APM_SAMPLE_RATE || '1.0'),

  // Log level
  logLevel: process.env.ELASTIC_APM_LOG_LEVEL || 'info',

  // Ignore specific routes
  ignoreUrls: [
    '/health',
    '/health/ready',
    '/health/live',
    '/favicon.ico',
  ],

  // Sanitize field names (remove sensitive data)
  sanitizeFieldNames: [
    'password',
    'passwd',
    'pwd',
    'secret',
    'token',
    '*key',
    '*token*',
    '*session*',
    '*credit*',
    '*card*',
    'authorization',
    'set-cookie',
  ],

  // Custom context
  globalLabels: {
    version: process.env.APP_VERSION || '1.0.0',
  },
};
