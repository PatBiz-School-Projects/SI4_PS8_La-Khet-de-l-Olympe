const { Server } = require('socket.io');
const { parseCookies } = require('../helpers/parser');

let ioServer = null;

function initChallengeSocket(httpServer) {
    ioServer = new Server(httpServer, {
        path: '/api/challenge-service/socket.io',
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    ioServer.use((socket, next) => {
        try {
            const { userId, userToken } = parseCookies(socket.handshake.headers.cookie || '');
            if (!userId || !userToken) {
                throw new Error('MISSING_AUTH_COOKIE');
            }
            socket.data.userId = userId;
            return next();
        } catch (error) {
            return next(error);
        }
    });

    ioServer.on('connection', (socket) => {
        socket.join(`user:${socket.data.userId}`);
    });

    return ioServer;
}

function notifyUser(userId, eventName, payload) {
    if (!ioServer || !userId || !eventName) {
        return;
    }

    ioServer.to(`user:${userId}`).emit(eventName, payload);
}

module.exports = {
    initChallengeSocket,
    notifyUser,
};
