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

        const { name, email, password } = req.body;
        const hashPass = await bcrypt.hash(password, 10);
        const user_id = uuidv4().split('-')[0];
        console.log(hashPass)
        const [existing] = await pool.execute(`select * from users where email = ?`,
            [email]
        );
        if (existing[0])
            return res.status(404).json({ error: "Email already exists" });

        const [createUser] = await pool.execute(`insert into users (user_id, name, email, password, created_at) values(?,?,?,?,?)`,
            [user_id, name, email, hashPass, new Date()]
        );

        if (!createUser || createUser.affectedRows !== 1)
            return res.status(404).json({ message: "Error registering user" });

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
        return res.status(200).json({ message: "Login successfull", token, user_id : user.user_id });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Login failed' });
    }
}

exports.add_classes = async (req, res) => {
    try{
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(422).json({errors : errors.array()});

        const {class_id} = req.body;

        const [exists] = await pool.execute(`select * from class_student where class_id = ? and student_id = ? limit 1`,
            [class_id, req.user.user_id]
        )
        if(exists.length > 0)
            return res.status(404).json({error : "Class already added"});
        const [add_cs] = await pool.execute(`insert into class_student(class_id, student_id) values(?,?)`,
            [class_id, req.user.user_id]
        );

        if (!add_cs || add_cs.affectedRows !== 1)
            return res.status(404).json({ message: "Error add class" });

        return res.status(201).json({message : "Class added"});
    } catch(err){
        return res.status(500).json({error : "Internal server error"});
    }
}