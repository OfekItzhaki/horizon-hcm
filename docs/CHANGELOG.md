# API Changelog

All notable changes to the Horizon-HCM API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-19

### Added - Initial Release

#### Authentication (via @ofeklabs/horizon-auth v0.4.1)
- Full mode (standalone) authentication system
- User registration and login endpoints
- Email verification
- Password reset functionality
- Two-factor authentication (2FA)
- Session management with JWT tokens
- Device management

#### Core Features
- **Buildings Module**
  - POST /buildings - Create building
  - GET /buildings/:id - Get building details
  
- **Notifications System**
  - POST /notifications/send - Send notification
  - POST /notifications/templates - Create notification template
  - GET /notifications/templates/:name - Get template by name
  - GET /notifications/preferences - Get user preferences
  - PATCH /notifications/preferences - Update preferences
  - Multi-provider support (FCM, APNS, Web Push)
  - Template system with variable substitution
  - Delivery tracking and retry logic

- **File Storage & Management**
  - POST /files/upload - Upload file
  - POST /files/chunked/initialize - Initialize chunked upload
  - POST /files/chunked/:uploadId/chunk/:chunkIndex - Upload chunk
  - POST /files/chunked/:uploadId/complete - Complete chunked upload
  - GET /files/chunked/:uploadId/progress - Get upload progress
  - GET /files/:id - Get file metadata
  - GET /files/:id/signed-url - Get signed URL for file access
  - DELETE /files/:id - Delete file
  - Image processing with compression and thumbnail generation
  - Cloud storage integration (S3/Azure)

- **Offline Sync Engine**
  - GET /sync/delta - Get delta changes since last sync
  - POST /sync/apply - Apply sync operations
  - POST /sync/queue - Queue sync operation
  - GET /sync/state - Get sync state
  - Conflict resolution with last-write-wins strategy
  - Background sync with retry logic

- **Security & Compliance**
  - POST /security/device-fingerprint - Generate device fingerprint
  - POST /security/check-anomaly - Check for anomalous activity
  - POST /security/gdpr/export - Export user data (GDPR)
  - POST /security/gdpr/delete - Delete user data (GDPR)
  - POST /security/password/strength - Check password strength
  - Request signing with HMAC-SHA256
  - Anomaly detection with risk scoring
  - Audit logging for sensitive operations
  - IP whitelisting support

- **Analytics & Insights**
  - POST /analytics/events - Track event
  - POST /analytics/features/track - Track feature usage
  - GET /analytics/events - Get events
  - GET /analytics/features/usage - Get feature usage statistics
  - GET /analytics/features/user - Get user feature usage
  - GET /analytics/events/counts - Get event counts
  - GET /analytics/users/active - Get active users
  - GET /analytics/performance/summary - Get performance summary
  - GET /analytics/performance/slow-endpoints - Get slow endpoints
  - GET /analytics/feature-flags - List feature flags
  - POST /analytics/feature-flags - Create feature flag
  - GET /analytics/feature-flags/:name/check - Check if feature is enabled
  - GET /analytics/feature-flags/:name/variant - Get feature variant
  - A/B testing support with variant assignment

- **Internationalization (i18n)**
  - GET /i18n/translations - List translations
  - POST /i18n/translations - Create translation
  - DELETE /i18n/translations/:id - Delete translation
  - GET /i18n/namespaces - List namespaces
  - POST /i18n/format/currency - Format currency
  - POST /i18n/format/date - Format date
  - POST /i18n/format/datetime - Format date and time
  - Multi-language support (English, Hebrew)
  - RTL layout support
  - Locale-based formatting

- **Real-time Communication**
  - WebSocket: ws://localhost:3001/realtime
  - GET /realtime/sse - Server-Sent Events stream
  - GET /realtime/presence - Get user presence
  - GET /realtime/presence/building - Get online users in building
  - GET /realtime/presence/stats - Get presence statistics
  - Bidirectional communication with Socket.IO
  - SSE fallback for one-way updates
  - Presence tracking (online/offline status)
  - Room-based communication
  - Heartbeat mechanism (30s intervals)
  - Redis adapter for multi-instance support

- **Webhooks**
  - POST /webhooks - Register webhook
  - GET /webhooks - List webhooks
  - GET /webhooks/:id - Get webhook details
  - PUT /webhooks/:id - Update webhook
  - DELETE /webhooks/:id - Delete webhook
  - GET /webhooks/:id/deliveries - Get delivery history
  - POST /webhooks/deliveries/:deliveryId/retry - Retry failed delivery
  - POST /webhooks/:id/test - Send test webhook
  - POST /webhooks/trigger - Manually trigger event
  - GET /webhooks/:id/stats - Get webhook statistics
  - HMAC-SHA256 payload signing
  - Retry logic with exponential backoff (5 attempts)
  - Delivery tracking and statistics

- **Health & Monitoring**
  - GET /health - Basic health check
  - GET /health/ready - Readiness probe
  - GET /health/live - Liveness probe
  - Database connectivity check
  - Redis connectivity check

#### Infrastructure Features
- **API Optimization**
  - Response compression (gzip/brotli)
  - ETag support for conditional requests
  - Field filtering via ?fields= query parameter
  - Pagination (cursor-based and offset-based)
  - API versioning support (/api/v1/, /api/v2/)
  - Rate limiting (100 requests/minute per user)

- **Logging & Monitoring**
  - Correlation ID tracking
  - Performance monitoring
  - Structured logging with Winston
  - Seq log aggregation
  - Request/response logging
  - Error tracking with stack traces

- **Caching**
  - Redis-based caching
  - TTL management
  - Pattern-based invalidation
  - Cache-aside pattern support
  - @Cacheable decorator for automatic caching

- **Background Jobs**
  - BullMQ job queues
  - Notification delivery queue
  - File processing queue
  - Webhook delivery queue
  - Sync operation queue
  - Retry logic with exponential backoff

### Security
- HMAC-SHA256 request signing
- Device fingerprinting
- Anomaly detection with risk scoring
- IP whitelisting
- Password policy enforcement (12+ chars, complexity requirements)
- Audit logging for sensitive operations
- GDPR compliance (data export, deletion, anonymization)

### Performance
- Response compression
- ETag caching
- Redis caching layer
- Database query optimization with indexes
- Connection pooling
- Horizontal scaling support

### Supported Event Types (Webhooks)
- `user.created` - New user registered
- `user.updated` - User profile updated
- `user.deleted` - User account deleted
- `payment.completed` - Payment processed
- `payment.failed` - Payment failed
- `notification.sent` - Notification delivered
- `file.uploaded` - File uploaded
- `building.created` - Building created
- `webhook.test` - Test webhook event

### Breaking Changes
None - Initial release

### Deprecations
None - Initial release

### Known Issues
- Redis adapter for WebSocket requires Socket.IO v4.x compatibility
- FCM, APNS, and Web Push require external service configuration
- Malware scanning not yet implemented (Task 6.4)

---

## Version History

### [1.0.0] - 2026-02-19
- Initial production release
- Complete infrastructure implementation
- 80+ API endpoints
- 25+ database models
- 4 background job queues
- Multi-language support (English, Hebrew)
- Real-time communication (WebSocket + SSE)
- Webhook system for external integrations

---

## Upcoming Features

### [1.1.0] - Planned
- Malware scanning for uploaded files
- Enhanced Swagger documentation with examples
- Integration tests
- Performance tests
- CI/CD pipeline configuration

### [1.2.0] - Planned
- Additional language support
- Advanced analytics dashboards
- Enhanced webhook event types
- Rate limiting per endpoint
- API usage metrics

---

## Support

For API support, please contact:
- Email: support@horizon-hcm.com
- Documentation: http://localhost:3001/api/docs
- GitHub: [Repository URL]

## License

Proprietary - All rights reserved
