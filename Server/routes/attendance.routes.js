const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controllers');
const { body } = require('express-validator');
const authenticateToken = require('../middleware/authentication');
const { cache } = require('../middleware/cache');

// Create attendance
router.post('/attendance',
    body('class_id').notEmpty(),
    body('event_name').notEmpty(),
    body('latitude').isFloat(),
    body('longitude').isFloat(),
    authenticateToken,
    attendanceController.publish_attendance_event
);

// Get active events
router.get('/',
    authenticateToken,
    cache(60, (req) => `cache:attendance:events:${req.user.user_id}`),
    attendanceController.get_attendance_event
);

// Mark attendance
router.post('/mark_attendance',
    body('event_id').notEmpty(),
    body('latitude').isFloat(),
    body('longitude').isFloat(),
    authenticateToken,
    attendanceController.mark_attendance
);

// Unmarked events
router.get('/get_unmarked_events',
    authenticateToken,
    cache(60, (req) => `cache:attendance:unmarked:${req.user.user_id}`),
    attendanceController.get_unmarked_events
);

// Mark all absent
router.post('/mark_all',
    body('event_id').notEmpty(),
    authenticateToken,
    attendanceController.mark_all
);

// Teacher all records
router.get('/get_all_rec',
    authenticateToken,
    cache(300, (req) => `cache:attendance:all:${req.user.user_id}`),
    attendanceController.get_all_attendance
);

// Student records
router.get('/get_recs',
    authenticateToken,
    cache(300, (req) => `cache:attendance:student:${req.user.user_id}`),
    attendanceController.get_rec_forStudent
);

// Reports
router.get('/get_teacher_report',
    authenticateToken,
    cache(300, (req) => `cache:attendance:teacher_report:${req.user.user_id}`),
    attendanceController.get_teacher_attendance_report
);

router.get('/get_student_report',
    authenticateToken,
    cache(300, (req) => `cache:attendance:student_report:${req.user.user_id}`),
    attendanceController.get_student_reports
);

// Mark absent manually
router.put('/mark-absent',
    body('event_id').notEmpty(),
    body('student_id').notEmpty(),
    authenticateToken,
    attendanceController.update_student_record
);

module.exports = router;