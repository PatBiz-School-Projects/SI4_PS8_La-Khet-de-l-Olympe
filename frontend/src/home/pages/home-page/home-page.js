import { getCookie,setCookie, removeAllCookies } from "/utils/cookie.js";
import { decodeJwtPayload } from "/utils/jwt.js";
import {ensureValidAccessToken,clearAuthTokens,authenticatedFetch} from "/utils/auth.js";
import {getPictureUrl} from "/utils/picture.js";
import {sendChallenge} from "/utils/challenge.js";


/**
 * Navigation helpers
 */
const menuItems = document.querySelectorAll(".menu-item[data-section]");
const clickableCards = document.querySelectorAll(".feature-card.is-clickable");
const sidebarUsername = document.getElementById("sidebar-username");
const sidebarStatus = document.getElementById("sidebar-status");
const statusDot = document.querySelector(".status-dot");
const profileChipBtn = document.getElementById("profile-chip-btn");
const sidebarAvatar = document.getElementById("sidebar-avatar");
const searchMenuItem = document.querySelector('.menu-item[data-section="search"]');
const searchPanel = document.getElementById("search-panel");
const searchInput = document.getElementById("search-users-input");
const searchStatus = document.getElementById("search-status");
const searchResults = document.getElementById("search-results");
const playPanel = document.getElementById("play-panel");
const leaderboardPanel = document.getElementById("leaderboard-panel");
const leaderboardStatus = document.getElementById("leaderboard-status");
const leaderboardList = document.getElementById("leaderboard-list");
const friendsPanel = document.getElementById("friends-panel");
const friendsStatus = document.getElementById("friends-status");
const friendsOnlineList = document.getElementById("friends-online-list");
const friendsOfflineList = document.getElementById("friends-offline-list");
const friendsOnlineEmpty = document.getElementById("friends-online-empty");
const friendsOfflineEmpty = document.getElementById("friends-offline-empty");
let currentUserId;
let searchDebounceId;

function showMainPanel(section) {
    const showLeaderboard = section === "leaderboard";
    const showFriends = section === "friends";
    playPanel.hidden = showLeaderboard || showFriends;
    leaderboardPanel.hidden = !showLeaderboard;
    friendsPanel.hidden = !showFriends;
}
function setSearchStatus(message, isError = false) {
    searchStatus.textContent = message;
    searchStatus.style.color = isError ? "#ffb3b3" : "";
}
function setLeaderboardStatus(message, isError = false) {
    leaderboardStatus.textContent = message;
    leaderboardStatus.style.color = isError ? "#ffb3b3" : "";
}
function setFriendsStatus(message, isError = false) {
    friendsStatus.textContent = message;
    friendsStatus.style.color = isError ? "#ffb3b3" : "";
}
function renderLeaderboard(users) {
    leaderboardList.innerHTML = "";
    users.forEach((user, index) => {
        const item = document.createElement("li");
        item.className = "leaderboard-item";

        const rank = document.createElement("span");
        rank.className = "leaderboard-item__rank";
        rank.textContent = `#${index + 1}`;

        const avatar = document.createElement("img");
        avatar.className = "leaderboard-item__avatar";
        avatar.src = getPictureUrl(user.profilePicture);
        avatar.alt = `Avatar de ${user.username}`;

        const username = document.createElement("span");
        username.className = "leaderboard-item__username";
        username.textContent = user.username;

        const elo = document.createElement("span");
        elo.className = "leaderboard-item__elo";
        elo.textContent = `${user.elo} ELO`;

        item.append(rank, avatar, username, elo);
        leaderboardList.appendChild(item);
    });
}

async function loadLeaderboard(limit = 10) {
    setLeaderboardStatus("Chargement du panthéon...");
    leaderboardList.innerHTML = "";

    try {
        const response = await fetch(`/api/users/leaderboard?limit=${encodeURIComponent(limit)}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        const payload = await response.json();

        if (!response.ok) {
            setLeaderboardStatus(payload.error || "Impossible de charger le leaderboard.", true);
            return;
        }
        renderLeaderboard(payload);
    } catch (error) {
        console.error("Unable to load leaderboard", error);
        setLeaderboardStatus("Erreur réseau pendant le chargement du leaderboard.", true);
    }
}

async function sendFriendRequest(targetUserId, button) {
    button.disabled = true;

    const response = await authenticatedFetch("/api/users/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
    });

    if (!response) {
        setSearchStatus("Session expirée. Veuillez vous reconnecter.", true);
        button.disabled = false;
        return;
    }

    const payload = await response.json();
    if (!response.ok) {
        setSearchStatus(payload.error || "Impossible d'envoyer la demande d'ami.", true);
        button.disabled = false;
        return;
    }

    button.textContent = "Demande envoyée";
    setSearchStatus("Demande d'ami envoyée.", false);
}

async function challengeUser(targetUserId) {
    const result = await sendChallenge(targetUserId);
    if (!result.ok) {
        setSearchStatus(result.payload?.error || "Impossible d'envoyer le défi.", true);
        return;
    }

    setSearchStatus("Défi envoyé avec succès.", false);
}

function renderFriendsList(targetElement, friends, canChallenge) {
    targetElement.innerHTML = "";

    friends.forEach((friend) => {
        const item = document.createElement("li");
        item.className = "leaderboard-item friend-item";

        const avatar = document.createElement("img");
        avatar.className = "leaderboard-item__avatar";
        avatar.src = getPictureUrl(friend.profilePicture);
        avatar.alt = `Avatar de ${friend.username}`;

        const username = document.createElement("span");
        username.className = "leaderboard-item__username";
        username.textContent = friend.username;

        const elo = document.createElement("span");
        elo.className = "leaderboard-item__elo";
        elo.textContent = `${friend.elo} ELO`;

        item.append(avatar, username, elo);

        if (canChallenge) {
            const challengeButton = document.createElement("button");
            challengeButton.type = "button";
            challengeButton.className = "search-action-btn friend-challenge-btn";
            challengeButton.textContent = "Défier";
            challengeButton.onclick = async () => {
                challengeButton.disabled = true;
                await challengeUser(friend.id);
                challengeButton.disabled = false;
            };
            item.append(challengeButton);
        }

        targetElement.appendChild(item);
    });
}

async function loadFriendsPanel() {
    setFriendsStatus("Chargement de vos amis...");
    friendsOnlineList.innerHTML = "";
    friendsOfflineList.innerHTML = "";
    friendsOnlineEmpty.hidden = true;
    friendsOfflineEmpty.hidden = true;

    const friendsResponse = await authenticatedFetch("/api/users/friends", {
        method: "GET",
        headers: {"Content-Type": "application/json"},
    });

    if (!friendsResponse) {
        setFriendsStatus("Session expirée. Veuillez vous reconnecter.", true);
        return;
    }
    const connectedResponse = await fetch("/api/users/connected", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    const friendsPayload = await friendsResponse.json();
    const connectedPayload = connectedResponse.ok
        ? await connectedResponse.json()
        : { users: [] };

    if (!friendsResponse.ok) {
        setFriendsStatus(friendsPayload.error || "Impossible de charger vos amis.", true);
        return;
    }

    const friends = friendsPayload.friends || [];
    const connectedIds = new Set((connectedPayload.users || []).map((user) => user.id));

    const onlineFriends = friends.filter((friend) => connectedIds.has(friend.id));
    const offlineFriends = friends.filter((friend) => !connectedIds.has(friend.id));

    renderFriendsList(friendsOnlineList, onlineFriends, true);
    renderFriendsList(friendsOfflineList, offlineFriends, false);

    friendsOnlineEmpty.hidden = onlineFriends.length !== 0;
    friendsOfflineEmpty.hidden = offlineFriends.length !== 0;

    setFriendsStatus(
        `${onlineFriends.length} ami(s) en ligne • ${offlineFriends.length} hors ligne.`
    );
}
function renderSearchResults(users) {
    searchResults.innerHTML = "";

    users.forEach((user) => {
        const item = document.createElement("article");
        item.className = "search-result-item";

        const avatar = document.createElement("img");
        avatar.className = "search-result-item__avatar";
        avatar.src = getPictureUrl(user.profilePicture);
        avatar.alt = `Avatar de ${user.username}`;

        const name = document.createElement("p");
        name.className = "search-result-item__name";
        name.textContent = user.username;

        const actions = document.createElement("div");
        actions.className = "search-result-item__actions";

        const addFriendButton = document.createElement("button");
        addFriendButton.type = "button";
        addFriendButton.className = "search-action-btn";
        addFriendButton.textContent = "Ajouter en ami";
        addFriendButton.onclick = async () => sendFriendRequest(user.userId, addFriendButton);

        const challengeButton = document.createElement("button");
        challengeButton.textContent = "⚔";
        challengeButton.onclick = async () => challengeUser(user.userId);

        actions.append(addFriendButton, challengeButton);
        item.append(avatar, name, actions);
        searchResults.appendChild(item);
    });
}

async function runUserSearch(rawQuery) {
    const query = rawQuery.trim();

    if (query.length < 2) {
        searchResults.innerHTML = "";
        setSearchStatus("Tapez au moins 2 caractères.");
        return;
    }

    setSearchStatus("Recherche en cours...");

    const response = await authenticatedFetch(`/api/users?query=${encodeURIComponent(query)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!response) {
        setSearchStatus("Session expirée. Veuillez vous reconnecter.", true);
        return;
    }

    const payload = await response.json();
    const users = payload.filter((user) => user.userId!==currentUserId);
    if (!users.length) {
        searchResults.innerHTML = "";
        setSearchStatus("Aucun joueur trouvé.");
        return;
    }

    setSearchStatus(`${users.length} joueur(s) trouvé(s).`);
    renderSearchResults(users);
}

function setActiveMenu(section) {
    menuItems.forEach((item) => item.classList.toggle("is-active", item.dataset.section === section));
}

menuItems.forEach((item) => {
    item.addEventListener("click", async () => {
        setActiveMenu(item.dataset.section);
        showMainPanel(item.dataset.section);

        if (item.dataset.section === "leaderboard") {
            await loadLeaderboard(10);
            return;
        }
        if (item.dataset.section === "friends") {
            await loadFriendsPanel();
            console.log("friends")
            return;
        }
        if (item.dataset.section === "search") {
            searchPanel.classList.toggle('visible');
            searchPanel.scrollIntoView({behavior: "smooth", block: "start"});
            searchInput.focus();
        }
    });
});

clickableCards.forEach((card) => {
    card.addEventListener("click", () => {
        const action = card.dataset.action;
        if (action === "ranked") {
            joinMultiplayerGame().catch((error) => {
                console.error("Unable to start ranked match", error);
            });
            return;
        }

        if (action === "daily" || action === "academy") {
            modal.style.display = "flex";
        }
    });
});

searchInput.addEventListener("input", async (event) => {
    clearTimeout(searchDebounceId);
    await runUserSearch(event.target.value);
});

searchMenuItem.addEventListener("click", () => {
    setSearchStatus("Tapez au moins 2 caractères.");
});

/**
 * Auth logic
 */
async function signup() {
    window.location.href = "/home/auth/pages/signup/signup.html";
}

async function login() {
    window.location.href = "/home/auth/pages/login/login.html";
}

async function logout() {
    try {
        const token = await ensureValidAccessToken();
        await fetch("/api/auth/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
    } catch (error) {
        console.error("Logout request failed", error);
    } finally {
        clearAuthTokens();
        removeAllCookies();
        window.location.href = "/home/auth/pages/login/login.html";
    }
}

const signupBtn = document.getElementById("signup-btn");
signupBtn.onclick = async () => signup();

const loginBtn = document.getElementById("login-btn");
loginBtn.onclick = async () => login();

const logoutBtn = document.getElementById("logout-btn");
logoutBtn.onclick = async () => logout();

/**
 * Game join logic
 */
async function newPlayer() {
    const res = await fetch("/api/game-service/new-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
    });

    if (!res.ok) {
        throw new Error("Unable to create player");
    }

    const { playerId } = await res.json();
    return playerId;
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

    const res = await fetch("/api/game-service/start-solo-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, difficulty }),
    });

    if (!res.ok) {
        throw new Error("Unable to start solo game");
    }

    const { gameId } = await res.json();
    setCookie("gameId", gameId);
    window.location.href = "/waiting-room/pages/waiting-room-page/waiting-room-page.html";
}

async function startLocalMultiplayerGame() {
    const playerId1 = await newPlayer();
    const playerId2 = await newPlayer();

    const res = await fetch("/api/game-service/start-local-multiplayer-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId1, playerId2 }),
    });

    if (!res.ok) {
        throw new Error("Unable to start local multiplayer game");
    }

    const { gameId } = await res.json();
    setCookie("gameId", gameId);
    window.location.href = "/waiting-room/pages/waiting-room-page/waiting-room-page.html";
}

async function joinMultiplayerGame() {
    const playerId = await newPlayer();

    const res = await fetch("/api/game-service/join-multiplayer-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
    });

    if (!res.ok) {
        throw new Error("Unable to join multiplayer game");
    }

    const { gameId } = await res.json();
    setCookie("gameId", gameId);
    window.location.href = "/waiting-room/pages/waiting-room-page/waiting-room-page.html";
}

const startSoloGameBtn = document.getElementById("start-solo-btn");
startSoloGameBtn.onclick = () => {
    modal.style.display = "flex";
};

const startLocalMultiplayerBtn = document.getElementById("start-local-multiplayer-btn");
startLocalMultiplayerBtn.onclick = async () => startLocalMultiplayerGame();

const joinMultiplayerBtn = document.getElementById("join-multiplayer-btn");
joinMultiplayerBtn.onclick = async () => joinMultiplayerGame();

const profileBtn = document.getElementById("profile-btn");
profileBtn.onclick = async () => {
    window.location.href = "/profile/pages/personal-profile-page/personal-profile-page.html";
};

profileChipBtn.onclick = async () => {
    window.location.href = "/profile/pages/personal-profile-page/personal-profile-page.html";
};

function toggleAuthenticatedView(isLoggedIn) {
    signupBtn.style.display = isLoggedIn ? "none" : "flex";
    loginBtn.style.display = isLoggedIn ? "none" : "flex";
    profileBtn.style.display = isLoggedIn ? "flex" : "none";
    logoutBtn.style.display = isLoggedIn ? "flex" : "none";

    sidebarStatus.textContent = isLoggedIn ? "En ligne" : "Hors ligne";
    statusDot.classList.toggle("status-dot--online", isLoggedIn);
    statusDot.classList.toggle("status-dot--offline", !isLoggedIn);
    if (!isLoggedIn) {
        searchInput.disabled = true;
        setSearchStatus("Connectez-vous pour rechercher des joueurs.");
    } else {
        searchInput.disabled = false;
    }
}

function applySidebarIdentity(username,profilePicture){
    sidebarUsername.textContent = username;
    sidebarAvatar.src = profilePicture;
}
async function loadSidebarProfile(){
    const response = await authenticatedFetch("/api/users/profile",{
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    const profile = await response.json();
    applySidebarIdentity(profile.username, profile.profilePicture);
}

window.onload = async () => {
    showMainPanel("play");
    const token = await ensureValidAccessToken();

    if (!token) {
        toggleAuthenticatedView(false);
        return;
    }

    toggleAuthenticatedView(true);
    const payload = decodeJwtPayload(token);
    const userId = payload?.sub;
    currentUserId = userId;

    if (!userId) {
        clearAuthTokens();
        return;
    }

    await loadSidebarProfile();
    setSearchStatus("Tapez au moins 2 caractères.");

    // TODO: remove `userId` dependency in the game and use user token directly.
    setCookie("userId", userId);
};
