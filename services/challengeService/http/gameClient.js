const GAME_SERVICE_URL = process.env.GAME_SERVICE_URL;

async function createPlayerForChallenger(cookieHeader) {
    const response = await fetch(`${GAME_SERVICE_URL}/api/games/new-player`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            cookie: cookieHeader,
        },
        body: JSON.stringify({/* nothing */}),
    });

    const payload = await response.json();

    if (!response.ok || !payload.playerId) {
        throw new Error(payload.error || 'UNABLE_TO_CREATE_PLAYER');
    }

    return payload.playerId;
}

async function openMultiplayerRoom(playerId, cookieHeader) {
    const response = await fetch(`${GAME_SERVICE_URL}/api/games/open-multiplayer-room`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            cookie: cookieHeader,
        },
        body: JSON.stringify({ playerId }),
    });

    const payload = await response.json();

    if (!response.ok || !payload.gameId) {
        throw new Error(payload.error || 'UNABLE_TO_CREATE_WAITING_ROOM');
    }

    return payload.gameId;
}

async function joinSpecificMultiplayerRoom(playerId, gameId, cookieHeader) {
    const response = await fetch(`${GAME_SERVICE_URL}/api/games/join-private-multiplayer-game`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            cookie: cookieHeader,
        },
        body: JSON.stringify({ playerId, gameId }),
    });

    const payload = await response.json();

    if (!response.ok || !payload.gameId) {
        throw new Error(payload.error || 'UNABLE_TO_CREATE_WAITING_ROOM');
    }

    return payload.gameId;
}

async function prepareChallengeMatch(cookieHeader) {
    const playerId = await createPlayerForChallenger(cookieHeader);
    const gameId = await openMultiplayerRoom(playerId, cookieHeader);

    return { playerId, gameId };
}

async function acceptChallengeMatch(gameId, cookieHeader) {
    const playerId = await createPlayerForChallenger(cookieHeader);
    await joinSpecificMultiplayerRoom(playerId, gameId, cookieHeader);

    return { playerId, gameId };
}

module.exports = {
    prepareChallengeMatch,
    acceptChallengeMatch,
};
