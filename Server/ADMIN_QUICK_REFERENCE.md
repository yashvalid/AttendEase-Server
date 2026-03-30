# Admin API Quick Reference

## Base URL
```
/api/admin
```

## Authentication
All requests require JWT token with admin role in header:
```
Authorization: Bearer <token>
```

---

## 📊 DASHBOARD & STATISTICS

### Dashboard Overview
```
GET /dashboard
→ Total users (students/teachers), classes, events, attendance percentage
```

### User Statistics
```
GET /statistics/users
→ Total users, department breakdown, recent registrations
```

### Class Statistics
```
GET /statistics/classes
→ Total classes, department breakdown, avg students per class
```

---

## 👥 USER MANAGEMENT

| Operation | Endpoint | Method |
|-----------|----------|--------|
| List all users | `/users?page=1&limit=10&role=student` | GET |
| Get user | `/users/:user_id` | GET |
| Get by department | `/users/department/:dep?role=teacher` | GET |
| Update role | `/users/:user_id/role` | PUT |
| Delete user | `/users/:user_id` | DELETE |

**Update Role Request Body:**
```json
{ "role": "student" or "teacher" }
```

---

## 📚 CLASS MANAGEMENT

| Operation | Endpoint | Method |
|-----------|----------|--------|
| List all classes | `/classes?page=1&limit=10&year=2024&dep=CSE` | GET |
| Get class details | `/classes/:class_id` | GET |
| Update class | `/classes/:class_id` | PUT |
| Delete class | `/classes/:class_id` | DELETE |
| Remove student | `/classes/:class_id/students/:student_id` | DELETE |

**Update Class Request Body:**
```json
{
  "class_name": "CS101",
  "year": "2024"
}
```

---

## 📝 ATTENDANCE RECORDS

| Operation | Endpoint | Method |
|-----------|----------|--------|
| List all records | `/attendance/records?page=1&limit=10&status=present` | GET |
| Get class attendance | `/attendance/class/:class_id?status=absent` | GET |
| Get student attendance | `/attendance/student/:student_id` | GET |
| Update status | `/attendance/records/:record_id/status` | PUT |
| Delete record | `/attendance/records/:record_id` | DELETE |

**Update Status Request Body:**
```json
{ "status": "present" or "absent" }
```

---

## 🎫 ATTENDANCE EVENTS

| Operation | Endpoint | Method |
|-----------|----------|--------|
| List all events | `/events?page=1&limit=10&class_id=class123` | GET |
| Get event details | `/events/:event_id` | GET |
| Delete event | `/events/:event_id` | DELETE |

---

## 📈 REPORTS

### Class Attendance Report
```
GET /reports/attendance/class/:class_id
→ Per-student attendance with percentage
```

### Student Attendance Report
```
GET /reports/attendance/student/:student_id
→ Attendance across all enrolled classes
```

### Department Report
```
GET /reports/department/:dep
→ Attendance summary for all classes in department
```

---

## 🔍 FILTERING & PAGINATION

### Common Query Parameters
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10)
- `role` - Filter users: `student` or `teacher`
- `status` - Filter attendance: `present` or `absent`
- `year` - Filter classes by year
- `dep` - Filter by department
- `class_id` - Filter by class
- `student_id` - Filter by student

### Example Requests
```bash
# Get page 2 of students in CSE department
GET /users/department/CSE?role=student&page=2&limit=20

# Get absent attendance records
GET /attendance/records?status=absent&limit=50

# Get classes from 2024
GET /classes?year=2024&limit=100
```

---

## ✅ SUCCESS RESPONSES

### List Response (Paginated)
```json
{
  "message": "Success",
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

### Single Resource Response
```json
{
  "message": "Success",
  "data": { ... }
}
```

### Statistics Response
```json
{
  "message": "Success",
  "data": { ... }
}
```

---

## ❌ ERROR RESPONSES

| Status | Error |
|--------|-------|
| 403 | Access denied (not admin) |
| 404 | Resource not found |
| 422 | Validation error |
| 500 | Server error |

```json
{
  "error": "Error message"
}
```

---

## 🔐 IMPORTANT NOTES

✓ All endpoints require admin JWT token  
✓ Admin role must exist in users table  
✓ All operations are logged  
✓ Cascading deletes apply to related records  
✓ Pagination improves performance with large datasets  

---

## 📋 SAMPLE WORKFLOWS

### Monitor Attendance
```
1. GET /dashboard → Overview
2. GET /reports/department/CSE → Department stats
3. GET /reports/attendance/class/class123 → Class details
4. PUT /attendance/records/123/status → Correct errors
```

### Manage Classes
```
1. GET /classes → List all
2. GET /classes/class123 → View details
3. PUT /classes/class123 → Update info
4. DELETE /classes/class123/students/user1 → Remove student
```

### User Management
```
1. GET /users → List all
2. GET /users/department/CSE → Filter by dept
3. PUT /users/user1/role → Change role
4. DELETE /users/user1 → Remove user
```

---

For detailed documentation, see `ADMIN_API_GUIDE.md`
