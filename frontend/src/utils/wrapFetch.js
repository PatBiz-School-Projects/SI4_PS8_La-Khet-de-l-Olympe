import { getCookie} from "/utils/cookie.js";

import { API_HOST, IS_MOBILE_WEBVIEW } from "/env.js";


const USER_ACCESS_TOKEN_COOKIE = "userToken";
const GUEST_ACCESS_TOKEN_COOKIE = "guestToken";
const REFRESH_TOKEN_COOKIE = "refreshToken";


export async function apiFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    console.log("Document cookie",document.cookie);
    if (IS_MOBILE_WEBVIEW && !headers.has('Authorization')) {
        const accessToken = getCookie(USER_ACCESS_TOKEN_COOKIE) || getCookie(GUEST_ACCESS_TOKEN_COOKIE);
        const refreshToken = getCookie(REFRESH_TOKEN_COOKIE);
        console.log("Guest token", getCookie(GUEST_ACCESS_TOKEN_COOKIE));
        console.log("Access token", getCookie(USER_ACCESS_TOKEN_COOKIE));
        console.log("Refresh token", getCookie(REFRESH_TOKEN_COOKIE));
        if (accessToken) {
            headers.set('Authorization', `Bearer ${accessToken}`);
        }
        if (refreshToken) {
            headers.set('refreshToken', refreshToken);
        }
    }

    return await fetch(API_HOST + url, {
        ...options,
        credentials: options.credentials ?? 'include',
        headers,
    });
}
