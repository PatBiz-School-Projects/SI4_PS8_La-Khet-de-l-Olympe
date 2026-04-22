import { apiFetch } from "/utils/wrapFetch.js";
import { getPictureUrl } from "/utils/picture.js";

export class LeaderboardComponent {
    constructor({ statusElement, listElement }) {
        this.statusElement = statusElement;
        this.listElement = listElement;
    }

    setStatus(message, isError = false) {
        this.statusElement.textContent = message;
        this.statusElement.style.color = isError ? "#ffb3b3" : "";
    }

    renderLeaderboard(users) {
        this.listElement.innerHTML = "";
        users.forEach((user, index) => {
            const item = document.createElement("li");
            item.className = "leaderboard-item";

            const rank = document.createElement("span");
            rank.className = "leaderboard-item__rank";
            rank.textContent = `#${index + 1}`;

            const avatar = document.createElement("img");
            avatar.className = "leaderboard-item__avatar";
            avatar.src = getPictureUrl(user.profilePicture);
            avatar.alt = `Avatar de ${user.username}`;

            const username = document.createElement("span");
            username.className = "leaderboard-item__username";
            username.textContent = user.username;

            const elo = document.createElement("span");
            elo.className = "leaderboard-item__elo";
            elo.textContent = `${user.elo} ELO`;

            item.append(rank, avatar, username, elo);
            this.listElement.appendChild(item);
        });
    }

    async load(limit = 10) {
        this.listElement.innerHTML = "";

        try {
            const response = await apiFetch(`/api/users/leaderboard?limit=${encodeURIComponent(limit)}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
            const payload = await response.json();

            if (!response.ok) {
                this.setStatus(payload.error || "Impossible de charger le leaderboard.", true);
                return;
            }
            this.setStatus("");
            this.renderLeaderboard(payload);
        } catch (error) {
            console.error("Unable to load leaderboard", error);
            this.setStatus("Erreur réseau pendant le chargement du leaderboard.", true);
        }
    }
}
