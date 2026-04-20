const http = require("http");
const { EventBus } = require("./helpers/event-bus");

const router = require("./controllers/router");
const network = require("./controllers/network");

const { PORT, REDIS_URL } = process.env;


const server = http.createServer(function (request, response) {
    console.log(`Received query: ${request.url}`);
    router.manage(request,response);
}).listen(PORT);
network.server = server;


const bus = new EventBus("users", {
    url: REDIS_URL,
    writeonly: true,
});
network.bus = bus;
