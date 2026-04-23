import { getCookie} from "/utils/cookie.js";

import { API_HOST, IS_MOBILE_WEBVIEW } from "/env.js";


const USER_ACCESS_TOKEN_COOKIE = "userToken";
const GUEST_ACCESS_TOKEN_COOKIE = "guestToken";
const REFRESH_TOKEN_COOKIE = "refreshToken";


export async function apiFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    console.log("Document cookie",document.cookie);
    if (IS_MOBILE_WEBVIEW) {
        // Force Origin header since Capacitor's native HTTP layer strips it
        headers.set('Origin', 'https://khet-olympe.mobile.app');

        if (!headers.has('Authorization')) {
            const accessToken = getCookie(USER_ACCESS_TOKEN_COOKIE) || getCookie(GUEST_ACCESS_TOKEN_COOKIE);
            const refreshToken = getCookie(REFRESH_TOKEN_COOKIE);
            if (accessToken) {
                headers.set('Authorization', `Bearer ${accessToken}`);
            }
            if (refreshToken) {
                headers.set('refreshToken', refreshToken);
            }
        }
    }

    return await fetch(API_HOST + url, {
        ...options,
        credentials: options.credentials ?? 'include',
        headers,
    });
}
