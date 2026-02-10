// The http module contains methods to handle http queries.
const http = require('http');
const httpProxy = require('http-proxy');

// We will need a proxy to send requests to the other services.
const proxy = httpProxy.createProxyServer();

const gameServiceTarget = process.env.GAME_SERVICE_URL || "http://127.0.0.1:8002";
const fileServiceTarget = process.env.FILE_SERVICE_URL || "http://127.0.0.1:8001";
const authServiceTarget = process.env.AUTH_SERVICE_URL || "http://127.0.0.1:8003";

/* The http module contains a createServer function, which takes one argument, which is the function that
** will be called whenever a new request arrives to the server.
 */
http.createServer(function (request, response) {
    // First, let's check the URL to see if it's a REST request or a file request.
    // We will remove all cases of "../" in the url for security purposes.
    let filePath = request.url.split("/").filter(function(elem) {
        return elem !== "..";
    });

    try {
        // If the URL starts by /api, then it's a REST request (you can change that if you want).
        if (filePath[1] === "api") {
            switch(filePath[2]) {
                case "game-service":
                    console.log("-> Redirection vers GameService (8002)");
                    proxy.web(request, response, { target: gameServiceTarget });
                    break;
                case "auth" :
                    console.log("-> Redirection vers AuthService (8003)");
                    proxy.web(request, response, { target: authServiceTarget });
                    break;
            }

        // If it doesn't start by /api, then it's a request for a file.
        } else {
            console.log("Request for a file received, transferring to the file service")
            proxy.web(request, response, {target: fileServiceTarget});
        }
    } catch(error) {
        console.log(`error while processing ${request.url}: ${error}`)
        response.statusCode = 400;
        response.end(`Something in your request (${request.url}) is strange...`);
    }
// For the server to be listening to request, it needs a port, which is set thanks to the listen function.
}).listen(8000);