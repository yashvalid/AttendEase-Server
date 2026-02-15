# Attendance System - Server API

This document lists available HTTP endpoints, required fields, validation and auth requirements.

Base URL: http://<host>:<port>/ (adjust as configured)

## Authentication / Users

### Register
- Method: POST
- Path: /users/register
- Auth: No
- Body (JSON):
  - name (string, 1-15 chars) — required
  - email (string, email) — required
  - password (string, min 7 chars) — required
- Success: 201 { message: "Registration successfull" }

Example:
curl -X POST /users/register -H "Content-Type: application/json" -d '{"name":"Alice","email":"a@e.com","password":"secret123"}'

### Login
- Method: POST
- Path: /users/login
- Auth: No
- Body (JSON):
  - email (string, email) — required
  - password (string, min 7 chars) — required
- Success: 200 { message: "Login successfull", token, user_id }

Note: Response sets cookie "token" and returns a JWT token.

### Add class (student joins class)
- Method: POST
- Path: /users/add_class
- Auth: Yes (authenticateToken)
- Body (JSON):
  - class_id — required
- Success: 201 { message: "Class added" }

## Attendance

### Publish attendance event (teacher)
- Method: POST
- Path: /attendance/attendance
- Auth: Yes (authenticateToken) — role must be "teacher"
- Body (JSON):
  - class_id — required
  - event_name — required
  - latitude (decimal) — required
  - longitude (decimal) — required
- Success: 201 { message: "attendance event created", insertId }

Notes: Event start_time is set to now, end_time is now + 5 minutes. Emits socket events to class students.

### Get current attendance events (student)
- Method: GET
- Path: /attendance/
- Auth: Yes (authenticateToken)
- Success: 200 { evnt: [...] } or { message: "No current attendance event" }

Returns events for classes the student is enrolled in and that are currently active.

### Mark attendance (student)
- Method: POST
- Path: /attendance/mark_attendance
- Auth: Yes (authenticateToken)
- Body (JSON):
  - event_id — required
  - latitude (decimal) — required
  - longitude (decimal) — required
- Success: 201 { message: "Attendance marked", insertId }

Notes: Validates event active window, optional radius check (default 10 meters), prevents duplicate marks.

### Mark all (teacher) — mark missing students absent
- Method: POST
- Path: /attendance/mark_all
- Auth: Yes (authenticateToken) — typically teacher
- Body (JSON):
  - event_id — required
- Success: 201 { message: "Marked absent for missing students", markedCount, insertId }

Inserts 'absent' records for students in the class who have not been marked yet.

### Get all attendance records for teacher's events
- Method: GET
- Path: /attendance/get_all_rec
- Auth: Yes (authenticateToken) — teacher
- Success: 200 { all_attd: [...] }

Returns attendance_records for events created by the authenticated teacher.

### Get attendance records for current student
- Method: GET
- Path: /attendance/get_recs
- Auth: Yes (authenticateToken)
- Success: 200 { recs: [...] } or 422 when none

Returns the student's attendance records with class and event info.

---

Validation errors return 422 with errors array. Server errors return 500 with an error message.

Authentication: include the JWT token (returned on login) as a cookie "token" or in any middleware-supported header if implemented.