const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

async function isUserConnected(userId) {
    if (!userId) {
        return false;
    }

    const response = await fetch(`${USER_SERVICE_URL}/api/users/connected/is-connected`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({userId})
    });

    if (!response.ok) {
        return false;
    }

    const payload = await response.json();
    return payload.connected;
}

module.exports = {
    isUserConnected,
};
