const jwt = require('jsonwebtoken');
const { pool } = require('../DB/db');

const authenticateToken = async (req, res, next) => {
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];

    if (!token)
        return res.status(401).json({ error: 'Access token required' });

    try {
        const decodeToken = jwt.verify(token, process.env.JWT_SECRET);
        const [user] = await pool.execute(
            `SELECT u.*, uy.year 
             FROM users u 
             LEFT JOIN user_years uy ON u.user_id = uy.user_id AND u.role = 'student' 
             WHERE u.user_id = ?`,
            [decodeToken.user_id]
        );

        if (!user)
            return res.status(401).json({ message: "Invalid user" });
        req.user = user[0];
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

module.exports = authenticateToken;