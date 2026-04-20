const http = require('http');
const https = require('https');
const httpProxy = require('http-proxy');
const addCors = require('cors');
const {
    GAME_SERVICE_URL,
    FILE_SERVICE_URL,
    AUTH_SERVICE_URL,
    USER_SERVICE_URL,
    CHALLENGE_SERVICE_URL,
    CHAT_SERVICE_URL,
} = process.env;

const IS_PROD = process.env.IS_PROD === "true";

// Proxy to send requests to the other services.
const proxy = httpProxy.createProxyServer();

function getPathSegments(url) {
    const pathname = new URL(url, "http://localhost").pathname;
    return pathname.split("/").filter((elem) => elem !== "..");
}

async function handleHTTPRequest(req, res) {
    // First, let's check the URL to see if it's a REST request or a file request.
    // We will remove all cases of "../" in the url for security purposes.
    const filePath = getPathSegments(req.url);
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.statusCode = 204;
        res.end();
        return;
    }

    // Add CORS headers to all other responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    try {
        // If the URL starts by /api, then it's a REST request (you can change that if you want).
        if (filePath[1] === "api") {
            switch(filePath[2]) {
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
                case "chats":
                    console.log("-> Redirection chat-service (8006)");
                    proxy.web(req, res, { target: CHAT_SERVICE_URL });
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
            case "games":
                console.log("Transfer WS upgrade to game-service (8002)");
                proxy.ws(req, socket, head, { target: GAME_SERVICE_URL });
                break;
            case "challenge-service":
                console.log("-> WS Upgrade vers ChallengeService (8005)");
                proxy.ws(req, socket, head, { target: CHALLENGE_SERVICE_URL });
                break;
            case "chats":
                console.log("-> WS Upgrade vers chat-service (8006)");
                proxy.ws(req, socket, head, { target: CHAT_SERVICE_URL });
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
        const redirectUrl = `https://${req.headers.host}${req.url}`;
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

    httpServer.on("upgrade", handleWebSocket);

    // For the server to be listening to request, it needs a port, which is set thanks to the listen function.
    httpServer.listen(8000);
}
