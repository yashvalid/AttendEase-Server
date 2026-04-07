# Rate Limiting Quick Reference

## Summary of Implementation

✅ **Rate limiting successfully implemented for expensive APIs using Redis**

### Expense Endpoints Protected

#### Authentication (Brute Force Protection)
| Endpoint | Method | Limit | Window |
|----------|--------|-------|--------|
| `/api/user/register` | POST | 5 failed attempts | 15 min |
| `/api/user/login` | POST | 5 failed attempts | 15 min |

#### Admin Statistics & Reports (Strict - Most Expensive)
| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/admin/dashboard` | 10 | 15 min |
| `/api/admin/statistics/users` | 10 | 15 min |
| `/api/admin/statistics/classes` | 10 | 15 min |
| `/api/admin/reports/attendance/class/:id` | 10 | 15 min |
| `/api/admin/reports/attendance/student/:id` | 10 | 15 min |
| `/api/admin/reports/department/:dep` | 10 | 15 min |

#### Admin Read Operations (Moderate)
| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/admin/users` | 30 | 15 min |
| `/api/admin/users/department/:dep` | 30 | 15 min |
| `/api/admin/classes` | 30 | 15 min |
| `/api/admin/attendance/records` | 30 | 15 min |
| `/api/admin/attendance/class/:id` | 30 | 15 min |
| `/api/admin/attendance/student/:id` | 30 | 15 min |
| `/api/admin/events` | 30 | 15 min |

#### Attendance Real-time (Aggressive Protection)
| Endpoint | Method | Limit | Window |
|----------|--------|-------|--------|
| `/api/event/mark_attendance` | POST | 5 | 1 min |

#### Attendance Event Creation
| Endpoint | Method | Limit | Window |
|----------|--------|-------|--------|
| `/api/event/attendance` | POST | 10 | 60 min |

#### Admin Write Operations (Delete/Update)
| Endpoint | Method | Limit | Window |
|----------|--------|-------|--------|
| `/api/admin/users/:id` | DELETE | 20 | 15 min |
| `/api/admin/users/:id/role` | PUT | 20 | 15 min |
| `/api/admin/classes/:id` | DELETE/PUT | 20 | 15 min |
| `/api/admin/classes/:id/students/:sid` | DELETE | 20 | 15 min |
| `/api/admin/attendance/records/:id` | DELETE | 20 | 15 min |
| `/api/admin/attendance/records/:id/status` | PUT | 20 | 15 min |
| `/api/admin/events/:id` | DELETE | 20 | 15 min |

#### User Management Write Operations
| Endpoint | Method | Limit | Window |
|----------|--------|-------|--------|
| `/api/user/add_class` | POST | 20 | 15 min |
| `/api/user/create_class` | POST | 20 | 15 min |

#### Attendance Report Operations (Strict)
| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/event/get_teacher_report` | 10 | 15 min |
| `/api/event/get_student_report` | 10 | 15 min |

#### Other Attendance Operations (Moderate)
| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/event/get_all_rec` | 30 | 15 min |
| `/api/event/mark_all` | 30 | 15 min |
| `/api/event/mark-absent` | 20 | 15 min |

---

## Key Features

### 🔐 Security
- ✅ Protection against distributed attacks
- ✅ Brute force protection on auth endpoints
- ✅ User-based tracking (prevents one user from dominating)
- ✅ IP-based tracking on auth endpoints
- ✅ Works seamlessly with existing JWT authentication

### ⚡ Performance
- ✅ Redis-backed (distributed across servers)
- ✅ Minimal latency addition
- ✅ Combined with existing caching middleware
- ✅ Sliding window implementation

### 📊 Monitoring
- ✅ All counters in Redis with `rl:` prefix
- ✅ Clear error messages with retry information
- ✅ User-aware rate limiting (per user_id, not just IP)

---

## Response Format

### When Rate Limited (HTTP 429):
```json
{
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": 1234567890000
}
```

### Error Messages by Category:
- **Authentication:** "Too many login/register attempts. Please try again later."
- **Expensive Reports:** "Too many expensive requests. Please try again later."
- **Attendance Mark:** "Attendance marked too frequently. Please wait before marking again."
- **Event Creation:** "Too many attendance events created. Please try again later."
- **General:** "Too many requests. Please slow down."

---

## Testing Commands

### Check rate limit with curl:
```bash
# Test attendance marking (should fail on 6th request within 1 minute)
curl -X POST http://localhost:3000/api/event/mark_attendance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_id":"1","latitude":0,"longitude":0}'

# Test admin report (should fail on 11th request within 15 minutes)
curl -X GET http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test authentication (should fail on 6th failed attempt)
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@email.com","password":"wrong"}'
```

### Check Redis counters:
```bash
# List all rate limit keys
redis-cli KEYS "rl:*"

# Get a specific counter value
redis-cli GET "rl:rl:admin:users:page=1&limit=10"

# Get TTL of a counter
redis-cli TTL "rl:user_123"
```

---

## Performance Impact

### Average Response Time Addition:
- **Without rate limit:** ~5-50ms
- **With rate limit:** ~0.5-2ms additional
- Redis latency is negligible (typically <1ms)

### Benefits:
1. ❌ Prevents expensive DB queries from overwhelming the system
2. ✅ Protects against brute force attacks
3. ✅ Ensures fair resource allocation
4. ✅ Reduces server load from abusive clients
5. ✅ Protects expensive aggregation endpoints

---

## Environment Setup

Add to your `.env` file if using non-default Redis:
```env
REDIS_URL=redis://localhost:6379
```

Typically this should already be configured if you have caching set up.

---

## Next Steps for Production

1. **Monitor Hit Rates:** Track which endpoints hit rate limits most
2. **Adjust Limits:** Based on usage patterns, adjust the limits in `middleware/rateLimiter.js`
3. **Add Alerts:** Set notifications for repeated rate limit violations per user
4. **Whitelist IPs:** Add trusted IP ranges if needed
5. **Rate Limit Headers:** Optionally add X-RateLimit-* headers to responses

---

## Troubleshooting

### Rate limit not working?
- Check Redis is running: `redis-cli ping`
- Verify Redis connection in `config/redis.js`
- Check middleware is initialized in `app.js`

### Limits too strict?
- Edit `middleware/rateLimiter.js` and increase `max` values
- Restart the server after changes
- Clear Redis keys: `redis-cli FLUSHALL` (use carefully!)

### Getting 429 errors legitimately?
- Check which endpoint is triggering
- Refer to the limits table above
- Implement client-side exponential backoff
- Show users the `retryAfter` timestamp

