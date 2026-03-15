import "/components/index.js"

import { setCookie, getCookie, removeCookie,clearCookies } from "/utils/cookie.js";



function decodeJwtPayload(token) {
    try {
        const payloadPart = token.split('.')[1];
        const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const json = atob(base64);
        return JSON.parse(json);
    } catch (error) {
        return null;
    }
}

function setAuthButtonsVisibility(isLoggedIn) {
    signup_btn.style.display = isLoggedIn ? "none" : "inline-block";
    login_btn.style.display = isLoggedIn ? "none" : "inline-block";
    logout_btn.style.display = isLoggedIn ? "inline-block" : "none";
}

function setSessionCookiesAndGetUserId() {
    const token = getCookie('userToken');
    if (!token) {
        return null;
    }

    const payload = decodeJwtPayload(token);
    const userId = payload?.sub;
    if (!userId) {
        removeCookie('userToken');
        return null;
    }

    setCookie('userId', userId);
    setCookie('userToken', token);
    return userId;
}

async function logout() {
    try {
        const token = getCookie('userToken');
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Logout request failed', error);
    } finally {
        clearCookies();
        window.location.href="../login/login.html";
    }
}

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
const signup_btn = document.getElementById("signup-btn");
/** @type {HTMLButtonElement} */
const login_btn = document.getElementById("login-btn");
/** @type {HTMLButtonElement} */
const logout_btn = document.getElementById("logout-btn");
logout_btn.onclick = async (_) => await logout();
setAuthButtonsVisibility(Boolean(setSessionCookiesAndGetUserId()));

/** @type {HTMLButtonElement} */
const startSoloGame_btn = document.getElementById("start-solo-btn");
startSoloGame_btn.onclick = async (_) => await startSoloGame()


/** @type {HTMLButtonElement} */
const startLocalMultiplayerGame_btn = document.getElementById("start-local-multiplayer-btn");
startLocalMultiplayerGame_btn.onclick = async (_) => await startLocalMultiplayerGame()

/** @type {HTMLButtonElement} */
const joinMultiplayerGame_btn = document.getElementById("join-multiplayer-btn");
joinMultiplayerGame_btn.onclick = async (_) => await joinMultiplayerGame()
