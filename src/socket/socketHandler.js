const jwt = require('jsonwebtoken');

/**
 * Socket.io setup.
 *
 * - Authenticates every connection via JWT passed in handshake.auth.token
 * - Joins each user to a room named after their teamId.
 * - Exports getIO() so controllers/services can emit events anywhere.
 */

let io;

const initSocket = (server) => {
    const { Server } = require('socket.io');
    io = new Server(server, {
        cors: {
            origin: '*', // tighten in production
            methods: ['GET', 'POST'],
        },
    });

    // ---------- JWT authentication middleware for Socket.io ----------
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication error — no token'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            socket.teamId = decoded.teamId;
            next();
        } catch (err) {
            return next(new Error('Authentication error — invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id} (team: ${socket.teamId})`);

        // Join the team room so we can emit team-specific events
        if (socket.teamId) {
            socket.join(socket.teamId);
        }

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized — call initSocket first');
    }
    return io;
};

module.exports = { initSocket, getIO };
