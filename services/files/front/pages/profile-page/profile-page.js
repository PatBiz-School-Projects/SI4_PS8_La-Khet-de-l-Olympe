import { getCookie } from '/utils/cookie.js';

const usernameEl = document.getElementById('profile-username');
const eloEl = document.getElementById('profile-elo');
const pictureEl = document.getElementById('profile-picture');
const statusEl = document.getElementById('profile-status');
const winrateEl = document.getElementById('profile-winRate');
const totalGamesEl = document.getElementById('profile-total-games');
const totalWinsEl = document.getElementById('profile-total-wins');
const totalLossesEl = document.getElementById('profile-total-losses');
const winStreakEl = document.getElementById('profile-win-streak');

function getPictureUrl(profilePicture) {
    if (!profilePicture) {
        return '/assets/pharaoh-blue.png';
    }

    if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://') || profilePicture.startsWith('/')) {
        return profilePicture;
    }

    return `/assets/${profilePicture}`;
}
function setStatValue(element, value, suffix = '') {
    element.textContent = `${value ?? 0}${suffix}`;
}

async function loadProfile() {
    const token = getCookie('userToken');
    if (!token) {
        statusEl.textContent = 'Utilisateur non connecté.';
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
        const stats = payload.stats;
        usernameEl.textContent = payload.username;
        eloEl.textContent = `ELO: ${payload.elo}`;
        setStatValue(winrateEl, stats.winRate, '%');
        setStatValue(totalWinsEl,stats.totalWins);
        setStatValue(totalGamesEl, stats.totalGames);
        setStatValue(totalLossesEl, stats.totalLosses);
        setStatValue(winStreakEl, stats.winStreak);
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
