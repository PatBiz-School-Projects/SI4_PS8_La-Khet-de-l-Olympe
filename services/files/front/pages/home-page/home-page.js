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


async function startSoloGame() {
    const playerId = await newPlayer();

    try {
        const res = await fetch("/api/game-service/start-solo-game", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({playerId}),
        });
        if (!res.ok) {
            throw res.error;
        }

        const { gameId } = await res.json();
        setCookie("gameId", gameId);
    } catch (err) {
        throw err;
    }

    window.location.href = "../waiting-room-page/waiting-room-page.html";
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

    window.location.href = "../waiting-room-page/waiting-room-page.html";
}


async function joinMultiplayerGame() {
    const playerId = await newPlayer();

    try {
        const res = await fetch("/api/game-service/join-multiplayer-game", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({playerId}),
        });
        if (!res.ok) {
            throw res.error;
        }

        const { gameId } = await res.json();
        setCookie("gameId", gameId);
    } catch (err) {
        throw err;
    }

    window.location.href = "../waiting-room-page/waiting-room-page.html";
}


/** @type {HTMLButtonElement} */
const startSoloGame_btn = document.getElementById("start-solo-btn");
startSoloGame_btn.onclick = async (_) => await startSoloGame()


/** @type {HTMLButtonElement} */
const startLocalMultiplayerGame_btn = document.getElementById("start-local-multiplayer-btn");
startLocalMultiplayerGame_btn.onclick = async (_) => await startLocalMultiplayerGame()

/** @type {HTMLButtonElement} */
const joinMultiplayerGame_btn = document.getElementById("join-multiplayer-btn");
joinMultiplayerGame_btn.onclick = async (_) => await joinMultiplayerGame()
