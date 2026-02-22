const { pool } = require('../DB/db');
const { v4: uuidv4, v4 } = require('uuid');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() });

        const { name, email, password, role, year, dep } = req.body;
        const hashPass = await bcrypt.hash(password, 10);
        const user_id = uuidv4().split('-')[0];
        const [existing] = await pool.execute(`select * from users where email = ?`,
            [email]
        );
        if (existing[0])
            return res.status(404).json({ error: "Email already exists" });

        const [createUser] = await pool.execute(`insert into users (user_id, name, email, password, role, dep, created_at) values(?,?,?,?,?,?,?)`,
            [user_id, name, email, hashPass, role || 'student', dep, new Date()]
        );

        if (!createUser || createUser.affectedRows !== 1)
            return res.status(404).json({ message: "Error registering user" });

        for (let i = 0; i < year.length; i++)
            await pool.execute(`insert into user_years (user_id, year) values(?,?)`,
                [user_id, year[i]]
            );

        return res.status(201).json({ message: "Registration successfull" });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Registration failed!' });
    }
}

exports.login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() });

        const { email, password } = req.body;

        const [result] = await pool.execute(`select * from users where email = ?`,
            [email]
        );

        if (!result || result.length === 0)
            return res.status(401).json({ message: 'Invalid email or password' });

        const user = result[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch)
            return res.status(401).json({ message: 'Invalid email or password' });

        const token = jwt.sign(
            { user_id: user.user_id },
            process.env.JWT_SECRET
        );

        res.cookie("token", token);
        return res.status(200).json({ message: "Login successfull!", token, user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role, dep: user.dep } });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Login failed' });
    }
}

exports.create_class = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() });

        if (req.user.role !== 'teacher')
            return res.status(403).json({ error: "Only teachers can create classes" });

        const { class_name, year } = req.body;
        const class_id = uuidv4().split('-')[0];

        const [dep] = await pool.execute(`select dep from users where user_id = ?`, [req.user.user_id]);
        console.log(dep)
        const [create] = await pool.execute(
            `INSERT INTO classes (class_id, class_name, teacher_id, year, dep) VALUES (?, ?, ?, ?, ?)`,
            [class_id, class_name, req.user.user_id, year, dep[0].dep]
        );
        console.log(create)
        if (!create || create.affectedRows !== 1)
            return res.status(500).json({ message: "Error creating class" });

        return res.status(201).json({ message: "Class created successfully", class_id });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
}


exports.get_classes_by_teacher = async (req, res) => {
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ error: "Unauthorized" });
        }
        const [classes] = await pool.execute(
            `SELECT c.*, COUNT(cs.student_id) AS student_count 
             FROM classes c 
             LEFT JOIN class_student cs ON c.class_id = cs.class_id 
             WHERE c.teacher_id = ? 
             GROUP BY c.class_id`,
            [req.user.user_id]
        );
        return res.status(200).json({ classes });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
}


exports.add_classes = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() });

        const { class_id } = req.body;

        // Check if class exists
        const [classExists] = await pool.execute(`select * from classes where class_id = ?`, [class_id]);
        if (classExists.length === 0) {
            return res.status(404).json({ error: "Class ID not found" });
        }

        const [exists] = await pool.execute(`select * from class_student where class_id = ? and student_id = ? limit 1`,
            [class_id, req.user.user_id]
        )
        if (exists.length > 0)
            return res.status(409).json({ error: "Class already added" }); // 409 Conflict
        const [add_cs] = await pool.execute(`insert into class_student(class_id, student_id) values(?,?)`,
            [class_id, req.user.user_id]
        );

        if (!add_cs || add_cs.affectedRows !== 1)
            return res.status(500).json({ message: "Error add class" });

        return res.status(201).json({ message: "Class added" });
    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: "Internal server error" });
    }
}

exports.get_classes_by_student = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ error: "Unauthorized" });
        }
        const [classes] = await pool.execute(

            `SELECT classes.*, users.name AS teacher_name FROM classes JOIN users ON classes.teacher_id = users.user_id WHERE classes.dep = ? AND classes.year = ?`,
            [req.user.dep, req.user.year]
        );
        return res.status(200).json({ classes });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

exports.get_enrolled_classes = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ error: "Unauthorized" });
        }
        const [classes] = await pool.execute(
            `SELECT classes.*, users.name AS teacher_name FROM classes JOIN users ON classes.teacher_id = users.user_id WHERE classes.dep = ? AND classes.year = ?`,
            [req.user.dep, req.user.year]
        );
        return res.status(200).json({ classes });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

exports.get_profile = async (req, res) => {
    try {
        const [user] = await pool.execute(`select * from users where user_id = ?`, [req.user.user_id]);
        if (!user[0])
            return res.status(404).json({ error: "User not found" });
        return res.status(201).json({ user: user[0] });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

