const http = require('http');
const router = require('./http/router');
const { initChallengeSocket, notifyUser } = require('./socket/challengeSocket');
const { setChallengeNotifier } = require('./http/challengeService');

const port = process.env.PORT;

const server = http.createServer(function (request, response) {
    console.log(`Received request: ${request.method} ${request.url}`);
    router.manage(request, response);
});

initChallengeSocket(server);
setChallengeNotifier({ notifyUser });

server.listen(port);
