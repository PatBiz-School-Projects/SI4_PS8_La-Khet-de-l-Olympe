import "/components/index.js"

import { setCookie } from "/utils/cookie.js";


// Temporary solution
const USER_ID = "test";        // TODO : Update once a user service is implemented
setCookie("userId", USER_ID);
const USER_TOKEN = "74657374"; // TODO : Replace with the authentication token
setCookie("userToken", USER_TOKEN);


async function newPlayer() {
    try {
        const res = await fetch("/api/game-service/new-player", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({/* empty */}),
        });
        if (!res.ok) {
            throw res.error;
        }
        const { playerId } = await res.json();
        return playerId;
    } catch (err) {
        throw err;
    }
}

async function startLocalMultiplayerGame() {
    const playerId1 = await newPlayer();
    const playerId2 = await newPlayer();

    try {
        const res = await fetch("/api/game-service/start-local-multiplayer-game", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({playerId1, playerId2}),
        });
        if (!res.ok) {
            throw res.error;
        }

        const { gameId } = await res.json();
        setCookie("gameId", gameId);
    } catch (err) {
        throw err;
    }
}

// NOTE : Currently simulates the start of a local multiplayer game
// TODO : Make a true home page

await startLocalMultiplayerGame();

window.location.href = "../game-page/game-page.html";
