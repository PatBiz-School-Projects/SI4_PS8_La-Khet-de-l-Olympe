import { authenticatedFetch, ensureValidAccessToken } from '/utils/auth.js';
import {sendChallenge} from "/utils/challenge.js";
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


function getPictureUrl(profilePicture) {
    if (!profilePicture) {
        return '/assets/pharaoh-blue.png';
    }

    if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://') || profilePicture.startsWith('/')) {
        return profilePicture;
    }

    return `/assets/${profilePicture}`;
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


async function loadProfile() {
    const token = await ensureValidAccessToken();
    if (!token) {
        statusEl.textContent = 'Utilisateur non connecté.';
        return;
    }

    try {
        const response = await authenticatedFetch('/api/users/profile', {
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
        await loadFriendData(token);
    } catch (error) {
        console.log(error.toString());
        statusEl.textContent = 'Impossible de charger le profile.';
    }
}

loadProfile();
