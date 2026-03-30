const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const adminController = require('../controllers/admin.controllers');
const authenticateToken = require('../middleware/authentication');

// Middleware to check if user is admin (you may need to add 'admin' role to users)
const isAdmin = (req, res, next) => {
    console.log(req.user)
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
};

// ============= USER MANAGEMENT ROUTES =============

/**
 * GET /api/admin/users
 * Get all users with pagination
 * Query params: page, limit, role (optional)
 */
router.get('/users',
    authenticateToken,
    isAdmin,
    adminController.getAllUsers
);

/**
 * GET /api/admin/users/:user_id
 * Get specific user by ID
 */
router.get('/users/:user_id',
    authenticateToken,
    isAdmin,
    adminController.getUserById
);

/**
 * DELETE /api/admin/users/:user_id
 * Delete a user
 */
router.delete('/users/:user_id',
    authenticateToken,
    isAdmin,
    adminController.deleteUser
);

/**
 * PUT /api/admin/users/:user_id/role
 * Update user role
 */
router.put('/users/:user_id/role',
    authenticateToken,
    isAdmin,
    body('role').isIn(['student', 'teacher']).notEmpty(),
    adminController.updateUserRole
);

/**
 * GET /api/admin/users/department/:dep
 * Get all users in a specific department
 * Query params: role (optional for filtering)
 */
router.get('/users/department/:dep',
    authenticateToken,
    isAdmin,
    adminController.getUsersByDepartment
);

/**
 * GET /api/admin/statistics/users
 * Get user statistics
 */
router.get('/statistics/users',
    authenticateToken,
    isAdmin,
    adminController.getUserStatistics
);


// ============= CLASS MANAGEMENT ROUTES =============

/**
 * GET /api/admin/classes
 * Get all classes with pagination
 * Query params: page, limit, year (optional), dep (optional)
 */
router.get('/classes',
    authenticateToken,
    isAdmin,
    adminController.getAllClasses
);

/**
 * GET /api/admin/classes/:class_id
 * Get specific class with enrolled students
 */
router.get('/classes/:class_id',
    authenticateToken,
    isAdmin,
    adminController.getClassById
);

/**
 * DELETE /api/admin/classes/:class_id
 * Delete a class
 */
router.delete('/classes/:class_id',
    authenticateToken,
    isAdmin,
    adminController.deleteClass
);

/**
 * PUT /api/admin/classes/:class_id
 * Update class information (class_name, year)
 */
router.put('/classes/:class_id',
    authenticateToken,
    isAdmin,
    body('class_name').optional().notEmpty(),
    body('year').optional().notEmpty(),
    adminController.updateClass
);

/**
 * DELETE /api/admin/classes/:class_id/students/:student_id
 * Remove a student from a class
 */
router.delete('/classes/:class_id/students/:student_id',
    authenticateToken,
    isAdmin,
    adminController.removeStudentFromClass
);

/**
 * GET /api/admin/statistics/classes
 * Get class statistics
 */
router.get('/statistics/classes',
    authenticateToken,
    isAdmin,
    adminController.getClassStatistics
);


// ============= ATTENDANCE MANAGEMENT ROUTES =============

/**
 * GET /api/admin/attendance/records
 * Get all attendance records with pagination
 * Query params: page, limit, status (optional), class_id (optional), student_id (optional)
 */
router.get('/attendance/records',
    authenticateToken,
    isAdmin,
    adminController.getAllAttendanceRecords
);

/**
 * GET /api/admin/attendance/class/:class_id
 * Get attendance records for a specific class
 * Query params: status (optional)
 */
router.get('/attendance/class/:class_id',
    authenticateToken,
    isAdmin,
    adminController.getAttendanceByClass
);

/**
 * GET /api/admin/attendance/student/:student_id
 * Get attendance records for a specific student
 */
router.get('/attendance/student/:student_id',
    authenticateToken,
    isAdmin,
    adminController.getAttendanceByStudent
);

/**
 * DELETE /api/admin/attendance/records/:record_id
 * Delete an attendance record
 */
router.delete('/attendance/records/:record_id',
    authenticateToken,
    isAdmin,
    adminController.deleteAttendanceRecord
);

/**
 * PUT /api/admin/attendance/records/:record_id/status
 * Update attendance record status (present/absent)
 */
router.put('/attendance/records/:record_id/status',
    authenticateToken,
    isAdmin,
    body('status').isIn(['present', 'absent']).notEmpty(),
    adminController.updateAttendanceStatus
);


// ============= ATTENDANCE EVENTS MANAGEMENT ROUTES =============

/**
 * GET /api/admin/events
 * Get all attendance events
 * Query params: page, limit, class_id (optional)
 */
router.get('/events',
    authenticateToken,
    isAdmin,
    adminController.getAllAttendanceEvents
);

/**
 * GET /api/admin/events/:event_id
 * Get specific attendance event with records
 */
router.get('/events/:event_id',
    authenticateToken,
    isAdmin,
    adminController.getAttendanceEventById
);

/**
 * DELETE /api/admin/events/:event_id
 * Delete an attendance event
 */
router.delete('/events/:event_id',
    authenticateToken,
    isAdmin,
    adminController.deleteAttendanceEvent
);


// ============= ANALYTICS & REPORTING ROUTES =============

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics (overview)
 */
router.get('/dashboard',
    authenticateToken,
    isAdmin,
    adminController.getDashboardStatistics
);

/**
 * GET /api/admin/reports/attendance/class/:class_id
 * Get attendance report for a specific class
 */
router.get('/reports/attendance/class/:class_id',
    authenticateToken,
    isAdmin,
    adminController.getAttendanceReportByClass
);

/**
 * GET /api/admin/reports/attendance/student/:student_id
 * Get attendance report for a specific student
 */
router.get('/reports/attendance/student/:student_id',
    authenticateToken,
    isAdmin,
    adminController.getAttendanceReportByStudent
);

/**
 * GET /api/admin/reports/department/:dep
 * Get attendance report for a specific department
 */
router.get('/reports/department/:dep',
    authenticateToken,
    isAdmin,
    adminController.getDepartmentAttendanceReport
);

module.exports = router;
