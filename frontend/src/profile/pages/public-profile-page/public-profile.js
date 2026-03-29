import { authenticatedFetch, ensureValidAccessToken } from '/utils/auth.js';

const usernameEl = document.getElementById('profile-username');
const eloEl = document.getElementById('profile-elo');
const pictureEl = document.getElementById('profile-picture');
const statusEl = document.getElementById('profile-status');
const addFriendButton = document.getElementById('add-friend-button');

function setStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.style.color = isError ? '#ffb3b3' : '#b8f7c5';
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

async function sendFriendRequest(userId) {
    const token = await ensureValidAccessToken();
    if (!token) {
        setStatus('Connectez-vous pour ajouter cet utilisateur en ami.');
        return;
    }

    addFriendButton.disabled = true;

    try {
        const response = await authenticatedFetch('/api/users/friends/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ targetUserId: userId })
        });
        if (!response) {
            setStatus('Session expirée. Veuillez vous reconnecter.');
            addFriendButton.disabled = false;
            return;
        }
        const payload = await response.json();

        if (!response.ok) {
            setStatus(payload.error || 'Impossible d’envoyer la demande.');
            addFriendButton.disabled = false;
            return;
        }

        addFriendButton.textContent = 'Demande envoyée';
        setStatus('La demande d’ami a bien été envoyée.');
    } catch (error) {
        console.error(error);
        setStatus('Impossible d’envoyer la demande d’ami.');
        addFriendButton.disabled = false;
    }
}


async function loadPublicProfile() {
    const userId = new URLSearchParams(window.location.search).get('userId');

    if (!userId) {
        statusEl.textContent = 'Aucun utilisateur public à afficher.';
        return;
    }

    try {
        const response = await fetch(`/api/users/${encodeURIComponent(userId)}/public-profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            statusEl.textContent = response.status === 404
                ? 'Utilisateur introuvable.'
                : 'Impossible de charger le profil public.';
            return;
        }

        const payload = await response.json();
        usernameEl.textContent = payload.username;
        eloEl.textContent = `ELO: ${payload.elo}`;
        pictureEl.src = getPictureUrl(payload.profilePicture);
        pictureEl.onerror = () => {
            pictureEl.src = '/assets/pharaoh-blue.png';
        };
        addFriendButton.addEventListener('click', () => sendFriendRequest(userId));
    } catch (error) {
        console.error(error);
        statusEl.textContent = 'Impossible de charger le profil public.';
    }
}

loadPublicProfile();
