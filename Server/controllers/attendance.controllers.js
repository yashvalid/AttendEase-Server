const { validationResult } = require('express-validator');
const { pool } = require('../DB/db');
const attendence = require('../models/attendence.model');
const { sendEvent } = require('../socket');

const isWithinRadius = (lat1, lon1, lat2, lon2, radiusMeters) => {
    const R = 6371000; // Earth radius in meters
    const toRad = deg => deg * Math.PI / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radiusMeters;
};


exports.publish_attendance_event = async (req, res) => {
    try {
        if (req.user.role !== 'teacher')
            return res.status(401).json({ message: "Unauthorized" })
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() });
        const { class_id, event_name, latitude, longitude } = req.body;
        const [result] = await pool.execute(`insert into attendance_events(class_id, teacher_id, event_name, latitude, longitude, start_time, end_time, created_at) values(?,?,?,?,?,?,?,?)`,
            [class_id, req.user.user_id, event_name, latitude, longitude, new Date(), new Date(Date.now() + 10 * 60 * 1000), new Date()]
        );

        res.status(201).json({ message: "attendance event created", insertId: result.insertId });

        const [event] = await pool.execute(`SELECT u.user_id, u.name, socket_id
            FROM class_student cs
            JOIN users u ON cs.student_id = u.user_id
            WHERE cs.class_id = ?`,
            [class_id]
        )
        const [className] = await pool.execute(`select class_name from classes where class_id = ?`, [class_id]);
        const [teacher] = await pool.execute(`select name from users where user_id = ?`, [req.user.user_id])
        event.map(i => sendEvent(i.socket_id, { className: className[0], teacher: teacher[0], event_name, event: 'attendance' }))
    } catch (err) {
        return res.status(500).json({ error: 'event creation failed!' });
    }
}

exports.get_attendance_event = async (req, res) => {
    try {
        const [classes] = await pool.execute(
            'SELECT class_id FROM class_student WHERE student_id = ?',
            [req.user.user_id]
        );

        const classIds = classes.map(c => c.class_id);

        let attd_event = [];
        if (classIds.length > 0) {
            const placeholders = classIds.map(() => '?').join(',');
            const now = new Date();
            const [rows] = await pool.execute(
                `SELECT ae.*, c.class_name, event_name, u.name AS teacher_name
             FROM attendance_events ae
             LEFT JOIN classes c ON ae.class_id = c.class_id
             LEFT JOIN users u ON ae.teacher_id = u.user_id
             WHERE ae.class_id IN (${placeholders})
               AND ae.start_time <= ?
               AND ae.end_time >= ?`,
                [...classIds, now, now]
            );
            attd_event = rows;
        }
        if (!attd_event || attd_event.length === 0)
            return res.status(200).json({ message: "No current attendance event" });
        return res.status(200).json({ event: attd_event });
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}

exports.mark_attendance = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() });

        const { event_id, latitude, longitude, fingerprint } = req.body;
        console.log(fingerprint)
        const student_id = req.user.user_id;
        const now = new Date();

        // fetch event (fixed table name)
        const [events] = await pool.execute(
            'SELECT * FROM attendance_events WHERE event_id = ? LIMIT 1',
            [event_id]
        );

        if (!events || events.length === 0)
            return res.status(404).json({ message: 'Event not found' });

        const event = events[0];

        // check active window
        if (new Date(event.start_time) > now)
            return res.status(400).json({ message: 'Event not started yet' });

        if (new Date(event.end_time) < now)
            return res.status(410).json({ message: 'Too late' });

        // optional: radius check (adjust RADIUS_METERS as needed)
        const RADIUS_METERS = 15;
        if (
            typeof event.latitude !== 'undefined' &&
            typeof event.longitude !== 'undefined' &&
            typeof latitude !== 'undefined' &&
            typeof longitude !== 'undefined'
        ) {
            const evLat = Number(event.latitude);
            const evLon = Number(event.longitude);
            const stLat = Number(latitude);
            const stLon = Number(longitude);

            if (!isWithinRadius(evLat, evLon, stLat, stLon, RADIUS_METERS)) {
                return res.status(403).json({ message: 'Outside allowed radius' });
            }
        }

        // prevent duplicate marking
        const [existing] = await pool.execute(
            'SELECT 1 FROM attendance_records WHERE event_id = ? AND student_id = ? LIMIT 1',
            [event_id, student_id]
        );
        if (existing && existing.length > 0)
            return res.status(409).json({ message: 'Attendance already marked' });

        const [result] = await pool.execute(
            `INSERT INTO attendance_records
             (event_id, student_id, latitude, longitude, fingerprint, status, marked_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [event_id, student_id, latitude, longitude, fingerprint, 'present', now]
        );

        return res.status(201).json({ message: 'Attendance marked', insertId: result.insertId });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

exports.mark_all = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() });

        const { event_id } = req.body;

        const [get_event] = await pool.execute(
            `SELECT * FROM attendance_events WHERE event_id = ? LIMIT 1`,
            [event_id]
        );

        if (!get_event || get_event.length === 0)
            return res.status(404).json({ message: 'Event not found' });

        const event = get_event[0];
        const classId = event.class_id;

        const [all_students] = await pool.execute(
            `SELECT u.user_id, u.name AS student_name
             FROM class_student cs
             JOIN users u ON cs.student_id = u.user_id
             WHERE cs.class_id = ? AND u.role = 'student'`,
            [classId]
        );

        if (!all_students || all_students.length === 0)
            return res.status(200).json({ message: 'No students found for class' });

        const studentIds = all_students.map(s => s.user_id);

        // find which students already have attendance records for this event
        const placeholders = studentIds.map(() => '?').join(',');
        const [existing] = await pool.execute(
            `SELECT student_id FROM attendance_records WHERE event_id = ? AND student_id IN (${placeholders})`,
            [event_id, ...studentIds]
        );

        const presentIds = new Set(existing.map(r => r.student_id));
        const missingStudents = all_students.filter(s => !presentIds.has(s.user_id));
        const now = new Date();
        const insertValues = [];
        const valuePlaceholders = [];
        if (missingStudents.length !== 0) {
            // return res.status(200).json({ message: 'All students already marked present/absent' });
            for (const s of missingStudents) {
                // (event_id, student_id, latitude, longitude, fingerprint, status, marked_at)
                valuePlaceholders.push('(?,?,?,?,?,?,?)');
                insertValues.push(event_id, s.user_id, null, null, 'system', 'absent', now);
            }
            const insertQuery = `
            INSERT INTO attendance_records
            (event_id, student_id, latitude, longitude, fingerprint, status, marked_at)
            VALUES ${valuePlaceholders.join(',')}`;

             await pool.execute(insertQuery, insertValues);
        }
        await pool.execute(
            `UPDATE attendance_events SET marked = ? WHERE event_id = ?`,
            [1, event_id]
        );

        return res.status(201).json({
            message: 'Marked absent for missing students',
            markedCount: missingStudents.length
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

exports.get_all_attendance = async (req, res) => {
    try {
        const [all_event] = await pool.execute(`select event_id from attendance_events where teacher_id = ?`,
            [req.user.user_id]
        );

        if (all_event.length === 0)
            return res.status(400).json({ message: "No attendance events" });

        const eventIds = all_event.map(e => e.event_id);
        const placeholders = eventIds.map(e => '?');

        const [all_attd] = await pool.execute(`select ar.marked_at,
            ar.status,
            u.name as student_name from attendance_records ar
            join users u on ar.student_id = u.user_id
            where event_id in (${placeholders}) `,
            [...eventIds]
        );

        if (all_event.length < 0)
            return res.status(400).json({ message: "No attendance records" });

        return res.status(200).json({ all_attd });

    } catch (err) {

        return res.status(500).json({ error: "Internal server error" });
    }
}

exports.get_rec_forStudent = async (req, res) => {
    try {
        const [recs] = await pool.execute(`SELECT 
            ar.status,
            ar.marked_at,
            u.name AS student_name,
            c.class_name
            FROM attendance_records ar
            JOIN users u ON ar.student_id = u.user_id AND u.role = 'student'
            JOIN attendance_events ae ON ar.event_id = ae.event_id
            JOIN classes c ON ae.class_id = c.class_id
            WHERE ar.student_id = ?`,
            [req.user.user_id]
        );

        if (recs.length === 0)
            return res.status(422).json({ message: "No attendance records" });

        return res.status(200).json({ recs });
    } catch (err) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

exports.get_rec_forTeacher = async (req, res) => {
    try {
        const [recs] = await pool.execute(`SELECT 
            ar.status,
            ar.marked_at,
            u.name AS student_name,
            c.class_name
            FROM attendance_records ar
            JOIN users u ON ar.student_id = u.user_id AND u.role = 'student'
            JOIN attendance_events ae ON ar.event_id = ae.event_id
            JOIN classes c ON ae.class_id = c.class_id
            WHERE ar.student_id = ?`,
            [req.user.user_id]
        );

        if (recs.length === 0)
            return res.status(422).json({ message: "No attendance records" });

        return res.status(200).json({ recs });
    } catch (err) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

exports.get_unmarked_events = async (req, res) => {
    try {
        const [events] = await pool.execute(
            `SELECT ae.*, c.class_name 
             FROM attendance_events ae
             JOIN classes c ON ae.class_id = c.class_id
             WHERE ae.teacher_id = ? AND ae.marked = 0`,
            [req.user.user_id]
        );

        if (events.length === 0)
            return res.status(404).json({ message: "No unmarked attendance events found" });

        const eventsWithStudents = await Promise.all(events.map(async (event) => {
            const [students] = await pool.execute(
                `SELECT u.user_id, u.name, 
                 IF(ar.student_id IS NULL, 'absent', ar.status) as attendance_status,
                 IF(ar.student_id IS NULL, 0, 1) as is_marked
                 FROM users u
                 JOIN class_student cs ON u.user_id = cs.student_id
                 LEFT JOIN attendance_records ar ON u.user_id = ar.student_id AND ar.event_id = ?
                 WHERE cs.class_id = ? AND u.role = 'student'`,
                [event.event_id, event.class_id]
            );
            return { ...event, students };
        }));

        return res.status(200).json({ events: eventsWithStudents });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
}


exports.get_teacher_attendance_report = async (req, res) => {
    try {
        const [events] = await pool.execute(
            `SELECT ae.event_id, ae.class_id, ae.created_at, ae.marked, ae.event_name, c.class_name 
             FROM attendance_events ae
             JOIN classes c ON ae.class_id = c.class_id
             WHERE ae.teacher_id = ?
             ORDER BY ae.created_at DESC`,
            [req.user.user_id]
        );

        if (events.length === 0)
            return res.status(404).json({ message: "No attendance events found" });

        const report = await Promise.all(events.map(async (event) => {
            const [students] = await pool.execute(
                `SELECT u.user_id, u.name as student_name, u.email, 
                 IF(ar.status IS NULL, 'absent', ar.status) as status, 
                 ar.marked_at, ar.fingerprint
                 FROM users u
                 JOIN class_student cs ON u.user_id = cs.student_id
                 LEFT JOIN attendance_records ar ON u.user_id = ar.student_id AND ar.event_id = ?
                 WHERE cs.class_id = ? AND u.role = 'student'`,
                [event.event_id, event.class_id]
            );
            console.log(students)
            return { ...event, students };
        }));
        console.log(report.students, report.event_id)
        return res.status(200).json({ report });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

exports.get_student_reports = async (req, res) => {
    try {
        const { user_id } = req.user;
        const [rows] = await pool.query(
            `SELECT ar.record_id, ar.event_id, ae.class_id, ae.teacher_id, ae.event_name,
            ae.latitude AS event_latitude, ae.longitude AS event_longitude,
            ae.start_time, ae.end_time, ar.status,
            ar.latitude AS marked_latitude, ar.longitude AS marked_longitude,
            ar.fingerprint, ar.marked_at, class_name
            FROM attendance_records ar
            JOIN attendance_events ae ON ar.event_id = ae.event_id
            join classes c on ae.class_id = c.class_id
            WHERE ar.student_id = ?
            ORDER BY ae.start_time DESC`,
            [user_id]
        );

        if (!rows || rows.length <= 0)
            return res.status(404).json({ message: "No attendance records found" });

        return res.status(200).json({ report: rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
}


