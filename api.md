# API Documentation

Base URL: `/api`

## Users Module (`/user`)

### 1. Register User
**Endpoint:** `POST /user/register`  
**Description:** Registers a new user (student or teacher).  
**Access:** Public

**Request Body:**
```json
{
  "name": "string (1-15 chars)",
  "email": "string (valid email)",
  "password": "string (min 7 chars)",
  "role": "teacher" | "student",
  "year": ["string"] (array of years),
  "dep": "string"
}
```

**Responses:**
- `201 Created`: `{ "message": "Registration successfull" }`
- `422 Unprocessable Entity`: Validation errors.
- `404 Not Found`: `{ "error": "Email already exists" }`
- `500 Internal Server Error`: `{ "error": "Registration failed!" }`

---

### 2. Login
**Endpoint:** `POST /user/login`  
**Description:** Authenticates a user and returns a JWT token.  
**Access:** Public

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Responses:**
- `200 OK`:
  ```json
  {
    "message": "Login successfull",
    "token": "jwt_token_string",
    "user_id": "string",
    "role": "string"
  }
  ```
- `422 Unprocessable Entity`: Validation errors.
- `401 Unauthorized`: `{ "message": "Invalid email or password" }`
- `500 Internal Server Error`: `{ "error": "Login failed" }`

---

### 3. Create Class
**Endpoint:** `POST /user/create_class`  
**Description:** Creates a new class.  
**Access:** Teacher

**Request Body:**
```json
{
  "class_name": "string",
  "year": "string"
}
```

**Responses:**
- `201 Created`: `{ "message": "Class created successfully", "class_id": "string" }`
- `422 Unprocessable Entity`: Validation errors.
- `403 Forbidden`: `{ "error": "Only teachers can create classes" }`
- `500 Internal Server Error`: `{ "error": "Internal server error" }`

---

### 4. Enroll in Class (Add Class)
**Endpoint:** `POST /user/add_class`  
**Description:** Enrolls the logged-in student into a class.  
**Access:** Student (Authenticated)

**Request Body:**
```json
{
  "class_id": "string",
  "year": "string"
}
```

**Responses:**
- `201 Created`: `{ "message": "Class added" }`
- `422 Unprocessable Entity`: Validation errors.
- `404 Not Found`: `{ "error": "Class ID not found" }`
- `409 Conflict`: `{ "error": "Class already added" }`
- `500 Internal Server Error`: `{ "message": "Error add class" }`

---

### 5. Get Teacher's Classes
**Endpoint:** `GET /user/classes`  
**Description:** Retrieves classes created by the logged-in teacher.  
**Access:** Teacher

**Responses:**
- `200 OK`: `{ "classes": [...] }`
- `403 Forbidden`: `{ "error": "Unauthorized" }`
- `500 Internal Server Error`: `{ "error": "Internal server error" }`

---

### 6. Get Student's Available Classes
**Endpoint:** `GET /user/student/classes`  
**Description:** Retrieves classes available for the student based on their department and year.  
**Access:** Student

**Responses:**
- `200 OK`: `{ "classes": [...] }`
- `403 Forbidden`: `{ "error": "Unauthorized" }`
- `500 Internal Server Error`: `{ "error": "Internal server error" }`

---

### 7. Get Enrolled Classes
**Endpoint:** `GET /user/enrolled-classes`  
**Description:** Retrieves classes for the student (currently fetches based on department/year similar to available classes).  
**Access:** Student

**Responses:**
- `200 OK`: `{ "classes": [...] }`
- `403 Forbidden`: `{ "error": "Unauthorized" }`
- `500 Internal Server Error`: `{ "error": "Internal server error" }`

---

## Attendance Module (`/event`)

### 1. Publish Attendance Event
**Endpoint:** `POST /event/attendance`  
**Description:** Creates a new attendance event and notifies students via socket.  
**Access:** Teacher

**Request Body:**
```json
{
  "class_id": "string",
  "event_name": "string",
  "latitude": number,
  "longitude": number
}
```

**Responses:**
- `201 Created`: `{ "message": "attendance event created", "insertId": number }`
- `422 Unprocessable Entity`: Validation errors.
- `401 Unauthorized`: `{ "message": "Unauthorized" }`
- `500 Internal Server Error`: `{ "error": "event creation failed!" }`

---

### 2. Get Active Attendance Events
**Endpoint:** `GET /event/`  
**Description:** Retrieves active attendance events for the logged-in student.  
**Access:** Student (Authenticated)

**Responses:**
- `200 OK`: `{ "evnt": [...] }`
- `200 OK` (Empty): `{ "message": "No current attendance event" }`
- `500 Internal Server Error`: `{ "error": "Internal server error" }`

---

### 3. Mark Attendance
**Endpoint:** `POST /event/mark_attendance`  
**Description:** Student marks their attendance for a specific event. Checks for time window and location radius (10m).  
**Access:** Student (Authenticated)

**Request Body:**
```json
{
  "event_id": "string",
  "latitude": number,
  "longitude": number
}
```

**Responses:**
- `201 Created`: `{ "message": "Attendance marked", "insertId": number }`
- `422 Unprocessable Entity`: Validation errors.
- `404 Not Found`: `{ "message": "Event not found" }`
- `400 Bad Request`: `{ "message": "Event not started yet" }`
- `410 Gone`: `{ "message": "Too late" }`
- `403 Forbidden`: `{ "message": "Outside allowed radius" }`
- `409 Conflict`: `{ "message": "Attendance already marked" }`
- `500 Internal Server Error`: `{ "error": "Internal server error" }`

---

## Admin Module (`/admin`)

**Access Control:** All endpoints require authentication and admin role.

### USER MANAGEMENT

#### 1. Get All Users
**Endpoint:** `GET /admin/users`  
**Description:** Retrieves all users with pagination. Supports filtering by role.  
**Access:** Admin (Authenticated)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `role` (optional): Filter by role ('student' or 'teacher')

**Responses:**
- `200 OK`:
  ```json
  {
    "message": "Users retrieved successfully",
    "data": [
      {
        "user_id": "string",
        "name": "string",
        "email": "string",
        "role": "string",
        "dep": "string",
        "created_at": "datetime"
      }
    ],
    "pagination": {
      "total": number,
      "page": number,
      "limit": number,
      "pages": number
    }
  }
  ```
- `500 Internal Server Error`: `{ "error": "Failed to retrieve users" }`

---

#### 2. Get User By ID
**Endpoint:** `GET /admin/users/:user_id`  
**Description:** Retrieves a specific user's details.  
**Access:** Admin (Authenticated)

**Responses:**
- `200 OK`:
  ```json
  {
    "message": "User retrieved successfully",
    "data": {
      "user_id": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "dep": "string",
      "created_at": "datetime"
    }
  }
  ```
- `404 Not Found`: `{ "error": "User not found" }`
- `500 Internal Server Error`: `{ "error": "Failed to retrieve user" }`

---

#### 3. Delete User
**Endpoint:** `DELETE /admin/users/:user_id`  
**Description:** Deletes a user from the system.  
**Access:** Admin (Authenticated)

**Responses:**
- `200 OK`: `{ "message": "User deleted successfully" }`
- `404 Not Found`: `{ "error": "User not found" }`
- `500 Internal Server Error`: `{ "error": "Failed to delete user" }`

---

#### 4. Update User Role
**Endpoint:** `PUT /admin/users/:user_id/role`  
**Description:** Changes a user's role (student/teacher).  
**Access:** Admin (Authenticated)

**Request Body:**
```json
{
  "role": "student" | "teacher"
}
```

**Responses:**
- `200 OK`: `{ "message": "User role updated successfully" }`
- `404 Not Found`: `{ "error": "User not found" }`
- `422 Unprocessable Entity`: `{ "error": "Invalid role. Must be student or teacher" }`
- `500 Internal Server Error`: `{ "error": "Failed to update user role" }`

---

#### 5. Get Users By Department
**Endpoint:** `GET /admin/users/department/:dep`  
**Description:** Retrieves all users in a specific department.  
**Access:** Admin (Authenticated)

**Query Parameters:**
- `role` (optional): Filter by role ('student' or 'teacher')

**Responses:**
- `200 OK`:
  ```json
  {
    "message": "Users in {dep} retrieved successfully",
    "data": [...]
  }
  ```
- `500 Internal Server Error`: `{ "error": "Failed to retrieve users" }`

---

#### 6. Get User Statistics
**Endpoint:** `GET /admin/statistics/users`  
**Description:** Retrieves overall user statistics.  
**Access:** Admin (Authenticated)

**Responses:**
- `200 OK`:
  ```json
  {
    "message": "User statistics retrieved successfully",
    "data": {
      "totalUsers": number,
      "totalStudents": number,
      "totalTeachers": number,
      "departmentStats": [
        {
          "dep": "string",
          "count": number
        }
      ],
      "recentUsers": [...]
    }
  }
  ```
- `500 Internal Server Error`: `{ "error": "Failed to retrieve statistics" }`

---

### CLASS MANAGEMENT

#### 7. Get All Classes
**Endpoint:** `GET /admin/classes`  
**Description:** Retrieves all classes with pagination and enrollment counts.  
**Access:** Admin (Authenticated)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `year` (optional): Filter by year
- `dep` (optional): Filter by department

**Responses:**
- `200 OK`:
  ```json
  {
    "message": "Classes retrieved successfully",
    "data": [
      {
        "class_id": "string",
        "class_name": "string",
        "teacher_id": "string",
        "teacher_name": "string",
        "teacher_email": "string",
        "created_at": "datetime",
        "enrolled_students": number
      }
    ],
    "pagination": {...}
  }
  ```
- `500 Internal Server Error`: `{ "error": "Failed to retrieve classes" }`

---

#### 8. Get Class By ID
**Endpoint:** `GET /admin/classes/:class_id`  
**Description:** Retrieves detailed information about a class including enrolled students.  
**Access:** Admin (Authenticated)

**Responses:**
- `200 OK`:
  ```json
  {
    "message": "Class retrieved successfully",
    "data": {
      "class_id": "string",
      "class_name": "string",
      "teacher_name": "string",
      "teacher_email": "string",
      "enrolled_students": number,
      "created_at": "datetime",
      "students": [
        {
          "user_id": "string",
          "name": "string",
          "email": "string",
          "joined_at": "datetime"
        }
      ]
    }
  }
  ```
- `404 Not Found`: `{ "error": "Class not found" }`
- `500 Internal Server Error`: `{ "error": "Failed to retrieve class" }`

---

#### 9. Delete Class
**Endpoint:** `DELETE /admin/classes/:class_id`  
**Description:** Deletes a class and all associated records.  
**Access:** Admin (Authenticated)

**Responses:**
- `200 OK`: `{ "message": "Class deleted successfully" }`
- `404 Not Found`: `{ "error": "Class not found" }`
- `500 Internal Server Error`: `{ "error": "Failed to delete class" }`

---

#### 10. Update Class
**Endpoint:** `PUT /admin/classes/:class_id`  
**Description:** Updates class information (name and/or year).  
**Access:** Admin (Authenticated)

**Request Body:**
```json
{
  "class_name": "string (optional)",
  "year": "string (optional)"
}
```

**Responses:**
- `200 OK`: `{ "message": "Class updated successfully" }`
- `404 Not Found`: `{ "error": "Class not found" }`
- `422 Unprocessable Entity`: `{ "error": "No fields to update" }`
- `500 Internal Server Error`: `{ "error": "Failed to update class" }`

---

#### 11. Remove Student From Class
**Endpoint:** `DELETE /admin/classes/:class_id/students/:student_id`  
**Description:** Removes a student from a class.  
**Access:** Admin (Authenticated)

**Responses:**
- `200 OK`: `{ "message": "Student removed from class successfully" }`
- `404 Not Found`: `{ "error": "Student not enrolled in this class" }`
- `500 Internal Server Error`: `{ "error": "Failed to remove student" }`

---

#### 12. Get Class Statistics
**Endpoint:** `GET /admin/statistics/classes`  
**Description:** Retrieves overall class statistics.  
**Access:** Admin (Authenticated)

**Responses:**
- `200 OK`:
  ```json
  {
    "message": "Class statistics retrieved successfully",
    "data": {
      "totalClasses": number,
      "classesPerDepartment": [...],
      "averageStudentsPerClass": number
    }
  }
  ```
- `500 Internal Server Error`: `{ "error": "Failed to retrieve statistics" }`

---

### ATTENDANCE MANAGEMENT

#### 13. Get All Attendance Records
**Endpoint:** `GET /admin/attendance/records`  
**Description:** Retrieves all attendance records with pagination and filters.  
**Access:** Admin (Authenticated)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by 'present' or 'absent'
- `class_id` (optional): Filter by class
- `student_id` (optional): Filter by student

**Responses:**
- `200 OK`:
  ```json
  {
    "message": "Attendance records retrieved successfully",
    "data": [
      {
        "record_id": number,
        "event_id": number,
        "student_id": "string",
        "student_name": "string",
        "event_name": "string",
        "class_id": "string",
        "class_name": "string",
        "status": "present" | "absent",
        "marked_at": "datetime"
      }
    ],
    "pagination": {...}
  }
  ```
- `500 Internal Server Error`: `{ "error": "Failed to retrieve attendance records" }`

---

#### 14. Get Attendance By Class
**Endpoint:** `GET /admin/attendance/class/:class_id`  
**Description:** Retrieves all attendance records for a specific class.  
**Access:** Admin (Authenticated)

**Query Parameters:**
- `status` (optional): Filter by 'present' or 'absent'

**Responses:**
- `200 OK`:
  ```json
  {
    "message": "Class attendance records retrieved successfully",
    "data": [...]
  }
  ```
- `500 Internal Server Error`: `{ "error": "Failed to retrieve attendance" }`

---

#### 15. Get Attendance By Student
**Endpoint:** `GET /admin/attendance/student/:student_id`  
**Description:** Retrieves all attendance records for a specific student.  
**Access:** Admin (Authenticated)

**Responses:**
- `200 OK`:
  ```json
  {
    "message": "Student attendance records retrieved successfully",
    "data": [...]
  }
  ```
- `500 Internal Server Error`: `{ "error": "Failed to retrieve attendance" }`

---

#### 16. Delete Attendance Record
**Endpoint:** `DELETE /admin/attendance/records/:record_id`  
**Description:** Deletes an attendance record.  
**Access:** Admin (Authenticated)

**Responses:**
- `200 OK`: `{ "message": "Attendance record deleted successfully" }`
- `404 Not Found`: `{ "error": "Attendance record not found" }`
- `500 Internal Server Error`: `{ "error": "Failed to delete attendance record" }`

---

#### 17. Update Attendance Status
**Endpoint:** `PUT /admin/attendance/records/:record_id/status`  
**Description:** Corrects an attendance record's status.  
**Access:** Admin (Authenticated)

**Request Body:**
```json
{
  "status": "present" | "absent"
}
```

**Responses:**
- `200 OK`: `{ "message": "Attendance status updated successfully" }`
- `404 Not Found`: `{ "error": "Attendance record not found" }`
- `422 Unprocessable Entity`: `{ "error": "Invalid status. Must be present or absent" }`
- `500 Internal Server Error`: `{ "error": "Failed to update attendance" }`

---

### ATTENDANCE EVENTS MANAGEMENT

#### 18. Get All Attendance Events
**Endpoint:** `GET /admin/events`  
**Description:** Retrieves all attendance events with pagination.  
**Access:** Admin (Authenticated)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `class_id` (optional): Filter by class

**Responses:**
- `200 OK`:
  ```json
  {
    "message": "Attendance events retrieved successfully",
    "data": [
      {
        "event_id": number,
        "event_name": "string",
        "class_id": "string",
        "class_name": "string",
        "teacher_id": "string",
        "teacher_name": "string",
        "start_time": "datetime",
        "end_time": "datetime",
        "created_at": "datetime",
        "total_marked": number
      }
    ]
  }
  ```
- `500 Internal Server Error`: `{ "error": "Failed to retrieve attendance events" }`

---

#### 19. Get Attendance Event By ID
**Endpoint:** `GET /admin/events/:event_id`  
**Description:** Retrieves details of a specific attendance event with all student records.  
**Access:** Admin (Authenticated)

**Responses:**
- `200 OK`:
  ```json
  {
    "message": "Attendance event retrieved successfully",
    "data": {
      "event_id": number,
      "event_name": "string",
      "class_id": "string",
      "class_name": "string",
      "teacher_name": "string",
      "latitude": number,
      "longitude": number,
      "start_time": "datetime",
      "end_time": "datetime",
      "created_at": "datetime",
      "records": [
        {
          "record_id": number,
          "student_id": "string",
          "student_name": "string",
          "status": "present" | "absent",
          "marked_at": "datetime"
        }
      ]
    }
  }
  ```
- `404 Not Found`: `{ "error": "Event not found" }`
- `500 Internal Server Error`: `{ "error": "Failed to retrieve event" }`

---

#### 20. Delete Attendance Event
**Endpoint:** `DELETE /admin/events/:event_id`  
**Description:** Deletes an attendance event and all associated records.  
**Access:** Admin (Authenticated)

**Responses:**
- `200 OK`: `{ "message": "Attendance event deleted successfully" }`
- `404 Not Found`: `{ "error": "Event not found" }`
- `500 Internal Server Error`: `{ "error": "Failed to delete event" }`

---

### ANALYTICS & REPORTING

#### 21. Get Dashboard Statistics
**Endpoint:** `GET /admin/dashboard`  
**Description:** Retrieves overall system statistics and overview.  
**Access:** Admin (Authenticated)

**Responses:**
- `200 OK`:
  ```json
  {
    "message": "Dashboard statistics retrieved successfully",
    "data": {
      "users": {
        "total": number,
        "students": number,
        "teachers": number
      },
      "classes": number,
      "events": number,
      "attendance": {
        "totalRecords": number,
        "presentCount": number,
        "absentCount": number,
        "attendancePercentage": "string (%)"
      }
    }
  }
  ```
- `500 Internal Server Error`: `{ "error": "Failed to retrieve statistics" }`

---

#### 22. Get Class Attendance Report
**Endpoint:** `GET /admin/reports/attendance/class/:class_id`  
**Description:** Generates a detailed attendance report for a specific class.  
**Access:** Admin (Authenticated)

**Responses:**
- `200 OK`:
  ```json
  {
    "message": "Class attendance report retrieved successfully",
    "data": {
      "class": {
        "class_id": "string",
        "class_name": "string"
      },
      "report": [
        {
          "user_id": "string",
          "name": "string",
          "email": "string",
          "presentCount": number,
          "absentCount": number,
          "totalCount": number,
          "attendancePercentage": "string (%)"
        }
      ]
    }
  }
  ```
- `404 Not Found`: `{ "error": "Class not found" }`
- `500 Internal Server Error`: `{ "error": "Failed to retrieve report" }`

---

#### 23. Get Student Attendance Report
**Endpoint:** `GET /admin/reports/attendance/student/:student_id`  
**Description:** Generates a detailed attendance report for a specific student across all classes.  
**Access:** Admin (Authenticated)

**Responses:**
- `200 OK`:
  ```json
  {
    "message": "Student attendance report retrieved successfully",
    "data": {
      "student": {
        "user_id": "string",
        "name": "string",
        "email": "string"
      },
      "report": [
        {
          "class_id": "string",
          "class_name": "string",
          "presentCount": number,
          "absentCount": number,
          "totalCount": number,
          "attendancePercentage": "string (%)"
        }
      ]
    }
  }
  ```
- `404 Not Found`: `{ "error": "Student not found" }`
- `500 Internal Server Error`: `{ "error": "Failed to retrieve report" }`

---

#### 24. Get Department Attendance Report
**Endpoint:** `GET /admin/reports/department/:dep`  
**Description:** Generates an attendance report for all classes in a specific department.  
**Access:** Admin (Authenticated)

**Responses:**
- `200 OK`:
  ```json
  {
    "message": "Department ({dep}) attendance report retrieved successfully",
    "data": [
      {
        "classId": "string",
        "className": "string",
        "totalRecords": number,
        "presentCount": number,
        "absentCount": number,
        "attendancePercentage": "string (%)"
      }
    ]
  }
  ```
- `404 Not Found`: `{ "error": "No classes found in this department" }`
- `500 Internal Server Error`: `{ "error": "Failed to retrieve report" }`

---

## Summary of Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | Get all users (paginated) |
| GET | `/admin/users/:user_id` | Get user by ID |
| DELETE | `/admin/users/:user_id` | Delete user |
| PUT | `/admin/users/:user_id/role` | Update user role |
| GET | `/admin/users/department/:dep` | Get users by department |
| GET | `/admin/statistics/users` | Get user statistics |
| GET | `/admin/classes` | Get all classes (paginated) |
| GET | `/admin/classes/:class_id` | Get class details |
| DELETE | `/admin/classes/:class_id` | Delete class |
| PUT | `/admin/classes/:class_id` | Update class |
| DELETE | `/admin/classes/:class_id/students/:student_id` | Remove student from class |
| GET | `/admin/statistics/classes` | Get class statistics |
| GET | `/admin/attendance/records` | Get all attendance records |
| GET | `/admin/attendance/class/:class_id` | Get class attendance |
| GET | `/admin/attendance/student/:student_id` | Get student attendance |
| DELETE | `/admin/attendance/records/:record_id` | Delete attendance record |
| PUT | `/admin/attendance/records/:record_id/status` | Update attendance status |
| GET | `/admin/events` | Get all events |
| GET | `/admin/events/:event_id` | Get event details |
| DELETE | `/admin/events/:event_id` | Delete event |
| GET | `/admin/dashboard` | Get dashboard statistics |
| GET | `/admin/reports/attendance/class/:class_id` | Get class attendance report |
| GET | `/admin/reports/attendance/student/:student_id` | Get student attendance report |
| GET | `/admin/reports/department/:dep` | Get department attendance report |

---

### 4. Mark Absent Students (Mark All)
**Endpoint:** `POST /event/mark_all`  
**Description:** Marks all students who haven't marked attendance as 'absent' for a given event.  
**Access:** Authenticated (Likely Teacher)

**Request Body:**
```json
{
  "event_id": "string"
}
```

**Responses:**
- `201 Created`: 
  ```json
  {
    "message": "Marked absent for missing students",
    "markedCount": number,
    "insertId": number
  }
  ```
- `422 Unprocessable Entity`: Validation errors.
- `404 Not Found`: `{ "message": "Event not found" }`
- `200 OK`: `{ "message": "No students found for class" }`
- `200 OK`: `{ "message": "All students already marked present/absent" }`
- `500 Internal Server Error`: `{ "error": "Internal server error" }`

---

### 5. Get All Attendance Records (Teacher)
**Endpoint:** `GET /event/get_all_rec`  
**Description:** Retrieves all attendance records for events created by the logged-in teacher.  
**Access:** Teacher

**Responses:**
- `200 OK`: `{ "all_attd": [...] }`
- `400 Bad Request`: `{ "message": "No attendance events" }`
- `400 Bad Request`: `{ "message": "No attendance records" }`
- `500 Internal Server Error`: `{ "error": "Internal server error" }`

---

### 6. Get Student Attendance History
**Endpoint:** `GET /event/get_recs`  
**Description:** Retrieves attendance history for the logged-in student.  
**Access:** Student

**Responses:**
- `200 OK`: `{ "recs": [...] }`
- `422 Unprocessable Entity`: `{ "message": "No attendance records" }`
- `500 Internal Server Error`: `{ "error": "Internal server error" }`
