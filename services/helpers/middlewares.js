const { parseCookies } = require("./parser");

const { AUTH_SERVICE_URL } = process.env;


//
// Helpers
//


/**
 * Sends a 401 Unauthorized response and terminates the request.
 */
function rejectRequest(res, message = "Unauthorized") {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: message }));
}

/**
 * Checks whether the given access token is valid against the auth service.
 * @returns {Promise<boolean>}
 */
async function verifyToken(accessToken) {
    if (!accessToken) {
        // Missing access token
        return false;
    }

    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/check`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        }
    });
    return response.ok;
}

/**
 * Attempts to obtain a new access token using the given refresh token.
 * @returns {Promise<string|null>} The new access token, or null on failure.
 */
async function renewToken(refreshToken) {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/renew`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${refreshToken}`
        }
    });

    if (!response.ok) {
        return null;
    }

    const payload = await response.json();
    return payload?.accessToken || payload?.token || null;
}


/**
 * Attempts to generate a guest access token.
 * @returns {Promise<string|null>} The new guest access token, or null on failure.
 */
async function generateGuestToken() {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
        return null;
    }

    const payload = await response.json();
    return payload?.guestToken || null;
}


//
// Middlewares
//


/**
 * No-op middleware.
 * Use only for documentation purposes.
 */
exports.public = (handlerCb) => async (req, res) => {
    await handlerCb(req, res);
}

/**
 * Ensures the incoming request carries a valid access token.
 *
 * ### Flow:
 * 1. Valid userToken       => forward the request immediately
 * 2. Invalid/missing token => attempt renewal via refreshToken
 *    - Renewal succeeds => inject new token via Set-Cookie, forward to handlerCb.
 *    - Renewal fails    => respond 401, halt the request.
 */
exports.authenticated = (handlerCb) => async (req, res) => {
    const { userToken: cookieAccessToken, refreshToken: cookieRefreshToken } = parseCookies(req.headers.cookie);

    const accessToken  = req.headers.authorization?.replace('Bearer ', '') || cookieAccessToken;
    const refreshToken = req.headers['refreshtoken'] || cookieRefreshToken;
    try {
        // Step 1: Validate the current access token
        if (await verifyToken(accessToken)) {
            await handlerCb(req, res);
            return;
        }

        // Step 2: Try to renew the access token
        if (!refreshToken) {
            rejectRequest(res, "Missing or invalid authentication tokens");
            return;
        }

        const newAccessToken = await renewToken(refreshToken);

        if (!newAccessToken) {
            rejectRequest(res, "Session expired");
            return;
        }

        // Step 3: Inject the fresh token and forward the request
        const IS_PROD = process.env.IS_PROD === "true";
        const cookieOptions = [
            `userToken=${newAccessToken}`,
            "Path=/",
            "HttpOnly",
            IS_PROD ? "Secure" : "",
            "SameSite=None"
        ].filter(Boolean).join("; ");

        res.setHeader("Set-Cookie", cookieOptions);

        await handlerCb(req, res);
        return;
    } catch (err) {
        // Should never happens
        throw new Error(`Unexpected error during authentication check: ${err}`)
    }
};

/**
 * Dispatches the incoming request to the given guest & authenticated handler based on the presence of an access token.
 */
exports.dispatch_GuestORAuthenticated = (guestHandlerCb, authenticatedHandlerCb) => async (req, res) => {
    const { userToken: accessToken } = parseCookies(req.headers.cookie);

    if (accessToken) {
        await authenticatedHandlerCb(req, res);
        return;
    }

    const { guestToken } = parseCookies(req.headers.cookie);
    if (!guestToken) {
        const newGuestToken = await generateGuestToken();
        if (!newGuestToken) {
            throw new Error("Failed to generate guest access token");
        }

        const IS_PROD = process.env.IS_PROD === "true";
        const cookieOptions = [
            `guestToken=${newGuestToken}`,
            "Path=/",
            "HttpOnly",
            IS_PROD ? "Secure" : "",
            "SameSite=None"
        ].filter(Boolean).join("; ");

        res.setHeader("Set-Cookie", cookieOptions);
        req.headers.cookie = `${req.headers.cookie}; guestToken=${newGuestToken}`;
    }

    await guestHandlerCb(req, res);
}
