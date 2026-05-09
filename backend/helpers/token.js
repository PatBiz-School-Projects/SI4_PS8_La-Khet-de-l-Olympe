function extractToken(req, body) { // fonction qui extrait le token du body
    if (body && body.token) {
        return body.token;
    }

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice('Bearer '.length);
    }

    return null;
}

function extractUserId(token) {
    try {
        const payloadPart = token.split('.')[1];
        const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const json = atob(base64);
        const payload = JSON.parse(json);

        return payload.sub;
    } catch (error) {
        return null;
    }
}
module.exports = {extractToken,extractUserId};
