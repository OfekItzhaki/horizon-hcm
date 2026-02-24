/**
 * APM (Application Performance Monitoring) Initialization
 * 
 * This module initializes Elastic APM if enabled via environment variables.
 * It must be imported FIRST in main.ts before any other modules.
 * 
 * To enable APM:
 * - Set ELASTIC_APM_ACTIVE=true
 * - Configure ELASTIC_APM_SERVER_URL
 * - Optionally set ELASTIC_APM_SECRET_TOKEN
 * 
 * @example
 * ```typescript
 * // main.ts (FIRST LINE)
 * import './apm';
 * 
 * import { NestFactory } from '@nestjs/core';
 * // ... rest of imports
 * ```
 */

let apm: any = null;

// Only initialize if APM is active
if (process.env.ELASTIC_APM_ACTIVE === 'true') {
  try {
    // Import and start APM
    apm = require('elastic-apm-node').start(require('../elastic-apm'));
    
    console.log('[APM] Elastic APM initialized successfully');
    console.log(`[APM] Service: ${process.env.ELASTIC_APM_SERVICE_NAME || 'horizon-hcm'}`);
    console.log(`[APM] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[APM] Server: ${process.env.ELASTIC_APM_SERVER_URL || 'http://localhost:8200'}`);
  } catch (error) {
    console.error('[APM] Failed to initialize Elastic APM:', error.message);
    console.error('[APM] Application will continue without APM monitoring');
  }
} else {
  console.log('[APM] Elastic APM is disabled (set ELASTIC_APM_ACTIVE=true to enable)');
}

export default apm;
