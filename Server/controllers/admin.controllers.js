const { pool } = require('../DB/db');
const bcrypt = require('bcrypt');
const { invalidateCache } = require('../middleware/cache');


exports.getAllUsers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
        const role = req.query.role; // filter by role (student/teacher)
        const offset = Math.max(0, (page - 1) * limit);

        let query = `SELECT user_id, name, email, role, dep, created_at FROM users`;
        let countQuery = `SELECT COUNT(*) as total FROM users`;
        const params = [];

        if (role) {
            query += ` WHERE role = ?`;
            countQuery += ` WHERE role = ?`;
            params.push(role);
        }

        query += ` ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
        const [users] = await pool.execute(query, params);
        
        const countParams = role ? [role] : [];
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        return res.status(200).json({
            message: "Users retrieved successfully",
            data: users,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to retrieve users' });
    }
}


// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const { user_id } = req.params;

        const [users] = await pool.execute(
            `SELECT user_id, name, email, role, dep, created_at FROM users WHERE user_id = ?`,
            [user_id]
        );

        if (!users || users.length === 0)
            return res.status(404).json({ error: 'User not found' });

        return res.status(200).json({
            message: "User retrieved successfully",
            data: users[0]
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to retrieve user' });
    }
}

// Delete user
exports.deleteUser = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { user_id } = req.params;

        await connection.beginTransaction();

        // Check user
        const [user] = await connection.execute(
            `SELECT role FROM users WHERE user_id = ?`,
            [user_id]
        );

        if (!user.length) {
            await connection.rollback();
            return res.status(404).json({ error: 'User not found' });
        }

        const role = user[0].role;

        // ================= CLEANUP =================

        // 1. Remove from class_student
        await connection.execute(
            `DELETE FROM class_student WHERE student_id = ?`,
            [user_id]
        );

        // 2. Delete attendance records of student
        await connection.execute(
            `DELETE FROM attendance_records WHERE student_id = ?`,
            [user_id]
        );

        // 3. If teacher → delete their events + related records
        if (role === 'teacher') {

            // delete records of their events
            await connection.execute(`
                DELETE FROM attendance_records 
                WHERE event_id IN (
                    SELECT event_id FROM attendance_events WHERE teacher_id = ?
                )
            `, [user_id]);

            // delete events
            await connection.execute(
                `DELETE FROM attendance_events WHERE teacher_id = ?`,
                [user_id]
            );

            // remove teacher from classes (optional: set NULL instead)
            await connection.execute(
                `UPDATE classes SET teacher_id = NULL WHERE teacher_id = ?`,
                [user_id]
            );
        }

        // 4. Finally delete user
        const [result] = await connection.execute(
            `DELETE FROM users WHERE user_id = ?`,
            [user_id]
        );

        if (result.affectedRows !== 1) {
            await connection.rollback();
            return res.status(500).json({ error: 'Delete failed' });
        }

        await connection.commit();

        // ✅ Invalidate cache AFTER success
        await invalidateCache([
            'cache:admin:users:*',
            'cache:admin:dept:*',
            'cache:admin:attendance:*',
            'cache:attendance:*',
            'cache:admin:statistics*'
        ]);

        return res.status(200).json({
            message: 'User deleted successfully (clean delete)'
        });

    } catch (err) {
        await connection.rollback();
        console.error(err);
        return res.status(500).json({ error: 'Delete failed' });
    } finally {
        connection.release();
    }
};

// Update user role
exports.updateUserRole = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { role } = req.body;

        if (!['student', 'teacher'].includes(role))
            return res.status(422).json({ error: 'Invalid role. Must be student or teacher' });

        const [checkUser] = await pool.execute(
            `SELECT user_id FROM users WHERE user_id = ?`,
            [user_id]
        );

        if (!checkUser || checkUser.length === 0)
            return res.status(404).json({ error: 'User not found' });

        const [updateResult] = await pool.execute(
            `UPDATE users SET role = ? WHERE user_id = ?`,
            [role, user_id]
        );

        if (updateResult.affectedRows !== 1)
            return res.status(500).json({ error: 'Failed to update user role' });

        // Invalidate user and class caches
        await invalidateCache(['cache:admin:users:*', 'cache:admin:dept:*', 'cache:admin:classes:*', 'cache:admin:statistics*']);

        return res.status(200).json({ message: 'User role updated successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to update user role' });
    }
}

// Get users by department
exports.getUsersByDepartment = async (req, res) => {
    try {
        const { dep } = req.params;
        const role = req.query.role; // optional filter by role

        let query = `SELECT user_id, name, email, role, dep, created_at FROM users WHERE dep = ?`;
        const params = [dep];

        if (role) {
            query += ` AND role = ?`;
            params.push(role);
        }

        query += ` ORDER BY name ASC`;

        const [users] = await pool.execute(query, params);

        return res.status(200).json({
            message: `Users in ${dep} retrieved successfully`,
            data: users
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to retrieve users' });
    }
}

// Get user statistics
exports.getUserStatistics = async (req, res) => {
    try {
        const [totalUsers] = await pool.execute(`SELECT COUNT(*) as count FROM users`);
        const [totalStudents] = await pool.execute(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`);
        const [totalTeachers] = await pool.execute(`SELECT COUNT(*) as count FROM users WHERE role = 'teacher'`);
        const [departmentStats] = await pool.execute(`
            SELECT dep, COUNT(*) as count FROM users GROUP BY dep
        `);
        const [recentUsers] = await pool.execute(`
            SELECT user_id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5
        `);

        return res.status(200).json({
            message: "User statistics retrieved successfully",
            data: {
                totalUsers: totalUsers[0].count,
                totalStudents: totalStudents[0].count,
                totalTeachers: totalTeachers[0].count,
                departmentStats,
                recentUsers
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to retrieve statistics' });
    }
}


// ============= CLASS MANAGEMENT =============

// Get all classes
exports.getAllClasses = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
        const offset = Math.max(0, (page - 1) * limit);
        const year = req.query.year;
        const dep = req.query.dep;

        let query = `
            SELECT 
                c.class_id, 
                c.class_name, 
                c.teacher_id, 
                u.name as teacher_name,
                u.email as teacher_email,
              
                COUNT(DISTINCT cs.student_id) as enrolled_students
            FROM classes c
            LEFT JOIN users u ON c.teacher_id = u.user_id
            LEFT JOIN class_student cs ON c.class_id = cs.class_id
        `;
        let countQuery = `SELECT COUNT(DISTINCT c.class_id) as total FROM classes c`;
        const params = [];
        let whereAdded = false;

        if (year) {
            if (!whereAdded) {
                query += ` WHERE`;
                countQuery += ` WHERE`;
                whereAdded = true;
            }
            query += ` c.year = ?`;
            countQuery += ` c.year = ?`;
            params.push(year);
        }

        if (dep) {
            if (!whereAdded) {
                query += ` WHERE`;
                countQuery += ` WHERE`;
            } else {
                query += ` AND`;
                countQuery += ` AND`;
            }
            query += ` c.dep = ?`;
            countQuery += ` c.dep = ?`;
            params.push(dep);
        }

            query += ` GROUP BY c.class_id LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
        const limitParams = [...params, parseInt(limit), parseInt(offset)];

        const [classes] = await pool.execute(query, limitParams);
        
        const countParams = params;
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        return res.status(200).json({
            message: "Classes retrieved successfully",
            data: classes,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to retrieve classes' });
    }
}

// Get class by ID
exports.getClassById = async (req, res) => {
    try {
        const { class_id } = req.params;

        const [classData] = await pool.execute(`
            SELECT 
                c.class_id, 
                c.class_name, 
                c.teacher_id, 
                u.name as teacher_name,
                u.email as teacher_email,
                c.created_at,
                COUNT(DISTINCT cs.student_id) as enrolled_students
            FROM classes c
            LEFT JOIN users u ON c.teacher_id = u.user_id
            LEFT JOIN class_student cs ON c.class_id = cs.class_id
            WHERE c.class_id = ?
            GROUP BY c.class_id
        `, [class_id]);

        if (!classData || classData.length === 0)
            return res.status(404).json({ error: 'Class not found' });

        // Get enrolled students
        const [students] = await pool.execute(`
            SELECT u.user_id, u.name, u.email, cs.joined_at
            FROM class_student cs
            JOIN users u ON cs.student_id = u.user_id
            WHERE cs.class_id = ?
            ORDER BY u.name ASC
        `, [class_id]);

        return res.status(200).json({
            message: "Class retrieved successfully",
            data: {
                ...classData[0],
                students
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to retrieve class' });
    }
}

// Delete class
exports.deleteClass = async (req, res) => {
    try {
        const { class_id } = req.params;

        const [check] = await pool.execute(
            `SELECT class_id FROM classes WHERE class_id = ?`,
            [class_id]
        );

        if (!check.length)
            return res.status(404).json({ error: 'Class not found' });

        // delete dependencies first
        await pool.execute(`DELETE FROM class_student WHERE class_id = ?`, [class_id]);

        await pool.execute(`
            DELETE FROM attendance_records 
            WHERE event_id IN (
                SELECT event_id FROM attendance_events WHERE class_id = ?
            )
        `, [class_id]);

        await pool.execute(`DELETE FROM attendance_events WHERE class_id = ?`, [class_id]);

        const [result] = await pool.execute(
            `DELETE FROM classes WHERE class_id = ?`,
            [class_id]
        );

        if (result.affectedRows !== 1)
            return res.status(500).json({ error: 'Delete failed' });

        await invalidateCache([
            'cache:admin:classes:*',
            'cache:admin:class:*',
            'cache:attendance:*'
        ]);

        return res.status(200).json({ message: 'Class deleted' });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Update class
exports.updateClass = async (req, res) => {
    try {
        const { class_id } = req.params;
        const { class_name, year } = req.body;

        const [checkClass] = await pool.execute(
            `SELECT class_id FROM classes WHERE class_id = ?`,
            [class_id]
        );

        if (!checkClass || checkClass.length === 0)
            return res.status(404).json({ error: 'Class not found' });

        let query = `UPDATE classes SET`;
        const params = [];

        if (class_name) {
            query += ` class_name = ?`;
            params.push(class_name);
        }

        if (year) {
            if (params.length > 0) query += `,`;
            query += ` year = ?`;
            params.push(year);
        }

        if (params.length === 0)
            return res.status(422).json({ error: 'No fields to update' });

        query += ` WHERE class_id = ?`;
        params.push(class_id);

        const [updateResult] = await pool.execute(query, params);

        // Invalidate class caches
        await invalidateCache(['cache:user:classes:*', 'cache:student:classes:*', 'cache:admin:classes:*', 'cache:admin:class:*', 'cache:admin:statistics*']);

        if (updateResult.affectedRows !== 1)
            return res.status(500).json({ error: 'Failed to update class' });

        return res.status(200).json({ message: 'Class updated successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to update class' });
    }
}

// Get class statistics
exports.getClassStatistics = async (req, res) => {
    try {
        const [totalClasses] = await pool.execute(`SELECT COUNT(*) as count FROM classes`);
        const [classesPerDep] = await pool.execute(`
            SELECT dep, COUNT(*) as count FROM classes GROUP BY dep
        `);
        const [avgStudentsPerClass] = await pool.execute(`
            SELECT AVG(student_count) as avg_students FROM (
                SELECT COUNT(DISTINCT student_id) as student_count FROM class_student GROUP BY class_id
            ) as subquery
        `);

        return res.status(200).json({
            message: "Class statistics retrieved successfully",
            data: {
                totalClasses: totalClasses[0].count,
                classesPerDepartment: classesPerDep,
                averageStudentsPerClass: avgStudentsPerClass[0].avg_students || 0
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to retrieve statistics' });
    }
}

// Remove student from class
exports.removeStudentFromClass = async (req, res) => {
    try {
        const { class_id, student_id } = req.params;

        const [checkEnrollment] = await pool.execute(
            `SELECT id FROM class_student WHERE class_id = ? AND student_id = ?`,
            [class_id, student_id]
        );

        if (!checkEnrollment || checkEnrollment.length === 0)
            return res.status(404).json({ error: 'Student not enrolled in this class' });

        const [deleteResult] = await pool.execute(
            `DELETE FROM class_student WHERE class_id = ? AND student_id = ?`, [class_id, student_id]
        );
        // Invalidate class and student caches
        await invalidateCache(['cache:student:classes:*', 'cache:enrolled:classes:*', 'cache:admin:class:*', 'cache:admin:statistics*']);

           

        if (deleteResult.affectedRows !== 1)
            return res.status(500).json({ error: 'Failed to remove student' });

        return res.status(200).json({ message: 'Student removed from class successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to remove student' });
    }
}


// ============= ATTENDANCE MANAGEMENT =============

// Get all attendance records
exports.getAllAttendanceRecords = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
        const offset = Math.max(0, (page - 1) * limit);
        const status = req.query.status; // filter by present/absent
        const class_id = req.query.class_id;
        const student_id = req.query.student_id;

        let query = `
            SELECT 
                ar.record_id,
                ar.event_id,
                ar.student_id,
                u.name as student_name,
                ae.event_name,
                ae.class_id,
                c.class_name,
                ar.status,
                ar.marked_at
            FROM attendance_records ar
            JOIN users u ON ar.student_id = u.user_id
            JOIN attendance_events ae ON ar.event_id = ae.event_id
            JOIN classes c ON ae.class_id = c.class_id
        `;
        let countQuery = `SELECT COUNT(*) as total FROM attendance_records ar`;
        const params = [];
        let whereAdded = false;

        if (status) {
            if (!whereAdded) {
                query += ` WHERE`;
                countQuery += ` WHERE`;
                whereAdded = true;
            }
            query += ` ar.status = ?`;
            countQuery += ` ar.status = ?`;
            params.push(status);
        }

        if (class_id) {
            if (!whereAdded) {
                query += ` WHERE`;
                countQuery += ` WHERE`;
                whereAdded = true;
            } else {
                query += ` AND`;
                countQuery += ` AND`;
            }
            query += ` ae.class_id = ?`;
            countQuery += ` ae.class_id = ?`;
            params.push(class_id);
        }

        if (student_id) {
            if (!whereAdded) {
                query += ` WHERE`;
                countQuery += ` WHERE`;
                whereAdded = true;
            } else {
                query += ` AND`;
                countQuery += ` AND`;
            }
            query += ` ar.student_id = ?`;
            countQuery += ` ar.student_id = ?`;
            params.push(student_id);
        }

        query += ` ORDER BY ar.marked_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
        const [records] = await pool.execute(query, params);
        
        const countParams = params;
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        return res.status(200).json({
            message: "Attendance records retrieved successfully",
            data: records,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to retrieve attendance records' });
    }
}

// Get attendance by class
exports.getAttendanceByClass = async (req, res) => {
    try {
        const { class_id } = req.params;
        const status = req.query.status;

        let query = `
            SELECT 
                ar.record_id,
                ar.event_id,
                ar.student_id,
                u.name as student_name,
                ae.event_name,
                ae.start_time,
                ae.end_time,
                ar.status,
                ar.marked_at
            FROM attendance_records ar
            JOIN users u ON ar.student_id = u.user_id
            JOIN attendance_events ae ON ar.event_id = ae.event_id
            WHERE ae.class_id = ?
        `;
        const params = [class_id];

        if (status) {
            query += ` AND ar.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY ar.marked_at DESC`;

        const [records] = await pool.execute(query, params);

        return res.status(200).json({
            message: "Class attendance records retrieved successfully",
            data: records
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to retrieve attendance' });
    }
}

// Get attendance by student
exports.getAttendanceByStudent = async (req, res) => {
    try {
        const { student_id } = req.params;

        const [records] = await pool.execute(`
            SELECT 
                ar.record_id,
                ar.event_id,
                ae.event_name,
                c.class_id,
                c.class_name,
                ae.start_time,
                ae.end_time,
                ar.status,
                ar.marked_at
            FROM attendance_records ar
            JOIN attendance_events ae ON ar.event_id = ae.event_id
            JOIN classes c ON ae.class_id = c.class_id
            WHERE ar.student_id = ?
            ORDER BY ar.marked_at DESC
        `, [student_id]);

        return res.status(200).json({
            message: "Student attendance records retrieved successfully",
            data: records
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to retrieve attendance' });
    }
}

// Delete attendance record
exports.deleteAttendanceRecord = async (req, res) => {
    try {
        const { record_id } = req.params;

        const [checkRecord] = await pool.execute(
            `SELECT record_id FROM attendance_records WHERE record_id = ?`,
            [record_id]
        );

        if (!checkRecord || checkRecord.length === 0)
            return res.status(404).json({ error: 'Attendance record not found' });

        const [deleteResult] = await pool.execute(
            `DELETE FROM attendance_records WHERE record_id = ?`,  [record_id]
        );

        // Invalidate attendance caches
        await invalidateCache(['cache:attendance:*', 'cache:admin:attendance:*', 'cache:admin:statistics*']);

        if (deleteResult.affectedRows !== 1)
            return res.status(500).json({ error: 'Failed to delete record' });

        return res.status(200).json({ message: 'Attendance record deleted successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to delete attendance record' });
    }
}

// Update attendance record status
exports.updateAttendanceStatus = async (req, res) => {
    try {
        const { record_id } = req.params;
        const { status } = req.body;

        const [check] = await pool.execute(
            `SELECT record_id FROM attendance_records WHERE record_id = ?`,
            [record_id]
        );

        if (!check.length)
            return res.status(404).json({ error: 'Not found' });

        const [result] = await pool.execute(
            `UPDATE attendance_records SET status = ? WHERE record_id = ?`,
            [status, record_id]
        );

        if (result.affectedRows !== 1)
            return res.status(500).json({ error: 'Update failed' });

        await invalidateCache([
            'cache:attendance:*',
            'cache:admin:attendance:*'
        ]);

        return res.status(200).json({ message: 'Updated' });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// ============= ATTENDANCE EVENTS MANAGEMENT =============

// Get all attendance events
exports.getAllAttendanceEvents = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
        const offset = Math.max(0, (page - 1) * limit);
        const class_id = req.query.class_id;

        let query = `
            SELECT 
                ae.event_id,
                ae.event_name,
                ae.class_id,
                c.class_name,
                ae.teacher_id,
                u.name as teacher_name,
                ae.start_time,
                ae.end_time,
                ae.created_at,
                COUNT(ar.record_id) as total_marked
            FROM attendance_events ae
            JOIN classes c ON ae.class_id = c.class_id
            JOIN users u ON ae.teacher_id = u.user_id
            LEFT JOIN attendance_records ar ON ae.event_id = ar.event_id
        `;
        const params = [];
        let whereAdded = false;

        if (class_id) {
            query += ` WHERE ae.class_id = ?`;
            params.push(class_id);
            whereAdded = true;
        }

            query += ` GROUP BY ae.event_id ORDER BY ae.created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
            const eventParams = params;

        const [events] = await pool.execute(query, eventParams);

        return res.status(200).json({
            message: "Attendance events retrieved successfully",
            data: events
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to retrieve attendance events' });
    }
}

// Get attendance event by ID
exports.getAttendanceEventById = async (req, res) => {
    try {
        const { event_id } = req.params;

        const [eventData] = await pool.execute(`
            SELECT 
                ae.event_id,
                ae.event_name,
                ae.class_id,
                c.class_name,
                ae.teacher_id,
                u.name as teacher_name,
                ae.latitude,
                ae.longitude,
                ae.start_time,
                ae.end_time,
                ae.created_at
            FROM attendance_events ae
            JOIN classes c ON ae.class_id = c.class_id
            JOIN users u ON ae.teacher_id = u.user_id
            WHERE ae.event_id = ?
        `, [event_id]);

        if (!eventData || eventData.length === 0)
            return res.status(404).json({ error: 'Event not found' });

        // Get attendance records for this event
        const [records] = await pool.execute(`
            SELECT 
                ar.record_id,
                ar.student_id,
                u.name as student_name,
                ar.status,
                ar.marked_at
            FROM attendance_records ar
            JOIN users u ON ar.student_id = u.user_id
            WHERE ar.event_id = ?
            ORDER BY u.name ASC
        `, [event_id]);

        return res.status(200).json({
            message: "Attendance event retrieved successfully",
            data: {
                ...eventData[0],
                records
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to retrieve event' });
    }
}

// Delete attendance event
exports.deleteAttendanceEvent = async (req, res) => {
    try {
        const { event_id } = req.params;

        const [checkEvent] = await pool.execute(
            `SELECT event_id FROM attendance_events WHERE event_id = ?`,
            [event_id]
        );

        if (!checkEvent || checkEvent.length === 0)
            return res.status(404).json({ error: 'Event not found' });
// Invalidate attendance event caches
        await invalidateCache(['cache:attendance:*', 'cache:admin:events:*', 'cache:admin:attendance:*', 'cache:admin:statistics*']);

        
        const [deleteResult] = await pool.execute(
            `DELETE FROM attendance_events WHERE event_id = ?`,
            [event_id]
        );

        if (deleteResult.affectedRows !== 1)
            return res.status(500).json({ error: 'Failed to delete event' });

        return res.status(200).json({ message: 'Attendance event deleted successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to delete event' });
    }
}


// ============= ANALYTICS & REPORTING =============

// Get dashboard statistics
exports.getDashboardStatistics = async (req, res) => {
    try {
        const [totalUsers] = await pool.execute(`SELECT COUNT(*) as count FROM users`);
        const [totalStudents] = await pool.execute(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`);
        const [totalTeachers] = await pool.execute(`SELECT COUNT(*) as count FROM users WHERE role = 'teacher'`);
        const [totalClasses] = await pool.execute(`SELECT COUNT(*) as count FROM classes`);
        const [totalEvents] = await pool.execute(`SELECT COUNT(*) as count FROM attendance_events`);
        
        const [attendanceStats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_records,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count
            FROM attendance_records
        `);

        const presentCount = attendanceStats[0].present_count || 0;
        const absentCount = attendanceStats[0].absent_count || 0;
        const totalRecords = attendanceStats[0].total_records || 0;
        const attendancePercentage = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(2) : 0;

        return res.status(200).json({
            message: "Dashboard statistics retrieved successfully",
            data: {
                users: {
                    total: totalUsers[0].count,
                    students: totalStudents[0].count,
                    teachers: totalTeachers[0].count
                },
                classes: totalClasses[0].count,
                events: totalEvents[0].count,
                attendance: {
                    totalRecords,
                    presentCount,
                    absentCount,
                    attendancePercentage: `${attendancePercentage}%`
                }
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to retrieve statistics' });
    }
}

// Get attendance report by class
exports.getAttendanceReportByClass = async (req, res) => {
    try {
        const { class_id } = req.params;

        const [classData] = await pool.execute(`
            SELECT class_id, class_name FROM classes WHERE class_id = ?
        `, [class_id]);

        if (!classData || classData.length === 0)
            return res.status(404).json({ error: 'Class not found' });

        const [students] = await pool.execute(`
            SELECT DISTINCT u.user_id, u.name, u.email
            FROM class_student cs
            JOIN users u ON cs.student_id = u.user_id
            WHERE cs.class_id = ?
            ORDER BY u.name ASC
        `, [class_id]);

        const [attendanceData] = await pool.execute(`
            SELECT 
                ar.student_id,
                ar.status,
                COUNT(*) as count
            FROM attendance_records ar
            JOIN attendance_events ae ON ar.event_id = ae.event_id
            WHERE ae.class_id = ?
            GROUP BY ar.student_id, ar.status
        `, [class_id]);

        // Build attendance summary
        const attendanceSummary = students.map(student => {
            const records = attendanceData.filter(r => r.student_id === student.user_id);
            const presentCount = records.find(r => r.status === 'present')?.count || 0;
            const absentCount = records.find(r => r.status === 'absent')?.count || 0;
            const totalCount = presentCount + absentCount;
            const attendancePercentage = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(2) : 0;

            return {
                ...student,
                presentCount,
                absentCount,
                totalCount,
                attendancePercentage: `${attendancePercentage}%`
            };
        });

        return res.status(200).json({
            message: "Class attendance report retrieved successfully",
            data: {
                class: classData[0],
                report: attendanceSummary
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to retrieve report' });
    }
}

// Get attendance report by student
exports.getAttendanceReportByStudent = async (req, res) => {
    try {
        const { student_id } = req.params;

        const [userData] = await pool.execute(`
            SELECT user_id, name, email FROM users WHERE user_id = ?
        `, [student_id]);

        if (!userData || userData.length === 0)
            return res.status(404).json({ error: 'Student not found' });

        const [classesAttended] = await pool.execute(`
            SELECT DISTINCT c.class_id, c.class_name
            FROM attendance_records ar
            JOIN attendance_events ae ON ar.event_id = ae.event_id
            JOIN classes c ON ae.class_id = c.class_id
            WHERE ar.student_id = ?
        `, [student_id]);

        const classReports = [];
        for (const cls of classesAttended) {
            const [records] = await pool.execute(`
                SELECT ar.status, COUNT(*) as count
                FROM attendance_records ar
                JOIN attendance_events ae ON ar.event_id = ae.event_id
                WHERE ae.class_id = ? AND ar.student_id = ?
                GROUP BY ar.status
            `, [cls.class_id, student_id]);

            const presentCount = records.find(r => r.status === 'present')?.count || 0;
            const absentCount = records.find(r => r.status === 'absent')?.count || 0;
            const totalCount = presentCount + absentCount;
            const attendancePercentage = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(2) : 0;

            classReports.push({
                ...cls,
                presentCount,
                absentCount,
                totalCount,
                attendancePercentage: `${attendancePercentage}%`
            });
        }

        return res.status(200).json({
            message: "Student attendance report retrieved successfully",
            data: {
                student: userData[0],
                report: classReports
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to retrieve report' });
    }
}

// Get department wise attendance report
exports.getDepartmentAttendanceReport = async (req, res) => {
    try {
        const { dep } = req.params;

        const [classes] = await pool.execute(`
            SELECT class_id, class_name FROM classes WHERE dep = ?
        `, [dep]);

        if (!classes || classes.length === 0)
            return res.status(404).json({ error: 'No classes found in this department' });

        let departmentReport = [];
        for (const cls of classes) {
            const [attendanceData] = await pool.execute(`
                SELECT 
                    COUNT(*) as total_records,
                    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
                    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count
                FROM attendance_records ar
                JOIN attendance_events ae ON ar.event_id = ae.event_id
                WHERE ae.class_id = ?
            `, [cls.class_id]);

            const presentCount = attendanceData[0].present_count || 0;
            const absentCount = attendanceData[0].absent_count || 0;
            const totalRecords = attendanceData[0].total_records || 0;
            const attendancePercentage = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(2) : 0;

            departmentReport.push({
                classId: cls.class_id,
                className: cls.class_name,
                totalRecords,
                presentCount,
                absentCount,
                attendancePercentage: `${attendancePercentage}%`
            });
        }

        return res.status(200).json({
            message: `Department (${dep}) attendance report retrieved successfully`,
            data: departmentReport
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to retrieve report' });
    }
}
