const userServiceUrl = process.env.USERS_SERVICE_URL;

async function createUserProfile({ authId, username }) {
    const payload = { authId, username };

    const response = await fetch(userServiceUrl+'/api/users', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`USER_SERVICE_ERROR_${response.status}: ${body}`);
    }
}

async function markUserConnected(token) {
    const response = await fetch(userServiceUrl+'/api/users/connect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`USER_SERVICE_CONNECT_ERROR_${response.status}: ${body}`);
    }
}

async function markUserDisconnected(token) {
    const response = await fetch(`${userServiceUrl}/api/users/disconnect`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`USER_SERVICE_DISCONNECT_ERROR_${response.status}: ${body}`);
    }
}

module.exports = {
    createUserProfile,
    markUserConnected,
    markUserDisconnected,
};
