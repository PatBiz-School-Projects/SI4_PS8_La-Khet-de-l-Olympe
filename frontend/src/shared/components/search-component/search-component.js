import { authenticatedFetch } from "/utils/auth.js";
import { getPictureUrl } from "/utils/picture.js";

export class SearchComponent {
    constructor({ inputElement, statusElement, resultsElement, getCurrentUserId }) {
        this.inputElement = inputElement;
        this.statusElement = statusElement;
        this.resultsElement = resultsElement;
        this.getCurrentUserId = getCurrentUserId;
    }

    setStatus(message, isError = false) {
        this.statusElement.textContent = message;
        this.statusElement.style.color = isError ? "#ffb3b3" : "";
    }

    async sendFriendRequest(targetUserId, button) {
        button.disabled = true;

        const response = await authenticatedFetch("/api/users/friends/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetUserId }),
        });

        if (!response) {
            this.setStatus("Session expirée. Veuillez vous reconnecter.", true);
            button.disabled = false;
            return;
        }

        const payload = await response.json();
        if (!response.ok) {
            this.setStatus(payload.error || "Impossible d'envoyer la demande d'ami.", true);
            button.disabled = false;
            return;
        }

        button.textContent = "Demande envoyée";
        this.setStatus("Demande d'ami envoyée.");
    }

    renderSearchResults(users) {
        this.resultsElement.innerHTML = "";

        users.forEach((user) => {
            const item = document.createElement("article");
            item.className = "search-result-item";

            const avatar = document.createElement("img");
            avatar.className = "search-result-item__avatar";
            avatar.src = getPictureUrl(user.profilePicture);
            avatar.alt = `Avatar de ${user.username}`;

            const name = document.createElement("p");
            name.className = "search-result-item__name";
            name.textContent = user.username;

            const actions = document.createElement("div");
            actions.className = "search-result-item__actions";

            const addFriendButton = document.createElement("button");
            addFriendButton.type = "button";
            addFriendButton.className = "search-action-btn";
            addFriendButton.textContent = "Ajouter en ami";
            addFriendButton.onclick = async () => this.sendFriendRequest(user.userId, addFriendButton);

            actions.append(addFriendButton);
            item.append(avatar, name, actions);
            this.resultsElement.appendChild(item);
        });
    }

    async runUserSearch(rawQuery) {
        const query = rawQuery.trim();

        if (query.length < 2) {
            this.resultsElement.innerHTML = "";
            this.setStatus("Tapez au moins 2 caractères.");
            return;
        }

        this.setStatus("Recherche en cours...");

        const response = await authenticatedFetch(`/api/users?query=${encodeURIComponent(query)}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!response) {
            this.setStatus("Session expirée. Veuillez vous reconnecter.", true);
            return;
        }

        const payload = await response.json();
        const currentUserId = this.getCurrentUserId?.();
        const users = payload.filter((user) => user.userId !== currentUserId);
        if (!users.length) {
            this.resultsElement.innerHTML = "";
            this.setStatus("Aucun joueur trouvé.");
            return;
        }

        this.setStatus(`${users.length} joueur(s) trouvé(s).`);
        this.renderSearchResults(users);
    }

    bindInput() {
        this.inputElement.addEventListener("input", async (event) => {
            await this.runUserSearch(event.target.value);
        });
    }

    setEnabled(enabled) {
        this.inputElement.disabled = !enabled;
        if (!enabled) {
            this.setStatus("Connectez-vous pour rechercher des joueurs.");
        }
    }
}
