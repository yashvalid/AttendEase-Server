# Redis Caching Implementation Guide

## Overview
Redis caching has been fully integrated into your Attendance System APIs to improve performance by caching frequently accessed data and invalidating cache when data is modified.

## Architecture

### Cache Middleware
Located in `Server/middleware/cache.js`, provides:
- **`cache(ttl, keyFn)`**: Middleware to cache GET responses
  - `ttl`: Time-to-live in seconds (default: 300s)
  - `keyFn`: Optional function to generate custom cache keys
  - Automatically caches successful (200) responses
  - Handles Redis read/write errors gracefully

- **`invalidateCache(patterns)`**: Function to clear cache
  - Accepts pattern strings with wildcards (*)
  - Performs efficient pattern-based deletion
  - Logs cache busting operations

### Redis Configuration
Located in `Server/config/redis.js`:
- Auto-reconnection with exponential backoff (max 10 retries)
- Environment variable: `REDIS_URL` (defaults to `redis://localhost:6379`)
- Handles connection errors gracefully

---

## Cached Endpoints by Module

### User Routes (`/api/user`)

#### GET Endpoints (Cached - 5 min TTL)
| Endpoint | Cache Key | User | Purpose |
|----------|-----------|------|---------|
| `/classes` | `cache:user:classes:{user_id}` | Teacher | Get teacher's classes |
| `/student/classes` | `cache:student:classes:{user_id}` | Student | View available classes |
| `/enrolled-classes` | `cache:enrolled:classes:{user_id}` | Student | View enrolled classes |
| `/profile` | `cache:user:profile:{user_id}` | All | User profile info (10 min TTL) |

#### Write Endpoints (Cache Invalidation)
| Endpoint | Cache Invalidated | Purpose |
|----------|-------------------|---------|
| `POST /register` | `admin:users:*`, `admin:dept:*`, `admin:statistics*` | New user registration |
| `POST /create_class` | `user:classes:*`, `admin:classes:*`, `admin:statistics*` | Teacher creates class |
| `POST /add_class` | `student:classes:*`, `enrolled:classes:*`, `admin:statistics*` | Student enrolls in class |

---

### Attendance Routes (`/api/event`)

#### GET Endpoints (Cached)
| Endpoint | Cache Key | TTL | Purpose |
|----------|-----------|-----|---------|
| `/` | `cache:attendance:events:{user_id}` | 1 min | Active attendance events |
| `/get_unmarked_events` | `cache:attendance:unmarked:{user_id}` | 1 min | Unmarked events (teacher) |
| `/get_all_rec` | `cache:attendance:all:{user_id}` | 5 min | All attendance records |
| `/get_recs` | `cache:attendance:student:{user_id}` | 5 min | Student attendance history |
| `/get_teacher_report` | `cache:attendance:teacher_report:{user_id}` | 5 min | Teacher's attendance report |
| `/get_student_report` | `cache:attendance:student_report:{user_id}` | 5 min | Student's attendance report |

#### Write Endpoints (Cache Invalidation)
| Endpoint | Cache Invalidated | Purpose |
|----------|-------------------|---------|
| `POST /attendance` | `cache:attendance:*`, `cache:admin:*` | Publish attendance event |
| `POST /mark_attendance` | `cache:attendance:*`, `cache:admin:*` | Mark student attendance |
| `POST /mark_all` | `cache:attendance:*`, `cache:admin:*` | Mark all students absent |
| `PUT /mark-absent` | `cache:attendance:*`, `cache:admin:*` | Update attendance status |

---

### Admin Routes (`/api/admin`)

#### User Management GET Endpoints (Cached - 5 min TTL)
| Endpoint | Cache Key |
|----------|-----------|
| `/users` | `cache:admin:users:{query_params}` |
| `/users/:user_id` | `cache:admin:user:{user_id}` |
| `/users/department/:dep` | `cache:admin:dept:{dep}:{query_params}` |
| `/statistics/users` | `cache:admin:statistics:users` (10 min TTL) |

#### Class Management GET Endpoints (Cached - 5 min TTL)
| Endpoint | Cache Key |
|----------|-----------|
| `/classes` | `cache:admin:classes:{query_params}` |
| `/classes/:class_id` | `cache:admin:class:{class_id}` |
| `/statistics/classes` | `cache:admin:statistics:classes` (10 min TTL) |

#### Attendance GET Endpoints (Cached - 5 min TTL)
| Endpoint | Cache Key |
|----------|-----------|
| `/attendance/records` | `cache:admin:attendance:records:{query_params}` |
| `/attendance/class/:class_id` | `cache:admin:attendance:class:{class_id}` |
| `/attendance/student/:student_id` | `cache:admin:attendance:student:{student_id}` |
| `/events` | `cache:admin:events:{query_params}` |
| `/events/:event_id` | `cache:admin:event:{event_id}` |

#### Analytics GET Endpoints (Cached - 10 min TTL)
| Endpoint | Cache Key |
|----------|-----------|
| `/dashboard` | `cache:admin:dashboard` |
| `/reports/attendance/class/:class_id` | `cache:admin:report:class:{class_id}` |
| `/reports/attendance/student/:student_id` | `cache:admin:report:student:{student_id}` |
| `/reports/department/:dep` | `cache:admin:report:dept:{dep}` |

#### Write Endpoints (Cache Invalidation)
| Endpoint | Cache Invalidated |
|----------|-------------------|
| `DELETE /users/:user_id` | `admin:users:*`, `admin:dept:*`, `admin:statistics*` |
| `PUT /users/:user_id/role` | `admin:users:*`, `admin:dept:*`, `admin:classes:*`, `admin:statistics*` |
| `DELETE /classes/:class_id` | `user:classes:*`, `student:classes:*`, `admin:classes:*`, `admin:statistics*` |
| `PUT /classes/:class_id` | `user:classes:*`, `student:classes:*`, `admin:classes:*`, `admin:statistics*` |
| `DELETE /classes/:class_id/students/:student_id` | `student:classes:*`, `enrolled:classes:*`, `admin:class:*`, `admin:statistics*` |
| `DELETE /attendance/records/:record_id` | `attendance:*`, `admin:attendance:*`, `admin:statistics*` |
| `PUT /attendance/records/:record_id/status` | `attendance:*`, `admin:attendance:*`, `admin:statistics*` |
| `DELETE /events/:event_id` | `attendance:*`, `admin:events:*`, `admin:attendance:*`, `admin:statistics*` |

---

## Cache Key Patterns

### Pattern Types
1. **User-Specific**: Include `{user_id}` in key for personal data
2. **Query-Based**: Include sorted query parameters for filtered data
3. **ID-Based**: Include resource ID for specific records
4. **Wildcard**: Use `*` for pattern-based cache invalidation

### Examples
```
cache:user:classes:abc123          # User abc123's classes
cache:student:classes:def456       # Student def456's enrolled classes
cache:admin:classes:page:1:limit:10  # Pagination
cache:attendance:events:*          # All attendance events (pattern)
cache:admin:*                      # All admin data (pattern)
```

---

## Configuration

### Environment Variables
```bash
REDIS_URL=redis://localhost:6379  # Redis connection URL
```

### TTL Settings
- **Short-lived** (1 min): Active events, real-time data
- **Medium** (5 min): Class lists, attendance records
- **Long-lived** (10 min): Statistics, reports

---

## Cache Invalidation Strategy

### Scenarios
1. **User Creation**: Invalidates admin user lists and statistics
2. **Class Changes**: Invalidates teacher/student class lists and admin stats
3. **Attendance Events**: Invalidates all event and attendance caches
4. **Role Changes**: Invalidates user, class, and statistics caches
5. **Record Updates**: Invalidates attendance and admin attendance caches

### Wildcard Patterns
- `cache:admin:*` → All admin dashboard caches
- `cache:attendance:*` → All attendance-related caches
- `cache:*:classes:*` → All class-related caches
- `cache:user:*` → All user personal caches

---

## Implementation Details

### Files Modified
1. **Server/app.js**: Imported cache middleware
2. **Server/middleware/cache.js**: Already configured (unchanged)
3. **Server/config/redis.js**: Already configured (unchanged)

### Routes Updated
1. **Routes/users.routes.js**: Added cache middleware to GET endpoints
2. **Routes/attendance.routes.js**: Added cache middleware to GET endpoints
3. **Routes/admin.routes.js**: Added cache middleware to all GET endpoints

### Controllers Updated
1. **Controllers/users.controllers.js**: Added cache invalidation to write operations
2. **Controllers/attendance.controllers.js**: Added cache invalidation to write operations
3. **Controllers/admin.controllers.js**: Added cache invalidation to write operations

---

## Performance Benefits

### Expected Improvements
- **Database Load**: Reduced by 40-60% for read-heavy operations
- **Response Time**: 10-50ms cached vs 100-500ms database queries
- **Concurrent Users**: Better handling of simultaneous requests
- **Bandwidth**: Less network traffic between app and database

### Best Practices
1. Cache is validated on each request
2. Stale data is automatically expired after TTL
3. Cache is proactively invalidated on data changes
4. Errors don't crash the system (graceful fallback)
5. Monitor Redis memory usage

---

## Testing Cache

### Verify Cache is Working
```bash
# Check if Redis is connected
redis-cli ping  # Should return PONG

# Monitor cache keys
redis-cli KEYS "cache:*"

# Check specific key
redis-cli GET "cache:user:classes:abc123"

# Clear all cache (use with caution!)
redis-cli FLUSHDB
```

### Make a Cached Request
```bash
# First request (cache miss, hits database)
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/user/classes

# Second request within 5 minutes (cache hit)
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/user/classes  # Instant response
```

---

## Monitoring

### Redis Monitor
```bash
# Monitor all Redis commands in real-time
redis-cli MONITOR

# Get cache stats
redis-cli INFO stats
redis-cli INFO memory
```

### Application Logs
Cache operations are logged with:
- "Redis connected" → Connection successful
- "Busted X key(s)" → Cache invalidation successful
- "Redis error" → Connection/operation failures (gracefully handled)

---

## Troubleshooting

### Issue: Cache Not Working
1. Check Redis is running: `redis-cli ping`
2. Verify `REDIS_URL` environment variable
3. Check application logs for Redis errors
4. Restart Redis: `redis-cli shutdown && redis-server`

### Issue: Stale Data
1. TTL may be too long → Reduce TTL in route middleware
2. Cache not invalidating → Check controller invalidation calls
3. Check cache keys match exactly

### Issue: High Memory Usage
1. Check TTL values (reduce if needed)
2. Monitor cache key explosion (watch for unbounded keys)
3. Use `redis-cli DBSIZE` to check total keys
4. Implement periodic cleanup with `FLUSHDB` during off-peak

---

## Future Optimizations

1. **Selective Cache**: Cache only frequently accessed endpoints
2. **Compression**: Compress large cached responses
3. **Cache Warming**: Pre-populate cache with common queries
4. **TTL Tuning**: Adjust TTL based on data freshness requirements
5. **Cluster**: Use Redis clustering for high availability

---

## Support Commands

```bash
# Redis CLI connection
redis-cli

# Monitor real-time
redis-cli MONITOR

# Check memory
redis-cli INFO memory

# Get all cache keys
redis-cli KEYS "cache:*"

# Clear specific pattern
redis-cli --scan --pattern "cache:user:*" | xargs redis-cli DEL

# Check specific key
redis-cli GET "cache:admin:classes:page:1:limit:10"

# Database stats
redis-cli DBSIZE
redis-cli INFO stats
```

---

**Implementation Date**: April 2024
**Redis Module**: redis v4.6+
**Node.js Minimum**: v14.0.0
