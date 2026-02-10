const http = require('http');
const port = process.env.PORT || 8001;

const fileQuery = require('./logic.js');

http.createServer(function (request, response) {
  console.log(`Received query for a file: ${request.url}`);
  fileQuery.manage(request, response);
// For the server to be listening to request, it needs a port, which is set thanks to the listen function.
}).listen(port);