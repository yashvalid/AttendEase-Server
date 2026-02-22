const socket = require('socket.io');
const { pool } = require('./DB/db');

let io;

const initSocket = async (server) => {
    io = socket(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        console.log("socket connected", socket.id);
        socket.on("join", async (data) => {
            const userId = data.user_id || data;
            await pool.execute(
                'UPDATE users SET socket_id = ? WHERE user_id = ?',
                [socket.id, userId]
            );
        });
    })
}

const sendEvent = async (socketId, message) => {
    console.log(message)
    if (io)
        io.to(socketId).emit('attendance', message);
    else
        console.log("socket not initialized")
}

module.exports = {
    initSocket,
    sendEvent
}