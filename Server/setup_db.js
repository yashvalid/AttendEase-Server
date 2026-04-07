require('dotenv').config();
const { pool, connectDB } = require('./DB/db');

const setup = async () => {
    try {
        await connectDB();
        console.log("Connected to DB, starting setup...");

        // 1. Add role to users table if not exists
        try {
            await pool.execute(`ALTER TABLE users ADD COLUMN role ENUM('student', 'teacher', 'admin') NOT NULL DEFAULT 'student' AFTER email`);
            console.log("Added 'role' column to users table.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("'role' column already exists in users table.");
            } else {
                console.error("Error adding 'role' column:", err.message);
            }
        }

        // 2. Create classes table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS classes (
                class_id VARCHAR(255) PRIMARY KEY,
                class_name VARCHAR(255) NOT NULL,
                teacher_id VARCHAR(255) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (teacher_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        `);
        console.log("Verified 'classes' table.");

        // 3. Create class_student table (if not exists - inferred from usage)
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS class_student (
                id INT AUTO_INCREMENT PRIMARY KEY,
                class_id VARCHAR(255) NOT NULL,
                student_id VARCHAR(255) NOT NULL,
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
                UNIQUE KEY unique_enrollment (class_id, student_id)
            )
        `);
        console.log("Verified 'class_student' table.");

        // 4. Create attendance_events table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS attendance_events (
                event_id INT AUTO_INCREMENT PRIMARY KEY,
                class_id VARCHAR(255) NOT NULL,
                teacher_id VARCHAR(255) NOT NULL,
                event_name VARCHAR(255) NOT NULL,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                start_time DATETIME NOT NULL,
                end_time DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
                FOREIGN KEY (teacher_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        `);
        console.log("Verified 'attendance_events' table.");

        // 5. Create attendance_records table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS attendance_records (
                record_id INT AUTO_INCREMENT PRIMARY KEY,
                event_id INT NOT NULL,
                student_id VARCHAR(255) NOT NULL,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                device_id VARCHAR(255),
                status ENUM('present', 'absent') DEFAULT 'present',
                marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES attendance_events(event_id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
                UNIQUE KEY unique_attendance (event_id, student_id)
            )
        `);
        console.log("Verified 'attendance_records' table.");

        console.log("Database setup complete.");
        process.exit(0);
    } catch (err) {
        console.error("Setup failed:", err);
        process.exit(1);
    }
};

setup();
