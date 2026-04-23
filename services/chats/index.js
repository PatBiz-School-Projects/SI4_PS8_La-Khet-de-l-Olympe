const http = require("http");
const { Server } = require("socket.io");
const { EventBus } = require("./helpers/event-bus");

const router = require("./router");
const network = require("./network");

const { PORT, REDIS_URL } = process.env;


const server = http.createServer(function (request, response) {
    console.log(`Received query: ${request.url}`);
    router.manage(request, response);
}).listen(PORT);
network.server = server;


const io = new Server(server, {
    path: "/api/chats/socket.io",
    cors: {
        origin: '*',
    },
});
router.manageSocket(io);
network.io = io;


const bus = new EventBus("chats", {
    url: REDIS_URL,
    readonly: true,
});
router.manageEvents(bus);
network.bus = bus;
