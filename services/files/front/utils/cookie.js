export function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) return value;
    }
    return null;
}


export function setCookie(name, value) {
    document.cookie = `${name}=${value}; path=/`;
}

export function removeCookie(name) {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function clearCookies() {
    const cookies = document.cookie.split(";");

    for (let cookie of cookies) {
        const name = cookie.split("=")[0].trim();
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
}
