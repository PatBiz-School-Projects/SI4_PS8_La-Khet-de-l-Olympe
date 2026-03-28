const http = require('http');
const router = require('./router');

const port = process.env.PORT;

http.createServer(function (request, response) {
    console.log(`Received request: ${request.method} ${request.url}`);
    router.manage(request, response);
}).listen(port);
