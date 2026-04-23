import { ensureValidAccessToken, clearAuthTokens } from "/utils/auth.js";
import { decodeJwtPayload } from "/utils/jwt.js";
import { SearchComponent } from "/home/components/index.js";

const backButton = document.getElementById("mobile-search-back-btn");

const searchComponent = new SearchComponent({
    inputElement: document.getElementById("mobile-search-users-input"),
    statusElement: document.getElementById("mobile-search-status"),
    resultsElement: document.getElementById("mobile-search-results"),
    getCurrentUserId: () => window.__mobileSearchUserId,
    isAuthenticated: true
});

backButton.onclick = () => {
    window.location.href = "/home/pages/home-page/home-page.html";
};

onload = async () => {
    const token = await ensureValidAccessToken();

    const payload = decodeJwtPayload(token);
    window.__mobileSearchUserId = payload?.sub;

    searchComponent.bindInput();
    searchComponent.setStatus("Tapez au moins 2 caractères.");
    document.getElementById("mobile-search-users-input").focus();
};
