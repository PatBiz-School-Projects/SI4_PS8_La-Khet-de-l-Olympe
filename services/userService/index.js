const http = require('http');
const router = require('./controllers/router')
const port = process.env.PORT;

http.createServer(function (request, response) {
    console.log(`Received query for a file: ${request.url}`);
    router.manage(request,response);
}).listen(port);
