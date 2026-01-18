const http = require('http');
const router = require('./router')


http.createServer(function (request, response) {
    console.log(`Received query for a file: ${request.url}`);
    router.manage(request,response);
}).listen(8002);