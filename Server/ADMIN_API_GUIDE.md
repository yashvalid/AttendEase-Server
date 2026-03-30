# Admin API Documentation

This guide provides comprehensive information about the Admin API endpoints for the Attendance System.

## Overview

The Admin API provides administrators with comprehensive tools to manage users, classes, attendance records, and generate reports. All admin endpoints require authentication with admin privileges.

## Getting Started

### Prerequisites
- Valid JWT token with admin role
- API base URL: `/api/admin`
- All requests must include the authentication token in headers

### Authentication
All requests must include:
```
Authorization: Bearer <JWT_TOKEN>
```

## API Response Format

### Success Response
```json
{
  "message": "Success message",
  "data": {...}
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

## Endpoints by Category

### 1. User Management (6 endpoints)
Manage system users, view user details, update roles, and get user statistics.

- `GET /users` - Get all users with pagination
- `GET /users/:user_id` - Get specific user
- `DELETE /users/:user_id` - Delete a user
- `PUT /users/:user_id/role` - Update user role
- `GET /users/department/:dep` - Get users by department
- `GET /statistics/users` - Get user statistics

### 2. Class Management (6 endpoints)
Manage classes, view enrolled students, and get class statistics.

- `GET /classes` - Get all classes (paginated)
- `GET /classes/:class_id` - Get class with students
- `DELETE /classes/:class_id` - Delete a class
- `PUT /classes/:class_id` - Update class info
- `DELETE /classes/:class_id/students/:student_id` - Remove student from class
- `GET /statistics/classes` - Get class statistics

### 3. Attendance Records (5 endpoints)
Manage and view attendance records with filtering and status updates.

- `GET /attendance/records` - Get all records (paginated, filterable)
- `GET /attendance/class/:class_id` - Get class attendance
- `GET /attendance/student/:student_id` - Get student attendance
- `DELETE /attendance/records/:record_id` - Delete record
- `PUT /attendance/records/:record_id/status` - Correct attendance status

### 4. Attendance Events (3 endpoints)
Manage attendance events and view event details.

- `GET /events` - Get all events (paginated)
- `GET /events/:event_id` - Get event with records
- `DELETE /events/:event_id` - Delete event

### 5. Analytics & Reports (4 endpoints)
Generate comprehensive reports and view system statistics.

- `GET /dashboard` - Dashboard overview
- `GET /reports/attendance/class/:class_id` - Class attendance report
- `GET /reports/attendance/student/:student_id` - Student attendance report
- `GET /reports/department/:dep` - Department attendance report

## Usage Examples

### Example 1: Get All Users
```bash
GET /api/admin/users?page=1&limit=10&role=student
```

Response:
```json
{
  "message": "Users retrieved successfully",
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "pages": 15
  }
}
```

### Example 2: Get Class Attendance Report
```bash
GET /api/admin/reports/attendance/class/class123
```

Response:
```json
{
  "message": "Class attendance report retrieved successfully",
  "data": {
    "class": {
      "class_id": "class123",
      "class_name": "CS101"
    },
    "report": [
      {
        "user_id": "user1",
        "name": "John Doe",
        "email": "john@example.com",
        "presentCount": 18,
        "absentCount": 2,
        "totalCount": 20,
        "attendancePercentage": "90%"
      }
    ]
  }
}
```

### Example 3: Update User Role
```bash
PUT /api/admin/users/user123/role
Content-Type: application/json

{
  "role": "teacher"
}
```

### Example 4: Get Dashboard Statistics
```bash
GET /api/admin/dashboard
```

Response:
```json
{
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "users": {
      "total": 500,
      "students": 400,
      "teachers": 100
    },
    "classes": 50,
    "events": 200,
    "attendance": {
      "totalRecords": 8000,
      "presentCount": 7600,
      "absentCount": 400,
      "attendancePercentage": "95%"
    }
  }
}
```

## Query Parameters

### Pagination
Most list endpoints support:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

### Filtering
Endpoints support various filters depending on the resource:

**User Endpoints:**
- `role` - Filter by 'student' or 'teacher'

**Class Endpoints:**
- `year` - Filter by year
- `dep` - Filter by department

**Attendance Endpoints:**
- `status` - Filter by 'present' or 'absent'
- `class_id` - Filter by class ID
- `student_id` - Filter by student ID

## HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 403 | Forbidden - Admin privileges required |
| 404 | Not Found - Resource not found |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error - Server error |

## Common Workflows

### Workflow 1: Monitor Class Attendance
1. Get all classes: `GET /classes`
2. Select a class and get detailed report: `GET /reports/attendance/class/{class_id}`
3. Correct any attendance errors: `PUT /attendance/records/{record_id}/status`

### Workflow 2: Manage Users
1. Get all users: `GET /users`
2. Filter by department: `GET /users/department/{dep}`
3. Update user role if needed: `PUT /users/{user_id}/role`
4. Delete inactive users: `DELETE /users/{user_id}`

### Workflow 3: Generate Reports
1. Get dashboard overview: `GET /dashboard`
2. Generate class report: `GET /reports/attendance/class/{class_id}`
3. Generate student report: `GET /reports/attendance/student/{student_id}`
4. Generate department report: `GET /reports/department/{dep}`

### Workflow 4: Manage Classes
1. View all classes: `GET /classes`
2. Get class details: `GET /classes/{class_id}`
3. Update class info: `PUT /classes/{class_id}`
4. Remove problematic students: `DELETE /classes/{class_id}/students/{student_id}`

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Descriptive error message"
}
```

Or for validation errors:

```json
{
  "errors": [
    {
      "msg": "Invalid role",
      "param": "role"
    }
  ]
}
```

## Security Considerations

1. **Authentication Required**: All endpoints require valid JWT token with admin role
2. **Role Validation**: Admin middleware validates user role on all requests
3. **Input Validation**: All inputs are validated using express-validator
4. **SQL Injection Protection**: Parameterized queries used for all database operations
5. **Rate Limiting**: Consider implementing rate limiting for production use

## Database Schema

The admin API works with the following main tables:
- `users` - User accounts (students, teachers, admins)
- `classes` - Class information
- `class_student` - Student-class enrollments
- `attendance_events` - Attendance sessions
- `attendance_records` - Individual attendance marks
- `user_years` - User academic years

## Pagination Best Practices

For optimal performance with large datasets:
- Use appropriate `limit` values (10-50 recommended)
- Navigate through pages sequentially
- Use filtering to reduce result sets

## Rate Limiting (Recommended)

For production deployment, consider implementing:
- 100 requests per minute for list endpoints
- 50 requests per minute for modification endpoints
- 1000 requests per minute per IP for dashboard endpoints

## Support & Troubleshooting

### Common Issues

**"Access denied. Admin privileges required"**
- Ensure user has admin role in database
- Verify JWT token is valid and not expired

**"Validation errors"**
- Check request body format
- Verify all required fields are provided
- Ensure data types match specification

**"Resource not found"**
- Verify IDs are correct
- Check resource exists before attempting operations

## API Limits

- Maximum results per page: 1000
- Minimum results per page: 1
- Default results per page: 10
- Maximum query timeout: 30 seconds

## Future Enhancements

Potential improvements for the admin API:
- Bulk user import/export
- Scheduled report generation
- Advanced filtering and search
- Data backup and restore
- Audit logging
- Two-factor authentication for admins
- Role-based access control (RBAC) improvements
- API key management
- Webhook support for real-time updates

## Related Documentation

- Main API Documentation: See `api.md`
- Authentication Guide: See middleware configuration
- Database Schema: See setup_db.js
