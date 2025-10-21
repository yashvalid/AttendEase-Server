const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DB,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const connectDB = async () => {
    try{
        const db = await pool.getConnection();
        console.log("DB connected");
        db.release();
    } catch(err){
        console.log(err);
    }
}

module.exports = {connectDB, pool};