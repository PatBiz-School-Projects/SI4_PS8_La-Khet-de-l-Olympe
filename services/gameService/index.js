const http = require('http');
const router = require('./router')
const port = process.env.PORT || 8002;

http.createServer(function (request, response) {
    console.log(`Received query: ${request.url}`);
    router.manage(request,response);
}).listen(port);
