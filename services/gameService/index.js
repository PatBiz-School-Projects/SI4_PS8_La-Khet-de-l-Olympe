const http = require('http');
const { Server } = require('socket.io');
const router = require('./router')


const PORT = process.env.PORT || 8002;


const server = http.createServer(function (request, response) {
    console.log(`Received query: ${request.url}`);
    router.manage(request, response);
}).listen(PORT);


const io = new Server(server, {
    path: "/api/game-service/socket.io",
    cors: false,
});
router.manageSocket(io);
