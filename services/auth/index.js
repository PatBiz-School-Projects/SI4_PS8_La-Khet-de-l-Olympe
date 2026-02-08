const http = require('http');
const router = require('./router')
const port = process.env.PORT || 8003;

http.createServer(function (request, response) {
    console.log(`Received query for a file: ${request.url}`);
    router.manage(request,response);
}).listen(port);