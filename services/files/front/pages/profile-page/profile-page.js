import { getCookie } from '/utils/cookie.js';

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

async function loadProfile() {
    const token = getCookie('userToken');
    if (!token) {
        return;
    }

    try {
        const response = await fetch('/api/users/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const payload = await response.json();
        usernameEl.textContent = payload.username;
        eloEl.textContent = `ELO: ${payload.elo}`;

        pictureEl.src = getPictureUrl(payload.profilePicture);
        pictureEl.onerror = () => {
            pictureEl.src = '/assets/pharaoh-blue.png';
        };
    } catch (error) {
        console.log(error.toString());
        statusEl.textContent = 'Impossible de charger le profile.';
    }
}

loadProfile();
