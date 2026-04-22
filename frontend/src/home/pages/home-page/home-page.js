import { io } from "https://cdn.socket.io/4.8.3/socket.io.esm.min.js";

import { AppModal } from "/shared/components/index.js";
import { HomeMobileNavbar,FriendsComponent,LeaderboardComponent,SearchComponent } from "/home/components/index.js";
import { ChatBox,ChatMobileComponent } from "/chat/components/index.js";

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

import { apiFetch } from "/utils/wrapFetch.js";

import { API_HOST,IS_MOBILE_WEBVIEW } from "/env.js";


/**
 * Navigation helpers
 */
const mobileNavbar = document.querySelector("home-mobile-navbar");
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
const playPanel = document.getElementById("play-panel");
const mobileHomePanel = document.getElementById("mobile-home-panel");
const leaderboardPanel = document.getElementById("leaderboard-panel");
const friendsMenuSelector = document.querySelector('.menu-item[data-section="friends"]')
const friendsPanel = document.getElementById("friends-panel");
const mobileChatPanel = document.getElementById("mobile-chat-panel");
const desktopChatBox = document.getElementById("desktop-chat-box");
const mobileChatBox = document.getElementById("mobile-chat-box");
const mobileHeader = document.getElementById("mobile-header");
const mobileProfileAvatar = document.getElementById("mobile-profile-avatar");
const mobileProfileBtn = document.getElementById("mobile-profile-btn");
const mobileSearchBtn = document.getElementById("mobile-search-btn");
const homeNotifications = document.getElementById("home-notifications");
/** @type {ChatBox} */
const chatBox = desktopChatBox;

let USER_ID;
let searchDebounceId;
const isMobileLayout = !IS_MOBILE_WEBVIEW;
let mobileChatComponent = null;

const searchComponent = new SearchComponent({
    inputElement: document.getElementById("search-users-input"),
    statusElement: document.getElementById("search-status"),
    resultsElement: document.getElementById("search-results"),
    getCurrentUserId: () => USER_ID,
});

const leaderboardComponent = new LeaderboardComponent({
    statusElement: document.getElementById("leaderboard-status"),
    listElement: document.getElementById("leaderboard-list"),
});

const friendsComponent = new FriendsComponent({
    statusElement: document.getElementById("friends-status"),
    onlineListElement: document.getElementById("friends-online-list"),
    offlineListElement: document.getElementById("friends-offline-list"),
    onlineEmptyElement: document.getElementById("friends-online-empty"),
    offlineEmptyElement: document.getElementById("friends-offline-empty"),
});

/**
 * Sidebar functions
 */
function showMainPanel(section) {
    if (isMobileLayout) {
        playPanel.hidden = true;
        mobileHomePanel.hidden = section !== "play";
        leaderboardPanel.hidden = section !== "leaderboard";
        friendsPanel.hidden = section !== "friends";
        mobileChatPanel.hidden = section !== "chat";
        return;
    }

    const showLeaderboard = section === "leaderboard";
    const showFriends = section === "friends";
    playPanel.hidden = showLeaderboard || showFriends;
    leaderboardPanel.hidden = !showLeaderboard;
    friendsPanel.hidden = !showFriends;
    mobileHomePanel.hidden = true;
    mobileChatPanel.hidden = true;
}

function setActiveMenu(section) {
    //menuItems.forEach((item) => item.classList.toggle("is-active", item.dataset.section === section));

    const allNavButtons = document.querySelectorAll("[data-section]");

    allNavButtons.forEach((item) => {
        item.classList.toggle("is-active", item.dataset.section === section);
        item.classList.toggle("active", item.dataset.section === section);
    });
}

async function handleSectionSelection(section) {
    setActiveMenu(section);
    showMainPanel(section);

    if (section === "leaderboard") {
        await leaderboardComponent.load(10);
        return;
    }

    if (section === "friends") {
        await friendsComponent.load();
        return;
    }

    if (section === "search") {
        if (isMobileLayout) {
            window.location.href = "/home/pages/mobile-search-page/mobile-search-page.html";
            return;
        }
        searchPanel.classList.toggle('visible');
        searchPanel.scrollIntoView({behavior: "smooth", block: "start"});
        searchInput.focus();
    }
}

document.addEventListener("click", async (event) => {

    const button = event.target.closest("[data-section]");
    if(button) {
        await handleSectionSelection(button.dataset.section);
    }

});

mobileNavbar?.addEventListener("mobile-nav-select", async (event) => {
    const { section } = event.detail || {};
    if (section) {
        await handleSectionSelection(section);
    }
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

searchMenuItem.addEventListener("click", () => {
    searchComponent.setStatus("Tapez au moins 2 caractères.");
});

const profileBtn = document.getElementById("profile-btn");
profileBtn.onclick = async () => {
    window.location.href = "/profile/pages/personal-profile-page/personal-profile-page.html";
};

mobileProfileBtn.onclick = async () => {
    window.location.href = "/profile/pages/personal-profile-page/personal-profile-page.html";
};

mobileSearchBtn.onclick = async () => {
    window.location.href = "/home/pages/mobile-search-page/mobile-search-page.html";
};

profileChipBtn.onclick = async () => {
    window.location.href = "/profile/pages/personal-profile-page/personal-profile-page.html";
};

function applySidebarIdentity(username, profilePicture) {
    sidebarUsername.textContent = username;
    sidebarAvatar.src = profilePicture;
    mobileProfileAvatar.src = profilePicture;
    mobileProfileAvatar.alt = `Avatar de ${username}`;
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
        await apiFetch("/api/auth/logout", {
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
    const res = await apiFetch("/api/games/new-player", {
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

    const res = await apiFetch("/api/games/start-solo-game", {
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

    const res = await apiFetch("/api/games/start-local-multiplayer-game", {
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

    const res = await apiFetch("/api/games/join-multiplayer-game", {
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

document.getElementById("mobile-start-solo-btn").onclick = () => difficultyModal.show();

const startLocalMultiplayerBtn = document.getElementById("start-local-multiplayer-btn");
startLocalMultiplayerBtn.onclick = async () => startLocalMultiplayerGame();
document.getElementById("mobile-start-local-multiplayer-btn").onclick = async () => startLocalMultiplayerGame();

const joinMultiplayerBtn = document.getElementById("join-multiplayer-btn");
joinMultiplayerBtn.onclick = async () => joinMultiplayerGame();
document.getElementById("mobile-join-multiplayer-btn").onclick = async () => joinMultiplayerGame();

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
    searchComponent.setEnabled(isLoggedIn);
}

async function toggleMobileView(isMobileView,isLoggedIn) {
    mobileHeader.hidden = !isMobileView || !isLoggedIn;
    mobileNavbar.hidden = !isMobileView;
}

/**
 Global chatbox functions
 */
async function toggleChatBox(isLoggedIn) {
    // Initialising chat box
    if (isLoggedIn) {
        const chatSocket = io(API_HOST+"/global-chat", {
            path: "/api/chats/socket.io",
        });

        chatBox.chatId = "global-chat";
        await chatBox.actualise();

        chatSocket.on("new-message", async ({message}) => {
            // DEBUG::
            console.log(`Received message on global chat from "${message.author}":\n${message.content}`);

            await chatBox.onNewMessage(message);
        });

        chatSocket.on("new-user", async ({user}) => {
            // DEBUG::
            console.log(`New user joined of id '${user.userId}' joined global chat`);

            await chatBox.onNewUser(user);
        })

        chatSocket.on("update-user", async ({userId, update}) => {
            // DEBUG::
            console.log(`User of id '${userId}' has been updated`);

            await chatBox.onUserUpdate(userId, update);
        });

        chatBox.addEventListener("send-message", async event => {
            const content = event.detail.content;

            // DEBUG::
            console.log(`Sending message to in-game chat:\n${content}`);

            const newMessage = {
                author: USER_ID,
                content,
                uploadTimestamp: Date.now(),
            }

            chatSocket.emit("new-message", { message: newMessage });
        });
    } else {
        chatBox.remove();
    }
}

function applyResponsiveLayout() {
    mobileHeader.hidden = !isMobileLayout || !USER_ID;
    document.body.classList.toggle("is-mobile-layout", isMobileLayout);
    showMainPanel("play");
}

async function toggleMobileChat(isLoggedIn) {
    if (!isLoggedIn || !mobileChatBox) {
        mobileChatComponent?.disconnect();
        mobileChatComponent = null;
        return;
    }

    if (!mobileChatComponent) {
        mobileChatComponent = new ChatMobileComponent(mobileChatBox, USER_ID);
    }
    await mobileChatComponent.connect();
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
                            friendsComponent.setStatus('Session expirée. Veuillez vous reconnecter.');
                            return;
                        }
                        const payload = await response.json();

                        if (!response.ok) {
                            friendsComponent.setStatus(payload.error || 'Impossible d’accepter cette demande.');
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
    applyResponsiveLayout();
    window.addEventListener("resize", applyResponsiveLayout);
    searchComponent.bindInput();
    showMainPanel("play");
    const token = await ensureValidAccessToken();

    if (!token) {
        await toggleAuthenticatedView(false);
        await toggleChatBox(false);
        await toggleMobileChat(false);
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
    await toggleMobileView(isMobileLayout,true);
    await toggleChatBox(true);
    await toggleMobileChat(true);
    await initHomeNotifications();
    await loadSidebarProfile();
    searchComponent.setStatus("Tapez au moins 2 caractères.");
};
