import { setCookie, removeAllCookies } from "/utils/cookie.js";
import { decodeJwtPayload } from "/utils/jwt.js";
import {ensureValidAccessToken,clearAuthTokens} from "/utils/auth.js";


//
// Auth Logic & Components
//


async function signup() {
    // TODO : Replace the signup page by a popup
    window.location.href = "/home/auth/pages/signup/signup.html";
}

async function login() {
    // TODO : Replace the login page by a popup
    window.location.href = "/home/auth/pages/login/login.html";
}

async function logout() {
    try {
        const token = await ensureValidAccessToken();
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
        clearAuthTokens();
        removeAllCookies();
        window.location.href="/home/auth/pages/login/login.html";
    }
}


/** @type {HTMLButtonElement} */
const signup_btn = document.getElementById("signup-btn");
signup_btn.onclick = async _ => await signup();

/** @type {HTMLButtonElement} */
const login_btn = document.getElementById("login-btn");
login_btn.onclick = async _ => await login();

/** @type {HTMLButtonElement} */
const logout_btn = document.getElementById("logout-btn");
logout_btn.onclick = async _ => await logout();


//
// Game Join Logic & Components
//

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


const modal = document.getElementById("difficulty-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const btnEasy = document.getElementById("btn-easy");
const btnHard = document.getElementById("btn-hard");



closeModalBtn.onclick = () => {
    modal.style.display = "none";
};

btnEasy.onclick = async () => {
    modal.style.display = "none";
    await startSoloGame("easy");
};

btnHard.onclick = async () => {
    modal.style.display = "none";
    await startSoloGame("hard");
};

async function startSoloGame(difficulty) {
    const playerId = await newPlayer();

    try {
        const res = await fetch("/api/game-service/start-solo-game", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({playerId,difficulty}),
        });
        if (!res.ok) {
            throw res.error;
        }

        const { gameId } = await res.json();
        setCookie("gameId", gameId);
    } catch (err) {
        throw err;
    }

    window.location.href = "/waiting-room/pages/waiting-room-page/waiting-room-page.html";
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

    window.location.href = "/waiting-room/pages/waiting-room-page/waiting-room-page.html";
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

    window.location.href = "/waiting-room/pages/waiting-room-page/waiting-room-page.html";
}


/** @type {HTMLButtonElement} */
const startSoloGame_btn = document.getElementById("start-solo-btn");
startSoloGame_btn.onclick = () => {
    modal.style.display = "flex";
};


/** @type {HTMLButtonElement} */
const startLocalMultiplayerGame_btn = document.getElementById("start-local-multiplayer-btn");
startLocalMultiplayerGame_btn.onclick = async _ => await startLocalMultiplayerGame()

/** @type {HTMLButtonElement} */
const joinMultiplayerGame_btn = document.getElementById("join-multiplayer-btn");
joinMultiplayerGame_btn.onclick = async _ => await joinMultiplayerGame()


//
// Others Logic & Components
//


/** @type {HTMLButtonElement} */
const profile_btn = document.getElementById("profile-btn");
profile_btn.onclick = async _ => window.location.href = "/profile/pages/personal-profile-page/personal-profile-page.html";


//
// Page Initialisation
//


/**
 * Enables (or disables) the view when the user is authentified
 */
function toggleAuthentifiedView(isLoggedIn) {
    signup_btn.style.display = isLoggedIn ? "none" : "inline-block";
    login_btn.style.display = isLoggedIn ? "none" : "inline-block";
    profile_btn.style.display = isLoggedIn ? "inline-block" : "none";
    logout_btn.style.display = isLoggedIn ? "inline-block" : "none";
}

onload = async _ => {
    const token = await ensureValidAccessToken();

    if (!token) {
        toggleAuthentifiedView(false);
        return;
    }

    toggleAuthentifiedView(true);

    const payload = decodeJwtPayload(token);
    const userId = payload?.sub;
    if (!userId) {
        clearAuthTokens();
        return null;
    }

    // TODO : Remove need for `userId` in the game to use `userToken` instead
    setCookie('userId', userId);
}
