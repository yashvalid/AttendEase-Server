const dotenv = require("dotenv").config()
const express = require("express");
const {connectDB} = require("./DB/db");
const http = require('http')
const app = express();
const userRouter = require('./routes/users.routes');
const attendanceRouter = require('./routes/attendance.routes')
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { initSocket } = require("./socket");

connectDB();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/",(req,res) => {
    res.send("hello from server")
})

app.use('/api/user', userRouter);
app.use('/api/event',attendanceRouter);

const server = http.createServer(app);

initSocket(server);

server.listen(1000, () => {
    console.log("server running on port 1000");
})