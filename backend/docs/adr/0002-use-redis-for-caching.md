# 2. Use Redis for Caching

**Date**: 2026-02-24

**Status**: Accepted

## Context

Horizon-HCM needs to handle:
- Frequent reads of building and apartment data
- Complex financial reports that are expensive to compute
- User session management
- Real-time features (notifications, updates)
- Rate limiting for API endpoints

Performance requirements:
- API response times < 500ms for p95
- Support for 100+ concurrent users per building
- Efficient handling of repeated queries
- Session persistence across server restarts

Without caching:
- Database queries repeated unnecessarily
- Expensive report calculations run multiple times
- Poor response times under load
- Increased database load

## Decision

We will use **Redis** as our primary caching and session store.

**Implementation Details:**
- **Cache Layer**: Use Redis for application-level caching
- **Session Store**: Store user sessions in Redis
- **Rate Limiting**: Use Redis for distributed rate limiting
- **Real-time**: Use Redis pub/sub for real-time features (via Socket.IO adapter)
- **Client**: Use `redis` npm package (v5+)
- **Deployment**: Single Redis instance for development, Redis Cluster for production

**Cache Strategy:**
- **TTL-based**: Set appropriate TTLs for different data types
- **Cache-aside**: Application manages cache population
- **Invalidation**: Clear cache on write operations
- **Namespacing**: Use prefixes to organize keys (`horizon-hcm:cache:*`)

**Key Patterns:**
```
horizon-hcm:cache:building:{id}
horizon-hcm:cache:apartment:{id}
horizon-hcm:cache:report:{type}:{buildingId}:{params}
horizon-hcm:session:{sessionId}
horizon-hcm:ratelimit:{userId}:{endpoint}
```

## Consequences

### Positive Consequences
- **Performance**: Dramatically faster response times for cached data
- **Scalability**: Reduces database load, enables horizontal scaling
- **Session Management**: Fast, distributed session storage
- **Real-time**: Built-in pub/sub for WebSocket features
- **Rate Limiting**: Efficient distributed rate limiting
- **Flexibility**: Can cache any serializable data
- **Mature**: Battle-tested, widely used technology
- **Monitoring**: Rich ecosystem of monitoring tools

### Negative Consequences
- **Infrastructure**: Additional service to deploy and monitor
- **Complexity**: Cache invalidation can be tricky
- **Memory**: Requires sufficient RAM for cache data
- **Consistency**: Potential for stale data if not invalidated properly
- **Cost**: Additional hosting costs for Redis instance

### Neutral Consequences
- **Learning Curve**: Team needs to learn Redis commands and patterns
- **Debugging**: Cached data can make debugging harder
- **Testing**: Need to mock Redis in tests

## Alternatives Considered

### Alternative 1: In-Memory Cache (Node.js)
- **Description**: Use Node.js Map or libraries like `node-cache`
- **Pros**:
  - No external dependencies
  - Simple to implement
  - No network latency
  - No additional costs
- **Cons**:
  - Not shared across instances
  - Lost on server restart
  - Limited by Node.js memory
  - No pub/sub capabilities
  - No persistence
- **Why Rejected**: Doesn't work in multi-instance deployments

### Alternative 2: Memcached
- **Description**: Use Memcached for caching
- **Pros**:
  - Simple, fast
  - Mature technology
  - Good for simple key-value caching
- **Cons**:
  - No data persistence
  - No pub/sub
  - Limited data structures
  - No built-in rate limiting
  - Less feature-rich than Redis
- **Why Rejected**: Redis provides more features we need (pub/sub, sessions, rate limiting)

### Alternative 3: Database-level Caching
- **Description**: Rely on PostgreSQL query cache and connection pooling
- **Pros**:
  - No additional infrastructure
  - Automatic cache management
  - No consistency issues
- **Cons**:
  - Limited control over caching
  - Still hits database
  - Doesn't help with sessions or rate limiting
  - No pub/sub
- **Why Rejected**: Not sufficient for our performance requirements

### Alternative 4: CDN Caching
- **Description**: Use CDN (CloudFlare, CloudFront) for caching
- **Pros**:
  - Geographic distribution
  - DDoS protection
  - Reduces server load
- **Cons**:
  - Only works for GET requests
  - Doesn't help with sessions
  - No pub/sub
  - Less control over invalidation
- **Why Rejected**: Complementary to Redis, not a replacement (we can use both)

## References

- [Redis Documentation](https://redis.io/documentation)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Caching Strategies](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/Strategies.html)
- [Redis npm package](https://www.npmjs.com/package/redis)
- [Socket.IO Redis Adapter](https://socket.io/docs/v4/redis-adapter/)
