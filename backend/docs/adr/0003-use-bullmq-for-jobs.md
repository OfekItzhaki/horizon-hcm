# 3. Use BullMQ for Background Jobs

**Date**: 2026-02-24

**Status**: Accepted

## Context

Horizon-HCM requires background job processing for:
- **Email Notifications**: Welcome emails, payment reminders, announcements
- **Report Generation**: PDF/CSV exports that take time to generate
- **File Processing**: Image optimization, document conversion
- **Scheduled Tasks**: Monthly invoices, payment reminders, report generation
- **Data Synchronization**: External system integrations
- **Cleanup Tasks**: Old file deletion, session cleanup

Requirements:
- Reliable job execution (retry on failure)
- Job scheduling (cron-like)
- Job prioritization
- Progress tracking
- Concurrent job processing
- Job result storage
- Dead letter queue for failed jobs

Without a job queue:
- Long-running tasks block HTTP requests
- No retry mechanism for failures
- Difficult to schedule recurring tasks
- Poor user experience (waiting for slow operations)
- No visibility into job status

## Decision

We will use **BullMQ** as our background job processing system.

**Implementation Details:**
- **Queue System**: BullMQ with Redis as the backing store
- **Integration**: Use `@nestjs/bullmq` for NestJS integration
- **Job Types**:
  - `notifications`: Email and push notifications
  - `reports`: Report generation and exports
  - `files`: File processing and optimization
  - `scheduled`: Recurring tasks
- **Configuration**:
  - Retry failed jobs with exponential backoff
  - Store completed jobs for 7 days
  - Store failed jobs for 30 days
  - Concurrent workers based on job type

**Queue Structure:**
```typescript
// Define queues
@InjectQueue('notifications')
@InjectQueue('reports')
@InjectQueue('files')

// Process jobs
@Processor('notifications')
export class NotificationProcessor {
  @Process('send-email')
  async sendEmail(job: Job) {
    // Process email
  }
}
```

**Job Options:**
```typescript
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: {
    age: 7 * 24 * 3600, // 7 days
  },
  removeOnFail: {
    age: 30 * 24 * 3600, // 30 days
  },
}
```

## Consequences

### Positive Consequences
- **Reliability**: Jobs are persisted and survive server restarts
- **Retry Logic**: Automatic retry with exponential backoff
- **Scheduling**: Built-in cron-like scheduling
- **Monitoring**: Web UI (Bull Board) for job monitoring
- **Performance**: Non-blocking, improves API response times
- **Scalability**: Can add more workers to process jobs faster
- **Priority**: Support for job prioritization
- **Progress**: Track job progress and status
- **TypeScript**: Full TypeScript support
- **Active Development**: Well-maintained, modern library

### Negative Consequences
- **Complexity**: Additional system to understand and maintain
- **Redis Dependency**: Requires Redis (but we already use it)
- **Memory**: Jobs stored in Redis consume memory
- **Debugging**: Async job execution can be harder to debug
- **Testing**: Need to mock job queues in tests

### Neutral Consequences
- **Migration**: Moving from Bull to BullMQ (if upgrading)
- **Learning Curve**: Team needs to learn BullMQ patterns
- **Monitoring**: Need to set up Bull Board or similar

## Alternatives Considered

### Alternative 1: Bull (Original)
- **Description**: Use the original Bull library
- **Pros**:
  - Mature, stable
  - Large community
  - Good documentation
- **Cons**:
  - Older codebase
  - Less active development
  - Missing some modern features
  - BullMQ is the recommended successor
- **Why Rejected**: BullMQ is the modern, actively developed version

### Alternative 2: Agenda
- **Description**: Use Agenda with MongoDB
- **Pros**:
  - MongoDB-based (if already using MongoDB)
  - Simple API
  - Good for scheduled jobs
- **Cons**:
  - Requires MongoDB
  - Less feature-rich than BullMQ
  - Smaller community
  - Performance concerns at scale
- **Why Rejected**: We use PostgreSQL, not MongoDB; BullMQ is more feature-rich

### Alternative 3: AWS SQS + Lambda
- **Description**: Use AWS SQS for queuing and Lambda for processing
- **Pros**:
  - Fully managed
  - Infinite scalability
  - Pay per use
  - No infrastructure to manage
- **Cons**:
  - Vendor lock-in
  - More complex setup
  - Higher costs at scale
  - Cold start latency
  - Requires AWS infrastructure
- **Why Rejected**: Want to keep infrastructure simple and portable

### Alternative 4: RabbitMQ
- **Description**: Use RabbitMQ message broker
- **Pros**:
  - Feature-rich
  - Multiple protocols
  - Mature technology
  - Good for complex routing
- **Cons**:
  - Additional infrastructure
  - More complex than needed
  - Steeper learning curve
  - Requires separate service
- **Why Rejected**: Overkill for our needs; BullMQ with Redis is simpler

### Alternative 5: Node.js Worker Threads
- **Description**: Use built-in worker threads
- **Pros**:
  - No external dependencies
  - Fast (in-process)
  - Simple for CPU-intensive tasks
- **Cons**:
  - No persistence
  - No retry logic
  - No scheduling
  - Lost on restart
  - Doesn't scale across instances
- **Why Rejected**: Not suitable for distributed systems

## References

- [BullMQ Documentation](https://docs.bullmq.io/)
- [NestJS BullMQ Integration](https://docs.nestjs.com/techniques/queues)
- [Bull Board (Monitoring UI)](https://github.com/felixmosh/bull-board)
- [BullMQ Best Practices](https://docs.bullmq.io/guide/best-practices)
- [Redis as a Job Queue](https://redis.io/docs/manual/patterns/distributed-locks/)
