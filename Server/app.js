const dotenv = require("dotenv").config()
const express = require("express");
const { connectDB } = require("./DB/db");
const http = require('http')
const app = express();
const userRouter = require('./routes/users.routes');
const attendanceRouter = require('./routes/attendance.routes')
const adminRouter = require('./routes/admin.routes');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { initSocket } = require("./socket");
const { connectRedis } = require("./config/redis");
const { cache } = require("./middleware/cache");

Promise.all([connectDB(), connectRedis()])
    .then(() => {
        app.use(express.json());
        app.use(cors());
        app.use(express.urlencoded({ extended: true }));
        app.use(cookieParser());

        app.get("/", (req, res) => {
            res.send("hello from server")
        })

        app.use('/api/user', userRouter);
        app.use('/api/event', attendanceRouter);
        app.use('/api/admin', adminRouter);

        const server = http.createServer(app);

        initSocket(server);

        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`server running on port ${PORT}`);
        })
    })
    .catch((err) => {
        console.error('Startup error:', err);
        process.exit(1);
    })


