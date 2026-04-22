import { IS_MOBILE_WEBVIEW } from "/env.js";


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

export function setCookie(name, value) {
    if (IS_MOBILE_WEBVIEW) {
        localStorage.setItem(name, value);
        return;
    }
    document.cookie = `${name}=${value}; path=/`;
}

export function removeCookie(name) {
    if (IS_MOBILE_WEBVIEW) {
        localStorage.removeItem(name);
        return;
    }
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/** @alias {@link clearCookies()} */
export function removeAllCookies() {
    if (IS_MOBILE_WEBVIEW) {
        localStorage.clear();
        return;
    }
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const name = cookie.split('=')[0].trim();
        removeCookie(name);
    }
}

/** @alias {@link removeAllCookies()} */
export function clearCookies() {
    removeAllCookies();
}
