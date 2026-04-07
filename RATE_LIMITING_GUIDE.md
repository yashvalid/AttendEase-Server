# Rate Limiting Implementation Guide

## Overview
Rate limiting has been implemented to protect expensive APIs from abuse and excessive traffic. The system uses Redis-backed rate limiting for distributed performance and user-aware key generation.

## Rate Limit Categories

### 1. **Strict Limiter** (Most Restrictive)
- **Requests:** 10 per 15 minutes
- **Key Generation:** Per user ID
- **Applied to:**
  - Admin reports (attendance/class/student/department)
  - Dashboard statistics
  - User & class statistics endpoints
- **Use Case:** Expensive database aggregations and report generation

### 2. **Moderate Limiter** (Standard)
- **Requests:** 30 per 15 minutes  
- **Key Generation:** Per user ID
- **Applied to:**
  - Admin user/class/event listing (with pagination)
  - Attendance record retrieval
  - Department user lookup
  - Mark all absent operations
  - Attendance history retrieval
- **Use Case:** Regular read operations that query multiple records

### 3. **Attendance Mark Limiter** (Real-time)
- **Requests:** 5 per 1 minute
- **Key Generation:** Per user ID
- **Applied to:**
  - Mark attendance endpoint (`POST /event/mark_attendance`)
- **Use Case:** Prevents spam attendance marking within short time windows

### 4. **Authentication Limiter** (Brute Force Protection)
- **Requests:** 5 failed attempts per 15 minutes
- **Key Generation:** Per IP address
- **Applied to:**
  - User registration (`POST /user/register`)
  - User login (`POST /user/login`)
- **Skip Successful:** Yes (only counts failures)
- **Use Case:** Prevents brute force attacks and account enumeration

### 5. **Write Limiter** (Modification Protection)
- **Requests:** 20 per 15 minutes
- **Key Generation:** Per user ID
- **Applied to:**
  - Delete operations (users, classes, events, attendance records)
  - Update operations (user roles, class info, attendance status)
  - Class enrollment operations
  - Create class operations
- **Use Case:** Prevents rapid mass modifications

### 6. **Event Creation Limiter** (Event Spam Protection)
- **Requests:** 10 per 60 minutes
- **Key Generation:** Per user ID
- **Applied to:**
  - Create attendance event (`POST /event/attendance`)
- **Use Case:** Prevents teachers from creating excessive attendance events

## Rate Limit Response

When a request exceeds the rate limit, the API returns:

```json
{
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": 1234567890000
}
```

**Status Code:** `429 Too Many Requests`

## How It Works

1. **Redis Storage:** All rate limit counters are stored in Redis with prefix `rl:`
2. **User-Based Tracking:** Most limiters track by user ID for authenticated endpoints
3. **IP-Based Tracking:** Authentication endpoints track by IP to prevent distributed attacks
4. **Sliding Window:** Uses Redis to maintain sliding window counters

## Files Modified

### New Files Created:
- `middleware/rateLimiter.js` - Rate limiting middleware factory

### Files Updated:
- `app.js` - Initialize rate limiter
- `config/redis.js` - Export `getRedisClient()` helper
- `routes/users.routes.js` - Applied auth and write limiters
- `routes/attendance.routes.js` - Applied attendance, event, and report limiters
- `routes/admin.routes.js` - Applied strict, moderate, and write limiters
- `package.json` - Added dependencies:
  - `express-rate-limit@^7.1.5`
  - `rate-limit-redis@^4.2.0`

## Customization

To adjust limits, edit `middleware/rateLimiter.js`:

```javascript
// Example: Increase to 50 requests per 15 minutes
const moderateLimiter = () =>
    createLimiter({
        windowMs: 15 * 60 * 1000,
        max: 50,  // Changed from 30
        message: 'Too many requests. Please slow down.',
        keyGenerator: (req) => req.user?.user_id || req.ip,
    });
```

## Installation

```bash
cd Server
npm install
```

This will install the new dependencies:
- `express-rate-limit` - Express rate limiting middleware
- `rate-limit-redis` - Redis store for express-rate-limit

## Testing Rate Limits

### Test Authentication Limits (5 attempts per 15 min):
```bash
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/user/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

### Test Attendance Mark Limit (5 per minute):
```bash
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/event/mark_attendance \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"event_id":"123","latitude":0,"longitude":0}'
done
```

## Monitoring

Monitor rate limit hits in Redis:
```bash
redis-cli KEYS "rl:*"
redis-cli GET "rl:<key>"
```

## Best Practices

1. **Cache Results:** Combine with existing cache middleware to reduce actual hits
2. **User Communication:** Display retry-after times to frontend users
3. **Monitoring:** Set up alerts for unusually high rate limit hits
4. **Adjustments:** Monitor production usage and adjust limits as needed
5. **Alerts:** Consider implementing alerts for repeated rate limit breaches

## Security Considerations

- Rate limits protect against **DDoS attacks** on expensive endpoints
- Authentication endpoints use IP-based limiting to prevent brute force
- User-based limiting prevents individual users from overwhelming the system
- Combine with authentication tokens for defense-in-depth
- Cache middleware also helps reduce load on expensive operations

## Future Enhancements

1. Dynamic rate limiting based on system load
2. Graduated limits (higher for admin, lower for guests)
3. Whitelist trusted IP ranges
4. Per-endpoint analytics and alerts
5. Rate limit headers in responses (X-RateLimit-*)

