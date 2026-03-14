const http = require('http');
const httpProxy = require('http-proxy');

// We need a proxy to send requests to the other services.
const proxy = httpProxy.createProxyServer();

const gameServiceTarget = process.env.GAMES_SERVICE_URL;
const filesServiceTarget = process.env.FILES_SERVICE_URL;
const authServiceTarget = process.env.AUTH_SERVICE_URL;
const userServiceTarget = process.env.USER_SERVICE_URL;

const server = http.createServer(function (request, response) {
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
                    console.log("-> Redirection vers GamesService (8002)");
                    proxy.web(request, response, { target: gameServiceTarget });
                    break;
                case "auth" :
                    console.log("-> Redirection vers AuthService (8003)");
                    proxy.web(request, response, { target: authServiceTarget });
                    break;
                case "users" :
                    console.log("-> Redirection vers UsersService (8004)");
                    proxy.web(request, response, { target : userServiceTarget});
                    break;
            }

        // If it doesn't start by /api, then it's a request for a file.
        } else {
            console.log("Request for a file received, transferring to the file service")
            proxy.web(request, response, {target: filesServiceTarget});
        }
    } catch(error) {
        console.log(`error while processing ${request.url}: ${error}`)
        response.statusCode = 400;
        response.end(`Something in your request (${request.url}) is strange...`);
    }
});

// Handle WebSocket upgrade requests
server.on("upgrade", function (request, socket, head) {
    let filePath = request.url.split("/").filter(function(elem) {
        return elem !== "..";
    });

    if (filePath[1] === "api") {
        switch(filePath[2]) {
            case "game-service":
                console.log("-> WS Upgrade vers GamesService (8002)");
                proxy.ws(request, socket, head, { target: gameServiceTarget });
                break;
        }
    }
});

// For the server to be listening to request, it needs a port, which is set thanks to the listen function.
server.listen(8000);
