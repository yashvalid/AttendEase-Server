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
