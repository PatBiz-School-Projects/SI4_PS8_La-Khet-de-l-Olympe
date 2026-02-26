import "/components/index.js"

import { setCookie } from "/utils/cookie.js";


// NOTE : Currently simulates the start of a local multiplayer game
// TODO : Make a true home page

async function startLocalMultiplayerGame() {
    try {
        const res = await fetch("/api/game-service/start-local-multiplayer-game", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                // TODO : Implement a way to generate distinct player ids (currently it's just raw value)
                playerId1: 1,
                playerId2: 2,
            }),
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

await startLocalMultiplayerGame();

window.location.href = "../game-page/game-page.html";
