
const userServiceUrl = process.env.USER_SERVICE_URL;

async function fetchUserSnapshot(userId) {

    const response = await fetch(`${userServiceUrl}/api/users/${encodeURIComponent(userId)}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`USER_SERVICE_PROFILE_ERROR_${response.status}: ${body}`);
    }

    return response.json();
}

async function applyMatchResult(payload) {


    const response = await fetch(`${userServiceUrl}/api/users/elo/match-result`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`USER_SERVICE_ELO_ERROR_${response.status}: ${body}`);
    }

    return response.json();
}

module.exports = {
    fetchUserSnapshot,
    applyMatchResult,
};
