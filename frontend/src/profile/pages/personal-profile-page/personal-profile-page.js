import { authenticatedFetch, ensureValidAccessToken,getUserIdFromToken } from '/utils/auth.js';
import { setCookie} from "/utils/cookie.js";
import {
    sendChallenge,
    listIncomingChallenges,
    acceptChallenge,
    declineChallenge,
    createChallengeSocket,
} from '/utils/challenge.js';
const usernameEl = document.getElementById('profile-username');
const eloEl = document.getElementById('profile-elo');
const pictureEl = document.getElementById('profile-picture');
const statusEl = document.getElementById('profile-status');
const winRateEl = document.getElementById('profile-winRate');
const totalGamesEl = document.getElementById('profile-total-games');
const totalWinsEl = document.getElementById('profile-total-wins');
const totalLossesEl = document.getElementById('profile-total-losses');
const winStreakEl = document.getElementById('profile-win-streak');
const friendsListEl = document.getElementById('friends-list');
const friendsEmptyEl = document.getElementById('friends-empty');
const requestsListEl = document.getElementById('requests-list');
const requestsEmptyEl = document.getElementById('requests-empty');
const incomingChallengesListEl = document.getElementById('incoming-challenges-list');
const incomingChallengesEmptyEl = document.getElementById('incoming-challenges-empty');
const achievementsGrid = document.getElementById('achievements-grid');
const historyListEl = document.getElementById('history-list');
const historyEmptyEl = document.getElementById('history-empty');

let challengeSocket = null;


const openAvatarModal = () => document.getElementById('avatar-modal')?.classList.remove('hidden');
const closeAvatarModal = () => document.getElementById('avatar-modal')?.classList.add('hidden');

async function handleAvatarSelection(event) {
    const newPicture = event.target.getAttribute('src');

    pictureEl.src = newPicture;
    closeAvatarModal();

    const token = await ensureValidAccessToken();
    const userId = getUserIdFromToken(token);

    if (!userId) {
        setStatus('Erreur : Impossible de récupérer ton identifiant.');
        return;
    }

    await syncProfilePicture(userId, newPicture);
}

function bindAvatarModalEvents() {
    const avatarModal = document.getElementById('avatar-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const avatarOptions = document.querySelectorAll('.avatar-option');

    if (!pictureEl || !avatarModal) return;

    pictureEl.addEventListener('click', openAvatarModal);

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeAvatarModal);

    avatarModal.addEventListener('click', (e) => {
        if (e.target === avatarModal) closeAvatarModal();
    });

    avatarOptions.forEach(option => {
        option.addEventListener('click', handleAvatarSelection);
    });
}

function bindTabEvents() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    if (!tabButtons.length || !tabContents.length) return;

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');

            const targetId = button.getAttribute('data-target');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

function getPictureUrl(profilePicture) {
    if (!profilePicture) {
        return '/assets/pharaoh-blue.png';
    }

    if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://') || profilePicture.startsWith('/')) {
        return profilePicture;
    }

    return `/assets/${profilePicture}`;
}

async function syncProfilePicture(userId,pictureUrl) {
    try{
        const token = ensureValidAccessToken()
        const response = await authenticatedFetch(`/api/users/${userId}/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({profilePicture: pictureUrl })
        });
        if (!response) {
            setStatus('Session expirée. Impossible de sauvegarder la photo.');
            return;
        }

        const payload = await response.json();

        if (!response.ok) {

            setStatus(payload.error || 'Erreur lors de la sauvegarde de la photo.');
            return;
        }

        setStatus('Photo de profil mise à jour avec succès.', false);

    } catch (error) {
        console.error("Erreur réseau :", error);
        setStatus("Impossible de joindre le serveur pour sauvegarder la photo.");
    }

}


function setStatus(message, isError = true) {
    statusEl.textContent = message;
    statusEl.style.color = isError ? '#ffb3b3' : '#b8f7c5';
}

async function challengeUser(friendId) {
    const result = await sendChallenge(friendId);

    if (!result.ok) {
        const errorMessage = result.payload?.error || (result.error === 'MISSING_TOKEN'
            ? 'Session expirée. Veuillez vous reconnecter.'
            : 'Impossible de défier');
        setStatus(errorMessage);
        return;
    }

    setStatus('Défi envoyé avec succès.', false);
    await loadChallengeData();
}

function createFriendItem({ id, username, elo, profilePicture }, actions = []) {
    const item = document.createElement('li');
    item.className = 'friend-item';
    item.innerHTML = `
        <div class="friend-main">
            <img class="friend-avatar" alt="Avatar de ${username}" src="${getPictureUrl(profilePicture)}" />
            <div>
                <p class="friend-name">${username}</p>
                <p class="friend-meta">ELO: ${elo}</p>
            </div>
        </div>
        <div class="friend-actions"></div>
    `;

    const image = item.querySelector('.friend-avatar');
    image.onerror = () => {
        image.src = '/assets/pharaoh-blue.png';
    };

    const actionsEl = item.querySelector('.friend-actions');
    actions.forEach(({ label, onClick, className = '' }) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `friend-button ${className}`.trim();
        button.textContent = label;
        button.addEventListener('click', () => onClick(id));
        actionsEl.appendChild(button);
    });

    return item;
}

function createChallengeItem(challenge, actions = []) {
    const { id, challengerUserId, targetUserId, status, updatedAt } = challenge;

    const item = document.createElement('li');
    item.className = 'friend-item';
    item.innerHTML = `
        <div class="friend-main">
            <div>
                <p class="friend-name">Défi ${challengerUserId} → ${targetUserId}</p>
                <p class="friend-meta">Statut: ${status} · mis à jour: ${new Date(updatedAt).toLocaleString('fr-FR')}</p>
            </div>
        </div>
        <div class="friend-actions"></div>
    `;

    const actionsEl = item.querySelector('.friend-actions');
    actions.forEach(({ label, onClick, className = '' }) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `friend-button ${className}`.trim();
        button.textContent = label;
        button.addEventListener('click', () => onClick(id));
        actionsEl.appendChild(button);
    });

    return item;
}

function renderIncomingChallenges(challenges) {
    incomingChallengesListEl.innerHTML = '';
    incomingChallengesEmptyEl.style.display = challenges.length ? 'none' : 'block';

    challenges.forEach((challenge) => {
        const item = createChallengeItem(challenge, [
            {
                label: 'Accepter',
                onClick: async (challengeId) => {
                    const response = await acceptChallenge(challengeId);
                    if (!response.ok) {
                        setStatus(response.payload?.error || 'Impossible d’accepter le défi.');
                        return;
                    }
                    console.log(response)
                    setStatus('Défi accepté.', false);
                    const gameId = response.payload?.challenge?.gameId;
                    if (!gameId) {
                        setStatus('Défi accepté, mais aucun identifiant de partie n’a été renvoyé.');
                        await loadChallengeData();
                        return;
                    }

                    setCookie('gameId', gameId);
                    window.location.href = '../waiting-room-page/waiting-room-page.html';
                },
            },
            {
                label: 'Refuser',
                className: 'danger',
                onClick: async (challengeId) => {
                    const response = await declineChallenge(challengeId);
                    if (!response.ok) {
                        setStatus(response.payload?.error || 'Impossible de refuser le défi.');
                        return;
                    }

                    setStatus('Défi refusé.', false);
                    await loadChallengeData();
                },
            },
        ]);

        incomingChallengesListEl.appendChild(item);
    });
}


function renderFriends(friends, token) {
    friendsListEl.innerHTML = '';
    friendsEmptyEl.style.display = friends.length ? 'none' : 'block';

    friends.forEach((friend) => {
        const item = createFriendItem(friend, [
            {
                label: "Défier",
                onClick: challengeUser,
            },
            {
                label: 'Voir le profil',
                onClick: (friendId) => {
                    window.location.href = `../public-profile-page/public-profile.html?userId=${encodeURIComponent(friendId)}`;
                }
            },
            {
                label: 'Retirer',
                className: 'danger',
                onClick: async (friendId) => {
                    const response = await authenticatedFetch('/api/users/friends', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ friendId })
                    });
                    if (!response) {
                        setStatus('Session expirée. Veuillez vous reconnecter.');
                        return;
                    }
                    const payload = await response.json();

                    if (!response.ok) {
                        setStatus(payload.error || 'Impossible de retirer cet ami.');
                        return;
                    }

                    setStatus('Ami retiré avec succès.', false);
                    await loadFriendData(token);
                }
            }
        ]);
        friendsListEl.appendChild(item);
    });
}

async function loadChallengeData() {
    try {
        const incomingResponse = await listIncomingChallenges();

        if (!incomingResponse.ok) {
            throw new Error(incomingResponse.payload?.error || 'Impossible de charger les défis reçus.');
        }

        renderIncomingChallenges(incomingResponse.payload.challenges || []);
    } catch (error) {
        console.error(error);
        setStatus('Impossible de charger les défis.');
    }
}

function bindChallengeSocket() {
    if (challengeSocket) {
        challengeSocket.disconnect();
    }

    challengeSocket = createChallengeSocket();

    const refresh = () => {
        loadChallengeData().catch(console.error);
    };

    challengeSocket.on('challenge:incoming', refresh);
    challengeSocket.on('challenge:accepted', (payload) => {
        const gameId = payload?.challenge?.gameId;
        if (!gameId) {
            refresh();
            return;
        }

        setCookie('gameId', gameId);
        window.location.href = '../waiting-room-page/waiting-room-page.html';
    });
    challengeSocket.on('challenge:declined', refresh);
    challengeSocket.on('challenge:cancelled', refresh);
    challengeSocket.on('challenge:updated', refresh);
}


function renderRequests(requests, token) {
    requestsListEl.innerHTML = '';
    requestsEmptyEl.style.display = requests.length ? 'none' : 'block';

    requests.forEach(({ requester }) => {
        const item = createFriendItem(requester, [
            {
                label: 'Accepter',
                onClick: async (requestUserId) => {
                    const response = await authenticatedFetch('/api/users/friends/accept', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ requestUserId })
                    });
                    if (!response) {
                        setStatus('Session expirée. Veuillez vous reconnecter.');
                        return;
                    }
                    const payload = await response.json();

                    if (!response.ok) {
                        setStatus(payload.error || 'Impossible d’accepter cette demande.');
                        return;
                    }

                    setStatus('Demande acceptée.', false);
                    await loadFriendData(token);
                }
            },
            {
                label: 'Refuser',
                className: 'danger',
                onClick: async (userId) => {
                    const response = await authenticatedFetch('/api/users/friends/request', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId })
                    });
                    if (!response) {
                        setStatus('Session expirée. Veuillez vous reconnecter.');
                        return;
                    }
                    const payload = await response.json();

                    if (!response.ok) {
                        setStatus(payload.error || 'Impossible de refuser cette demande.');
                        return;
                    }

                    setStatus('Demande refusée.', false);
                    await loadFriendData(token);
                }
            }
        ]);
        requestsListEl.appendChild(item);
    });
}

async function loadFriendData(token) {
    try {
        const [friendsResponse, requestsResponse] = await Promise.all([
            authenticatedFetch('/api/users/friends', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }),
            authenticatedFetch('/api/users/friends/requests', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })
        ]);

        if (!friendsResponse || !requestsResponse) {
            throw new Error('Session expirée.');
        }

        const friendsPayload = await friendsResponse.json();
        const requestsPayload = await requestsResponse.json();

        if (!friendsResponse.ok) {
            throw new Error(friendsPayload.error || 'Impossible de charger les amis.');
        }

        if (!requestsResponse.ok) {
            throw new Error(requestsPayload.error || 'Impossible de charger les demandes.');
        }

        renderFriends(friendsPayload.friends || [], token);
        renderRequests(requestsPayload.requests || [], token);
    } catch (error) {
        console.error(error);
        setStatus('Impossible de charger la partie sociale du profil.');
    }
}
function setStatValue(element, value, suffix = '') {
    element.textContent = `${value ?? 0}${suffix}`;
}

async function loadAchievements(achievementsIds) {
    achievementsGrid.innerHTML = '';

    try {

        const response = await authenticatedFetch('/api/users/achievements/catalogue', { method: 'GET',headers: { 'Content-Type': 'application/json' } });
        const data = await response.json();
        const catalogue = data.catalogue || [];


        catalogue.forEach(achievement => {

            const isUnlocked = achievementsIds.includes(achievement.id);

            const imageClass = isUnlocked ? 'achievement-icon unlocked' : 'achievement-icon locked';


            const tooltipText = isUnlocked ? 'Débloqué !' : 'Verrouillé';

            const card = document.createElement('div');

            card.className = isUnlocked ? 'achievement-card' : 'achievement-card locked';
            card.innerHTML = `
                <img src="${achievement.iconUrl}" class="${imageClass}" title="${tooltipText}" alt="${achievement.name}" />
                <h3 class="achievement-name">${achievement.name}</h3>
                <p class="achievement-desc">${achievement.description}</p>
            `;

            achievementsGrid.appendChild(card);
        });

    } catch (error) {
        console.error("Erreur lors du chargement des succès :", error);
        achievementsGrid.innerHTML = '<p class="empty-friends">Impossible de charger les succès.</p>';
    }
}


async function loadHistory(token) {
    historyListEl.innerHTML = '';

    const userId = getUserIdFromToken(token);

    try {
        const response = await authenticatedFetch(`/api/games/history/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error("Erreur serveur");

        const payload = await response.json();
        const games = payload.games || [];


        if (games.length === 0) {

            historyEmptyEl.style.display = 'block';
            return;
        }

        historyEmptyEl.style.display = 'none';

        games.forEach(game => {
            const li = document.createElement('li');

            let resultClass = 'draw';
            let resultText = 'Égalité';
            if (game.result === 'WIN') { resultClass = 'win'; resultText = 'Victoire'; }
            if (game.result === 'LOSS') { resultClass = 'loss'; resultText = 'Défaite'; }

            li.className = `history-item ${resultClass}`;

            const dateStr = new Date(game.date).toLocaleString('fr-FR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            li.innerHTML = `
                <div class="history-players">
                    <span>${game.playerName}</span>
                    <span class="history-vs">VS</span>
                    <span>${game.opponentName}</span>
                </div>
                <div class="history-details">
                    <p class="history-result">${resultText}</p>
                    <p class="history-meta">${game.movesCount} coups • ${dateStr}</p>
                </div>
            `;

            historyListEl.appendChild(li);
        });

    } catch (error) {
        console.error("Impossible de charger l'historique", error);
        historyListEl.innerHTML = '<p class="empty-friends" style="color: #ffb3b3;">Erreur lors du chargement des parties.</p>';
    }
}

async function loadProfile() {
    const token = await ensureValidAccessToken();
    if (!token) {
        statusEl.textContent = 'Utilisateur non connecté.';
        return;
    }

    try {
        const response = await authenticatedFetch(`/api/users/${getUserIdFromToken(token)}/profile`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response) {
            statusEl.textContent = 'Session expirée. Veuillez vous reconnecter.';
            return;
        }

        const payload = await response.json();
        const stats = payload.stats;
        usernameEl.textContent = payload.username;
        eloEl.textContent = `ELO: ${payload.elo}`;
        setStatValue(winRateEl, stats.winRate, '%');
        setStatValue(totalWinsEl,stats.totalWins);
        setStatValue(totalGamesEl, stats.totalGames);
        setStatValue(totalLossesEl, stats.totalLosses);
        setStatValue(winStreakEl, stats.winStreak);
        pictureEl.src = getPictureUrl(payload.profilePicture);
        pictureEl.onerror = () => {
            pictureEl.src = '/assets/pharaoh-blue.png';
        };

        const playerSuccess = payload.achievements || [];
        await loadHistory(token);
        await loadAchievements(playerSuccess);
        await loadFriendData(token);
        await loadChallengeData();
        bindChallengeSocket();
    } catch (error) {
        console.log(error.toString());
        statusEl.textContent = 'Impossible de charger le profile.';
    }
}
bindAvatarModalEvents();
bindTabEvents();
loadProfile();
