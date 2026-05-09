exports.readJsonBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(e);
            }
        });
    });
}


exports.sendJson = (res, statusCode, payload) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
}


exports.parseCookies = (cookieHeader) => {
    const cookies = {};
    if (!cookieHeader) return cookies;

    cookieHeader.split(';').forEach(cookie => {
        const [key, value] = cookie.trim().split('=');
        cookies[key] = value;
    });

    return cookies;
}
