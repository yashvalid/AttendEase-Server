const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const adminController = require('../controllers/admin.controllers');
const authenticateToken = require('../middleware/authentication');
const { cache } = require('../middleware/cache');
const { 
    strictLimiter, 
    moderateLimiter, 
    writeLimiter 
} = require('../middleware/rateLimiter');

// Admin middleware
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    next();
};

// Helper for cache key
const buildQueryKey = (query) =>
    Object.entries(query)
        .sort()
        .map(([k, v]) => `${k}=${v}`)
        .join('&');


// ================= USERS =================

router.get('/users',
    authenticateToken,
    isAdmin,
    moderateLimiter(),
    cache(300, (req) => `cache:admin:users:${buildQueryKey(req.query)}`),
    adminController.getAllUsers
);

router.get('/users/:user_id',
    authenticateToken,
    isAdmin,
    param('user_id').isInt(),
    cache(300, (req) => `cache:admin:user:${req.params.user_id}`),
    adminController.getUserById
);

router.delete('/users/:user_id',
    authenticateToken,
    isAdmin,
    param('user_id').isInt(),
    writeLimiter(),
    adminController.deleteUser
);

router.put('/users/:user_id/role',
    authenticateToken,
    isAdmin,
    param('user_id').isInt(),
    body('role').isIn(['student', 'teacher']),
    writeLimiter(),
    adminController.updateUserRole
);

router.get('/users/department/:dep',
    authenticateToken,
    isAdmin,
    moderateLimiter(),
    cache(300, (req) => `cache:admin:dept:${req.params.dep}:${buildQueryKey(req.query)}`),
    adminController.getUsersByDepartment
);

router.get('/statistics/users',
    authenticateToken,
    isAdmin,
    //strictLimiter(),
    cache(600),
    adminController.getUserStatistics
);


// ================= CLASSES =================

router.get('/classes',
    authenticateToken,
    isAdmin,
    moderateLimiter(),
    cache(300, (req) => `cache:admin:classes:${buildQueryKey(req.query)}`),
    adminController.getAllClasses
);

router.get('/classes/:class_id',
    authenticateToken,
    isAdmin,
    param('class_id').isInt(),
    cache(300, (req) => `cache:admin:class:${req.params.class_id}`),
    adminController.getClassById
);

router.delete('/classes/:class_id',
    authenticateToken,
    isAdmin,
    param('class_id').isInt(),
    writeLimiter(),
    adminController.deleteClass
);

router.put('/classes/:class_id',
    authenticateToken,
    isAdmin,
    param('class_id').isInt(),
    body('class_name').optional().notEmpty(),
    body('year').optional().notEmpty(),
    writeLimiter(),
    adminController.updateClass
);

router.delete('/classes/:class_id/students/:student_id',
    authenticateToken,
    isAdmin,
    param('class_id').isInt(),
    param('student_id').isInt(),
    writeLimiter(),
    adminController.removeStudentFromClass
);

router.get('/statistics/classes',
    authenticateToken,
    isAdmin,
    strictLimiter(),
    cache(600),
    adminController.getClassStatistics
);


// ================= ATTENDANCE =================

router.get('/attendance/records',
    authenticateToken,
    isAdmin,
    moderateLimiter(),
    cache(300, (req) => `cache:admin:attendance:${buildQueryKey(req.query)}`),
    adminController.getAllAttendanceRecords
);

router.get('/attendance/class/:class_id',
    authenticateToken,
    isAdmin,
    param('class_id').isInt(),
    moderateLimiter(),
    cache(300, (req) => `cache:admin:attendance:class:${req.params.class_id}:${buildQueryKey(req.query)}`),
    adminController.getAttendanceByClass
);

router.get('/attendance/student/:student_id',
    authenticateToken,
    isAdmin,
    param('student_id').isInt(),
    moderateLimiter(),
    cache(300, (req) => `cache:admin:attendance:student:${req.params.student_id}`),
    adminController.getAttendanceByStudent
);

router.delete('/attendance/records/:record_id',
    authenticateToken,
    isAdmin,
    param('record_id').isInt(),
    writeLimiter(),
    adminController.deleteAttendanceRecord
);

router.put('/attendance/records/:record_id/status',
    authenticateToken,
    isAdmin,
    param('record_id').isInt(),
    body('status').isIn(['present', 'absent']),
    writeLimiter(),
    adminController.updateAttendanceStatus
);


// ================= EVENTS =================

router.get('/events',
    authenticateToken,
    isAdmin,
    moderateLimiter(),
    cache(300, (req) => `cache:admin:events:${buildQueryKey(req.query)}`),
    adminController.getAllAttendanceEvents
);

router.get('/events/:event_id',
    authenticateToken,
    isAdmin,
    param('event_id').isInt(),
    cache(300, (req) => `cache:admin:event:${req.params.event_id}`),
    adminController.getAttendanceEventById
);

router.delete('/events/:event_id',
    authenticateToken,
    isAdmin,
    param('event_id').isInt(),
    writeLimiter(),
    adminController.deleteAttendanceEvent
);


// ================= REPORTS =================

router.get('/dashboard',
    authenticateToken,
    isAdmin,
    //strictLimiter(),
    cache(600),
    adminController.getDashboardStatistics
);

router.get('/reports/attendance/class/:class_id',
    authenticateToken,
    isAdmin,
    param('class_id').isInt(),
    //strictLimiter(),
    cache(600, (req) => `cache:admin:report:class:${req.params.class_id}`),
    adminController.getAttendanceReportByClass
);

router.get('/reports/attendance/student/:student_id',
    authenticateToken,
    isAdmin,
    param('student_id').isInt(),
    //strictLimiter(),
    cache(600, (req) => `cache:admin:report:student:${req.params.student_id}`),
    adminController.getAttendanceReportByStudent
);

router.get('/reports/department/:dep',
    authenticateToken,
    isAdmin,
    //strictLimiter(),
    cache(600, (req) => `cache:admin:report:dept:${req.params.dep}`),
    adminController.getDepartmentAttendanceReport
);

module.exports = router;