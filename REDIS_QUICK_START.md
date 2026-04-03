# Redis Caching Quick Reference

## TL;DR - What Was Implemented

✅ **Redis caching middleware** - Automatic response caching for GET endpoints
✅ **Smart invalidation** - Cache automatically cleared when data changes
✅ **Error handling** - System works even if Redis fails
✅ **All routes cached** - User, Attendance, and Admin endpoints
✅ **Production ready** - Proper TTLs and patterns

---

## How It Works

### 1. Request Flow (GET endpoint)
```
Client Request
    ↓
Check Redis Cache
    ↓ (Hit)
Return cached response (fast!)
    ↓ (Miss)
Query Database
    ↓
Cache response in Redis
    ↓
Return response to client
```

### 2. Data Change Flow (POST/PUT/DELETE)
```
Client Request
    ↓
Process Change (insert/update/delete)
    ↓
Clear related cache patterns
    ↓
Return response
    ↓
Next GET request fetches fresh data
```

---

## Quick Start

### Prerequisites
- Redis running: `redis-server`
- Environment variable set: `REDIS_URL=redis://localhost:6379`

### Test It
```bash
# Terminal 1: Watch Redis
redis-cli MONITOR

# Terminal 2: Start server
npm start

# Terminal 3: Test request (first call = database hit)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/user/classes

# Test again (cache hit - should be instant)
Same curl command
```

---

## Cache Key Naming Convention

Format: `cache:{module}:{resource}:{identifier}`

Examples:
```
cache:user:classes:user_abc123              # User's classes
cache:student:classes:user_xyz789           # Student's available classes
cache:attendance:events:user_def456         # Active attendance events
cache:admin:users:page:1:limit:10           # Paginated user list
cache:admin:statistics:users                # User statistics
```

---

## TTL (Time-To-Live) Reference

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Active Events | 1 min | Real-time changes |
| Attendance Records | 5 min | Normal updates |
| Class Lists | 5 min | Not frequently changed |
| User Profiles | 10 min | Stable data |
| Statistics | 10 min | Aggregate data |

---

## Adding Cache to New Endpoints

### For GET endpoints:
```javascript
// routes/example.routes.js
const { cache } = require('../middleware/cache');

router.get('/my-endpoint',
    authenticateToken,
    cache(300, (req) => `cache:module:resource:${req.user.user_id}`),
    controllerFunction
);
```

### For POST/PUT/DELETE endpoints:
```javascript
// controllers/example.controllers.js
const { invalidateCache } = require('../middleware/cache');

exports.updateData = async (req, res) => {
    // ... do your update logic ...
    
    // Clear related cache
    await invalidateCache([
        'cache:module:resource:*',
        'cache:other:related:*'
    ]);
    
    res.status(200).json({ message: 'Updated' });
};
```

---

## Cache Key Patterns Explained

### Specific Keys
```javascript
// Single user's data
`cache:user:classes:${user_id}`

// Specific resource
`cache:admin:class:${class_id}`
```

### Pattern Wildcards
```javascript
// All user class caches
'cache:user:classes:*'

// All admin data
'cache:admin:*'

// All caches
'cache:*'
```

---

## Monitoring Commands

```bash
# See all cache keys
redis-cli KEYS "cache:*"

# Count total cache keys
redis-cli KEYS "cache:*" | wc -l

# Check specific key value
redis-cli GET "cache:user:classes:abc123"

# See memory usage
redis-cli INFO memory

# Clear all cache (careful!)
redis-cli FLUSHDB

# Clear specific pattern
redis-cli DEL $(redis-cli KEYS "cache:user:classes:*")

# Real-time monitoring
redis-cli MONITOR

# Check Redis stats
redis-cli INFO stats
```

---

## Common Cache Invalidation Scenarios

| Action | Cache Cleared |
|--------|--------------|
| New user registers | All admin user caches |
| Teacher creates class | All class and user caches |
| Student enrolls in class | Student's class list cache |
| Attendance event created | All attendance caches |
| Attendance marked | Event and attendance caches |
| Admin deletes user | Admin and statistics caches |
| Admin updates role | User, class, and statistics caches |

---

## Debugging

### Is cache being used?
```bash
# Method 1: Monitor Redis
redis-cli MONITOR

# Method 2: Check logs (look for timing)
# Cached response: ~5-10ms
# Database query: ~100-500ms

# Method 3: Disable cache temporarily
# Comment out cache middleware in routes
```

### Cache not clearing?
1. Check invalidateCache is called in controller
2. Verify cache key pattern matches
3. Test with `redis-cli KEYS "pattern"`
4. Manually clear: `redis-cli FLUSHDB`

### Redis not connecting?
1. Check Redis is running: `redis-cli ping` → should be `PONG`
2. Check REDIS_URL environment variable
3. Check Redis port (default 6379)
4. Check firewall/network access

---

## Performance Gains

### Without Cache
```
10 users with 5 requests/sec = 50 requests/sec
Database response: 200ms average
Server load: High
```

### With Cache (estimated)
```
10 users with 5 requests/sec = 50 requests/sec
- 60% cache hits @ 10ms = 30 requests/sec
- 40% cache miss @ 200ms = 20 requests/sec
Average: 110ms per request (50% faster)
Server load: Reduced 40-60%
```

---

## Best Practices

✅ **DO**
- Use specific cache keys for user-specific data
- Include identifiers (user_id, class_id) in cache keys
- Use wildcards for pattern-based invalidation
- Monitor Redis memory usage
- Test cache effectiveness

❌ **DON'T**
- Cache sensitive/unauthorized data without auth checks
- Use overly long TTLs (risk of stale data)
- Invalidate more cache than necessary
- Store encrypted passwords or tokens
- Ignore Redis errors in production

---

## Environment Setup

```bash
# .env file
REDIS_URL=redis://localhost:6379
PORT=3000
JWT_SECRET=your_secret_key
```

```bash
# Install Redis (macOS)
brew install redis
brew services start redis

# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server
sudo systemctl start redis-server

# Install Redis (Windows)
# Use WSL or download from: https://github.com/microsoftarchive/redis/releases
```

---

## Support

For issues:
1. Check Redis is running: `redis-cli ping`
2. Check logs for Redis errors
3. Verify cache keys with `redis-cli KEYS "cache:*"`
4. Test with manual `redis-cli` commands
5. Review REDIS_IMPLEMENTATION.md for detailed docs

---

**Status**: ✅ Production Ready
**Last Updated**: April 2024
