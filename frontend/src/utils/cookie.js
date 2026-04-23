import { IS_MOBILE_WEBVIEW,API_HOST } from "/env.js";
import { CapacitorCookies } from "https://cdn.jsdelivr.net/npm/@capacitor/core@8.3.1/+esm";

const MOBILE_COOKIE_KEYS = ["userToken", "refreshToken", "guestToken", "userId", "gameId"];


export function getCookie(name) {
    if (IS_MOBILE_WEBVIEW) {
        return localStorage.getItem(name);
    }
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) return value;
    }
    return null;
}

export async function setCookie(name, value) {
    if (IS_MOBILE_WEBVIEW) {
        localStorage.setItem(name, value);
        await CapacitorCookies.setCookie({
            url: API_HOST,
            key: name,
            value: encodeURIComponent(value),
        });
        return;
    }
    document.cookie = `${name}=${value}; path=/`;
}

export async function removeCookie(name) {
    if (IS_MOBILE_WEBVIEW) {
        localStorage.removeItem(name);
        await CapacitorCookies.deleteCookie({
            url: API_HOST,
            key: name,
        });
        return;
    }
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/** @alias {@link clearCookies()} */
export async function removeAllCookies() {
    if (IS_MOBILE_WEBVIEW) {
        for (const key of MOBILE_COOKIE_KEYS) {
            localStorage.removeItem(key);
        }
        await CapacitorCookies.clearCookies({ url: API_HOST });
        return;
    }
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const name = cookie.split('=')[0].trim();
        await removeCookie(name);
    }
}

/** @alias {@link removeAllCookies()} */
export function clearCookies() {
    removeAllCookies();
}
