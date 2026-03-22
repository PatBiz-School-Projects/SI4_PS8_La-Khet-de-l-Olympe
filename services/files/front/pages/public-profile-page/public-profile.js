const usernameEl = document.getElementById('profile-username');
const eloEl = document.getElementById('profile-elo');
const pictureEl = document.getElementById('profile-picture');
const statusEl = document.getElementById('profile-status');

function getPictureUrl(profilePicture) {
    if (!profilePicture) {
        return '/assets/pharaoh-blue.png';
    }

    if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://') || profilePicture.startsWith('/')) {
        return profilePicture;
    }

    return `/assets/${profilePicture}`;
}

async function loadPublicProfile() {
    const userId = new URLSearchParams(window.location.search).get('userId');

    if (!userId) {
        statusEl.textContent = 'Aucun utilisateur public à afficher.';
        return;
    }

    try {
        const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
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
    } catch (error) {
        console.error(error);
        statusEl.textContent = 'Impossible de charger le profil public.';
    }
}

loadPublicProfile();
