const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controllers');
const { body } = require('express-validator');
const authenticateToken = require('../middleware/authentication')

router.post('/attendance',
    body('class_id').notEmpty(),
    body('event_name').notEmpty(),
    body('latitude').isDecimal().notEmpty(),
    body('longitude').isDecimal().notEmpty(),
    authenticateToken,
    attendanceController.publish_attendance_event
)

router.get('/',
    authenticateToken,
    attendanceController.get_attendance_event
)

router.post('/mark_attendance',
    body('event_id').notEmpty(),
    body('latitude').isDecimal().notEmpty(),
    body('longitude').isDecimal().notEmpty(),
    authenticateToken,
    attendanceController.mark_attendance
)

router.get('/get_unmarked_events',
    authenticateToken,
    attendanceController.get_unmarked_events
)

router.post('/mark_all',
    body('event_id').notEmpty(),
    authenticateToken,
    attendanceController.mark_all
)

router.get('/get_all_rec',
    authenticateToken,
    attendanceController.get_all_attendance
)

router.get('/get_recs',
    authenticateToken,
    attendanceController.get_rec_forStudent
)

router.get('/get_teacher_report',
    authenticateToken,
    attendanceController.get_teacher_attendance_report
)

router.get('/get_student_report',
    authenticateToken,
    attendanceController.get_student_reports
)

router.put('/mark-absent',
    authenticateToken,
    attendanceController.update_student_record
)

module.exports = router;