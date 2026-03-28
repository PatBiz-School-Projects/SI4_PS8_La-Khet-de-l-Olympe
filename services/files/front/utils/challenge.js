import {authenticatedFetch, ensureValidAccessToken} from "/utils/auth.js"

export async function sendChallenge(targetUserId) {
    const token = await ensureValidAccessToken();
    if (!token) {
        return {
            ok: false,
            error: 'MISSING_TOKEN',
            status: 401,
        };
    }

    try {
        const response = await authenticatedFetch('/api/challenge-service/challenges', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ targetUserId })
        });

        if (!response) {
            return {
                ok: false,
                error: 'MISSING_TOKEN',
                status: 401,
            };
        }

        const payload = await response.json();
        return {
            ok: response.ok,
            status: response.status,
            payload,
        };
    } catch (error) {
        console.error(error);
        return {
            ok: false,
            error: 'NETWORK_ERROR',
            status: 0,
        };
    }
}


