const userServiceUrl = process.env.USER_SERVICE_URL;

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

exports.createUserProfile = createUserProfile;
