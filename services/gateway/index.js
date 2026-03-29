const http = require('http');
const https = require('https');
const httpProxy = require('http-proxy');

const GAME_SERVICE_URL = process.env.GAME_SERVICE_URL;
const FILE_SERVICE_URL = process.env.FILE_SERVICE_URL;
const AUTH_SERVICE_URL  = process.env.AUTH_SERVICE_URL;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL;
const CHALLENGE_SERVICE_URL = process.env.CHALLENGE_SERVICE_URL;

const IS_PROD = process.env.IS_PROD === "true";

// Proxy to send requests to the other services.
const proxy = httpProxy.createProxyServer();

async function handleHTTPRequest(req, res) {
    // First, let's check the URL to see if it's a REST request or a file request.
    // We will remove all cases of "../" in the url for security purposes.
    let filePath = req.url.split("/").filter(function(elem) {
        return elem !== "..";
    });

    try {
        // If the URL starts by /api, then it's a REST request (you can change that if you want).
        if (filePath[1] === "api") {
            switch(filePath[2]) {
                case "game-service":
                    console.warn(`Deprecated request to game-service received: "${req.url}"`);
                    /* continue in "games" case */
                case "games":
                    console.log("-> Transfer request to game-service (8002)");
                    proxy.web(req, res, { target: GAME_SERVICE_URL });
                    break;
                case "auth":
                    console.log("-> Transfer request to auth-service (8003)");
                    proxy.web(req, res, { target: AUTH_SERVICE_URL });
                    break;
                case "users":
                    console.log("-> Transfer request to user-service (8004)");
                    proxy.web(req, res, { target : USER_SERVICE_URL });
                    break;
                case "challenge-service" :
                    console.log("-> Redirection challengeService (8005)");
                    proxy.web(req, res, { target: CHALLENGE_SERVICE_URL });
                    break;
            }

        // If it doesn't start by /api, then it's a request for a file.
        } else {
            console.log("Request for a file received, transferring to the file service")
            proxy.web(req, res, { target: FILE_SERVICE_URL });
        }
    } catch(error) {
        console.log(`Error while processing ${req.url}: ${error}`)
        res.statusCode = 400;
        res.end(`Something in your request (${req.url}) is strange...`);
    }
}

function handleWebSocket(req, socket, head) {
    let filePath = req.url.split("/").filter(function(elem) {
        return elem !== "..";
    });

    if (filePath[1] === "api") {
        switch(filePath[2]) {
            case "game-service":
                console.warn("Deprecated socket connection method used");
                /* continue in "games" case */
            case "games":
                console.log("Transfer WS upgrade to game-service (8002)");
                proxy.ws(req, socket, head, { target: GAME_SERVICE_URL });
                break;
            case "challenge-service":
                console.log("-> WS Upgrade vers ChallengeService (8005)");
                proxy.ws(req, socket, head, { target: CHALLENGE_SERVICE_URL });
                break;
        }
    }
}

if (IS_PROD) {
    // HTTPS Certification
    const HTTPS_CERTIFICATION = {
        cert: process.env.SSL_CERTIFICATE.replace(/\\n/g, '\n'),
        key:  process.env.SSL_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };

    // HTTP server to redirect client to the HTTPS server
    const httpServer = http.createServer((req, res) => {
        const httpsUrl = `https://${req.headers.host}${request.url}`;

        const host = req.headers.host.replace(/:8000$/, ':8443');
        const redirectUrl = `https://${host}${req.url}`;
        console.log(`Redirect to HTTPS: ${req} --> ${redirectUrl}`);
        res.writeHead(301, { 'Location': redirectUrl });
        res.end();
    });

    // HTTPS server
    const httpsServer = https.createServer(HTTPS_CERTIFICATION, handleHTTPRequest);

    // Handle WebSocket upgrade requests
    httpsServer.on("upgrade", handleWebSocket);

    // For the servers to be listening to request, it needs a port, which is set thanks to the listen function.
    httpServer.listen(8000);
    httpsServer.listen(8443);
} else {
    // HTTP server
    const httpServer = http.createServer(handleHTTPRequest);

    // For the server to be listening to request, it needs a port, which is set thanks to the listen function.
    httpServer.listen(8000);
}





