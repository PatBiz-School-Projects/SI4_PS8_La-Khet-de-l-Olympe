// IIFE that runs before loading the body of a page to prevent FOUC
(() => {
    // Cannot import `/env.js` bcs imports might takes too long

    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    const isWebView = (
        (isAndroid && navigator.userAgent.includes("wv"))
        || (isIOS && !navigator.userAgent.includes("Safari"))
    );

    if (isWebView) {
        document.documentElement.classList.add("mobile");
    }
})();
