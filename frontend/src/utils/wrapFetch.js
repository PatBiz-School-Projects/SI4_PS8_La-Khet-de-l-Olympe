import {Capacitor} from 'https://cdn.jsdelivr.net/npm/@capacitor/core@8.3.1/+esm';
import {getCookie} from '/utils/cookie.js';
const ACCESS_TOKEN_COOKIE = 'userToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';
const apiHost = Capacitor.getPlatform() === "web" ? window.location.origin : "https://khet-olympe.ps8.pns.academy";

export async function apiFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});

    if (Capacitor.getPlatform()==='android' && !headers.has('Authorization')) {
        const accessToken = getCookie(ACCESS_TOKEN_COOKIE);
        const refreshToken = getCookie(REFRESH_TOKEN_COOKIE);
        console.log("Token envoyé",accessToken+refreshToken);
        if (accessToken && refreshToken) {
            headers.set('Authorization', `Bearer ${accessToken}`);
            headers.set('refreshToken', refreshToken);
        }
    }

    return await fetch(apiHost + url, {
        ...options,
        credentials: options.credentials ?? 'include',
        headers,
    });
}

