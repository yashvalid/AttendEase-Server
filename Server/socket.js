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
        socket.on("join", async (data) => {
            
            const user_id = String(data);
            const [user] = await pool.execute(`update users set socket_id = ? where user_id = ?`,
                [socket.id, data]
            );
            
        })
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