import { getCookie, removeCookie, setCookie } from '/utils/cookie.js';
import { apiFetch} from "/utils/wrapFetch.js";
const ACCESS_TOKEN_COOKIE = 'userToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';

function getAuthCookies() {
    return {
        accessToken: getCookie(ACCESS_TOKEN_COOKIE),
        refreshToken: getCookie(REFRESH_TOKEN_COOKIE) || getCookie(ACCESS_TOKEN_COOKIE)
    };
}

export function setAuthTokens(accessToken, refreshToken = accessToken) {
    if (accessToken) {
        setCookie(ACCESS_TOKEN_COOKIE, accessToken);
    }

    if (refreshToken) {
        setCookie(REFRESH_TOKEN_COOKIE, refreshToken);
    }
}

export function clearAuthTokens() {
    removeCookie(ACCESS_TOKEN_COOKIE);
    removeCookie(REFRESH_TOKEN_COOKIE);
}

export async function verifyToken(token) {
    if (!token) {
        return false;
    }

    try {
        const response = await apiFetch('/api/auth/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

export async function renewToken(refreshToken) {
    if (!refreshToken) {
        return null;
    }

    try {
        const response = await apiFetch('/api/auth/renew', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${refreshToken}`
            }
        });

        if (!response.ok) {
            return null;
        }

        const payload = await response.json();
        const newToken = payload?.accessToken || payload?.token;
        if (!newToken) {
            return null;
        }

        setAuthTokens(newToken, refreshToken);
        return newToken;
    } catch (error) {
        return null;
    }
}

export async function ensureValidAccessToken() {
    const { accessToken, refreshToken } = getAuthCookies();

    if (await verifyToken(accessToken)) {
        return accessToken;
    }

    return await renewToken(refreshToken);
}

export async function authenticatedFetch(url, options = {}) {
    const token = await ensureValidAccessToken();
    if (!token) {
        return null;
    }

    const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
    };

    const response = await apiFetch(url, {
        ...options,
        headers
    });

    if (response.status !== 401) {
        return response;
    }

    const refreshedToken = await renewToken(getAuthCookies().refreshToken);
    if (!refreshedToken) {
        return response;
    }

    return await apiFetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${refreshedToken}`
        }
    });
}
export function getUserIdFromToken(token) {
    if (!token) return null;
    try {
        const payloadPart = token.split('.')[1];
        const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const json = atob(base64);
        const payload = JSON.parse(json);

        return payload.sub;
    } catch (error) {
        console.error(error);
        return null;
    }
}
