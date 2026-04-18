import { io } from "https://cdn.socket.io/4.8.3/socket.io.esm.min.js";

import { ChatBox } from "/chat/components/index.js";
import { AppModal } from "/shared/components/index.js";

import { getCookie, setCookie, removeAllCookies } from "/utils/cookie.js";
import { decodeJwtPayload } from "/utils/jwt.js";
import { ensureValidAccessToken, clearAuthTokens, authenticatedFetch } from "/utils/auth.js";
import { getPictureUrl } from "/utils/picture.js";
import {
    acceptChallenge,
    createChallengeSocket,
    declineChallenge,
    listIncomingChallenges,
    sendChallenge
} from "/utils/challenge.js";


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
const friendsMenuSelector = document.querySelector('.menu-item[data-section="friends"]')
const friendsPanel = document.getElementById("friends-panel");
const friendsStatus = document.getElementById("friends-status");
const friendsOnlineList = document.getElementById("friends-online-list");
const friendsOfflineList = document.getElementById("friends-offline-list");
const friendsOnlineEmpty = document.getElementById("friends-online-empty");
const friendsOfflineEmpty = document.getElementById("friends-offline-empty");
const homeNotifications = document.getElementById("home-notifications");
/** @type {ChatBox} */
const chatBox = document.querySelector("chat-box");

let USER_ID;
let searchDebounceId;

/**
 * Sidebar functions
 */
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

        actions.append(addFriendButton);
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
    const users = payload.filter((user) => user.userId!==USER_ID);
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

clickableCards.forEach(card => {
    card.addEventListener("click", () => {
        const action = card.dataset.action;
        if (action === "ranked") {
            joinMultiplayerGame().catch((error) => {
                console.error("Unable to start ranked match", error);
            });
            return;
        }
    })
});

searchInput.addEventListener("input", async (event) => {
    clearTimeout(searchDebounceId);
    await runUserSearch(event.target.value);
});

searchMenuItem.addEventListener("click", () => {
    setSearchStatus("Tapez au moins 2 caractères.");
});

const profileBtn = document.getElementById("profile-btn");
profileBtn.onclick = async () => {
    window.location.href = "/profile/pages/personal-profile-page/personal-profile-page.html";
};

profileChipBtn.onclick = async () => {
    window.location.href = "/profile/pages/personal-profile-page/personal-profile-page.html";
};

function applySidebarIdentity(username, profilePicture) {
    sidebarUsername.textContent = username;
    sidebarAvatar.src = profilePicture;
}
async function loadSidebarProfile() {
    const response = await authenticatedFetch(`/api/users/${USER_ID}/minimal-profile`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    const profile = await response.json();
    const newPicture = getPictureUrl(profile.profilePicture)
    applySidebarIdentity(profile.username, newPicture);
}

/**
 * Auth logic
 */
async function signup() {
    window.location.href = "/auth/pages/signup/signup.html";
}

async function login() {
    window.location.href = "/auth/pages/login/login.html";
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
        window.location.reload();
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
    const res = await fetch("/api/games/new-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({/* nothing */}),
    });

    if (!res.ok) {
        throw new Error("Unable to create player");
    }

    const { playerId } = await res.json();
    return playerId;
}

/** @type {AppModal} */
const difficultyModal = document.querySelector("#difficulty-modal");

const btnEasy = document.querySelector("#btn-easy");
const btnHard = document.querySelector("#btn-hard");

btnEasy.onclick = async () => {
    await startSoloGame("easy");
};

btnHard.onclick = async () => {
    await startSoloGame("hard");
};

async function startSoloGame(difficulty) {
    const playerId = await newPlayer();

    const res = await fetch("/api/games/start-solo-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, difficulty }),
    });

    if (!res.ok) {
        throw new Error("Unable to start solo game");
    }

    const { gameId } = await res.json();
    localStorage.setItem("gameId", gameId);
    window.location.href = "/waiting-room/pages/waiting-room-page/waiting-room-page.html";
}

async function startLocalMultiplayerGame() {
    const playerId1 = await newPlayer();
    const playerId2 = await newPlayer();

    const res = await fetch("/api/games/start-local-multiplayer-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId1, playerId2 }),
    });

    if (!res.ok) {
        throw new Error("Unable to start local multiplayer game");
    }

    const { gameId } = await res.json();
    localStorage.setItem("gameId", gameId);
    window.location.href = "/waiting-room/pages/waiting-room-page/waiting-room-page.html";
}

async function joinMultiplayerGame() {
    const playerId = await newPlayer();

    const res = await fetch("/api/games/join-multiplayer-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
    });

    if (!res.ok) {
        throw new Error("Unable to join multiplayer game");
    }

    const { gameId } = await res.json();
    localStorage.setItem("gameId", gameId);
    window.location.href = "/waiting-room/pages/waiting-room-page/waiting-room-page.html";
}

const startSoloGameBtn = document.getElementById("start-solo-btn");
startSoloGameBtn.onclick = () => {
    difficultyModal.show();
};

const startLocalMultiplayerBtn = document.getElementById("start-local-multiplayer-btn");
startLocalMultiplayerBtn.onclick = async () => startLocalMultiplayerGame();

const joinMultiplayerBtn = document.getElementById("join-multiplayer-btn");
joinMultiplayerBtn.onclick = async () => joinMultiplayerGame();

/**
 Authenticated view
 */

async function toggleAuthenticatedView(isLoggedIn) {
    signupBtn.style.display = isLoggedIn ? "none" : "flex";
    loginBtn.style.display = isLoggedIn ? "none" : "flex";
    profileBtn.style.display = isLoggedIn ? "flex" : "none";
    logoutBtn.style.display = isLoggedIn ? "flex" : "none";
    sidebarAvatar.style.display = isLoggedIn ? "flex" : "none";
    joinMultiplayerBtn.style.display = isLoggedIn ? "flex" : "none";
    sidebarStatus.textContent = isLoggedIn ? "En ligne" : "Hors ligne";
    friendsMenuSelector.style.display = isLoggedIn ? "flex" : "none";
    statusDot.classList.toggle("status-dot--online", isLoggedIn);
    statusDot.classList.toggle("status-dot--offline", !isLoggedIn);
    if (!isLoggedIn) {
        searchInput.disabled = true;
        setSearchStatus("Connectez-vous pour rechercher des joueurs.");
    } else {
        searchInput.disabled = false;
    }
}

/**
 Global chatbox functions
 */
async function toggleChatBox(isLoggedIn) {
    // Initialising chat box
    if (isLoggedIn) {
        const chatSocket = io("/global-chat", {
            path: "/api/chats/socket.io",
            query: {
                chatId: "0", // TODO : Manage it in the server
            },
        });

        chatBox.chatId = "0";
        await chatBox.actualise();

        chatSocket.on("new-message", ({message}) => {
            // DEBUG::
            console.log(`Sending message on in-game chat from "${message.author.username}":\n${message.content}`);

            chatBox.onNewMessage(message);
        });

        chatBox.addEventListener("send-message", async event => {
            const content = event.detail.content;

            // DEBUG::
            console.log(`Sending message to in-game chat:\n${content}`);

            let user;
            try {
                const response = await fetch(`/api/users/${USER_ID}/minimal-profile`);

                if (!response.ok) {
                    throw new Error(response.error);
                }

                user = await response.json();
            } catch (err) {
                console.error("Error in home page:", err);
            }

            const newMessage = {
                author: {
                    userId: USER_ID,
                    username: user.username,
                    profilePicture: user.profilePicture
                },
                content,
                uploadTimestamp: Date.now(),
            }

            chatSocket.emit("new-message", { message: newMessage });
        });
    } else {
        chatBox.remove();
    }
}

/**
 * Notifications
 */
let challengeSocket;
let challengePollingId;
let friendRequestsPollingId;
const FRIEND_REQUESTS_REFRESH_MS = 10000;
const CHALLENGES_REFRESH_MS = 10000;
const NOTIFICATION_AUTO_CLOSE_MS = 12000;
const CONSUMED_HOME_NOTIFICATIONS_KEY = "home.notifications.consumed";
const profileNameCache = new Map();

function readConsumedNotifications() {
    try {
        return JSON.parse(localStorage.getItem(CONSUMED_HOME_NOTIFICATIONS_KEY) || "[]");
    } catch {
        return [];
    }
}

function markNotificationAsConsumed(key) {
    const consumed = new Set(readConsumedNotifications());
    consumed.add(key);
    localStorage.setItem(CONSUMED_HOME_NOTIFICATIONS_KEY, JSON.stringify(Array.from(consumed).slice(-200)));
}

function hasBeenConsumed(key) {
    return readConsumedNotifications().includes(key);
}

function updateChatBoxOffset() {
    if (!homeNotifications || !chatBox) {
        return;
    }
    const offset = homeNotifications.childElementCount === 0
        ? 0
        : homeNotifications.getBoundingClientRect().height + 12;

    chatBox.style.setProperty("--chatbox-offset", `${Math.ceil(offset)}px`);
}

function showHomeNotification({ key, title, text, actions=[] }) {
    if (!homeNotifications || hasBeenConsumed(key)) {
        return;
    }

    markNotificationAsConsumed(key);

    const notification = document.createElement("article");
    notification.className = "home-notification";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "home-notification__close";
    closeButton.textContent = "×";

    const titleElement = document.createElement("p");
    titleElement.className = "home-notification__title";
    titleElement.textContent = title;

    const textElement = document.createElement("p");
    textElement.className = "home-notification__text";
    textElement.textContent = text;
    const actionsWrapper = document.createElement("div");
    actionsWrapper.className = "home-notification__actions";

    actions.forEach((action) => {
        const actionButton = document.createElement("button");
        actionButton.type = "button";
        actionButton.className = `home-notification__action-btn ${action.className || ""}`.trim();
        actionButton.textContent = action.label;

        actionButton.onclick = async () => {
            actionButton.disabled = true;
            try {
                await action.onClick();
                notification.remove();
                updateChatBoxOffset();
            } finally {
                actionButton.disabled = false;
            }
        };

        actionsWrapper.append(actionButton);
    });

    closeButton.onclick = () => {
        notification.remove();
        updateChatBoxOffset();
    };
    if (actions.length === 0) {
        actionsWrapper.hidden = true;
    }

    notification.append(closeButton, titleElement, textElement, actionsWrapper);
    homeNotifications.prepend(notification);
    updateChatBoxOffset();

    setTimeout(() => {
        if (!notification.isConnected) {
            return;
        }
        notification.remove();
        updateChatBoxOffset();
    }, NOTIFICATION_AUTO_CLOSE_MS);
}

async function refreshFriendRequestNotifications() {
    const response = await authenticatedFetch("/api/users/friends/requests", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!response || !response.ok) {
        return;
    }

    const payload = await response.json();
    for (const request of payload.requests || []) {
        const notificationKey = `friend-request:${request.id}`;
        showHomeNotification({
            key: notificationKey,
            title: "Demande d'ami",
            text: `${request.requester?.username || "Un joueur"} vous a envoyé une demande d'ami.`,
            actions: [
                {
                    label: "Refuser",
                    className: "danger",
                    onClick: async () => {
                        const declineResponse = await authenticatedFetch("/api/users/friends/request", {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId: request.requester?.id }),
                        });

                        if (!declineResponse) {
                            throw new Error("SESSION_EXPIRED");
                        }

                        if (!declineResponse.ok) {
                            const declinePayload = await declineResponse.json();
                            throw new Error(declinePayload.error || "UNABLE_TO_DECLINE_REQUEST");
                        }
                    },
                },
                {
                    label: "Accepter",
                    onClick: async () => {
                        const response = await authenticatedFetch('/api/users/friends/accept', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({requestUserId: request.requester?.id})
                        });
                        if (!response) {
                            setStatus('Session expirée. Veuillez vous reconnecter.');
                            return;
                        }
                        const payload = await response.json();

                        if (!response.ok) {
                            setStatus(payload.error || 'Impossible d’accepter cette demande.');
                        }
                    },
                }
            ]
        });
    }
}

async function getUsernameFromUserId(userId) {
    if (!userId) {
        return "Un joueur";
    }

    if (profileNameCache.has(userId)) {
        return profileNameCache.get(userId);
    }

    const response = await authenticatedFetch(`/api/users/${encodeURIComponent(userId)}/minimal-profile`, {
        method: "GET",
        headers: {"Content-Type": "application/json"},
    });

    if (!response || !response.ok) {
        return "Un joueur";
    }

    const payload = await response.json();
    const username = payload?.username || "Un joueur";
    profileNameCache.set(userId, username);
    return username;
}

async function showIncomingChallengeNotification(challenge) {
    const challengerName = await getUsernameFromUserId(challenge.challengerUserId);
    const notificationKey = `challenge-incoming:${challenge.id}`;

    showHomeNotification({
        key: notificationKey,
        title: "Défi reçu",
        text: `${challengerName} vous a défié.`,
        actions: [
            {
                label: "Refuser",
                className: "danger",
                onClick: async () => {
                    const result = await declineChallenge(challenge.id);
                    if (!result.ok) {
                        throw new Error(result.payload?.error || "UNABLE_TO_DECLINE_CHALLENGE");
                    }
                }
            },
            {
                label: "Accepter",
                onClick: async () => {
                    const result = await acceptChallenge(challenge.id);
                    if (!result.ok) {
                        throw new Error(result.payload?.error || "UNABLE_TO_ACCEPT_CHALLENGE");
                    }
                }
            }
        ]
    });
}

async function refreshChallengeNotifications() {
    const result = await listIncomingChallenges();
    if (!result.ok) {
        return;
    }

    for (const challenge of result.payload?.challenges || []) {
        await showIncomingChallengeNotification(challenge);
    }
}

async function initHomeNotifications() {
    await refreshFriendRequestNotifications();
    await refreshChallengeNotifications();

    challengeSocket?.disconnect();
    challengeSocket = createChallengeSocket();
    challengeSocket.on("challenge:incoming", ({ challenge }) => {
        if (!challenge) {
            return;
        }
        showIncomingChallengeNotification(challenge).catch((error) => {
            console.error("Unable to show challenge notification", error);
        });
    });

    if (friendRequestsPollingId) {
        clearInterval(friendRequestsPollingId);
    }
    if (challengePollingId) {
        clearInterval(challengePollingId);
    }
    challengePollingId = setInterval(() => {
        refreshChallengeNotifications().catch((error) => {
            console.error("Unable to refresh challenge notifications", error);
        });
    }, CHALLENGES_REFRESH_MS);
    friendRequestsPollingId = setInterval(() => {
        refreshFriendRequestNotifications().catch((error) => {
            console.error("Unable to refresh friend request notifications", error);
        });
    }, FRIEND_REQUESTS_REFRESH_MS);
}

window.addEventListener("beforeunload", () => {
    if (friendRequestsPollingId) {
        clearInterval(friendRequestsPollingId);
    }
    if (challengePollingId) {
        clearInterval(challengePollingId);
    }
    challengeSocket?.disconnect();
});
/**
 onLoad function
 */
onload = async () => {
    showMainPanel("play");
    const token = await ensureValidAccessToken();

    if (!token) {
        await toggleAuthenticatedView(false);
        await toggleChatBox(false);
        return;
    }

    const payload = decodeJwtPayload(token);
    const userId = payload?.sub;
    if (!userId) {
        clearAuthTokens();
        return;
    }

    USER_ID = userId;

    await toggleAuthenticatedView(true);
    await toggleChatBox(true);
    await initHomeNotifications();
    await loadSidebarProfile();
    setSearchStatus("Tapez au moins 2 caractères.");
};
