import { apiFetch } from "/utils/wrapFetch.js";
import { getPictureUrl } from "/utils/picture.js";

export class LeaderboardComponent {
    constructor({ statusElement, listElement, selfElement, getCurrentUserId }) {
        this.statusElement = statusElement;
        this.listElement = listElement;
        this.selfElement = selfElement;
        this.getCurrentUserId = getCurrentUserId;
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

            const username = document.createElement("span");
            username.className = "leaderboard-item__username";
            username.textContent = user.username;

            const elo = document.createElement("span");
            elo.className = "leaderboard-item__elo";
            elo.textContent = `${user.elo} ELO`;

            item.append(rank, username, elo);
            this.listElement.appendChild(item);
        });
    }

    renderCurrentUserRank({ rank, elo }) {
        if (!this.selfElement) {
            return;
        }

        this.selfElement.hidden = false;
        this.selfElement.innerHTML = `
            <p class="leaderboard-self__label">Votre classement</p>
            <div class="leaderboard-self__content">
                <span class="leaderboard-item__rank">${rank ? `#${rank}` : "Hors top"}</span>
                <span class="leaderboard-item__username">Vous</span>
                <span class="leaderboard-item__elo">${elo ?? "—"} ELO</span>
            </div>
        `;
    }

    async load(limit = 10) {
        this.listElement.innerHTML = "";
        if (this.selfElement) {
            this.selfElement.hidden = true;
            this.selfElement.innerHTML = "";
        }
        try {
            const currentUserId = this.getCurrentUserId();
            const [response,liveStatsResponse] = await Promise.all([
                apiFetch(`/api/users/leaderboard?limit=${encodeURIComponent(limit)}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                }),
                apiFetch(`/api/users/${encodeURIComponent(currentUserId)}/live-stats`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                })
            ]);
            const payload = await response.json();
            const liveResponse = await liveStatsResponse.json();
            console.log(payload)
            console.log(liveResponse)
            if (!response.ok) {
                this.setStatus(payload.error || "Impossible de charger le leaderboard.", true);
                return;
            }
            const selfEntry = payload.find((entry) => entry.username === liveResponse.username);
            const rank = selfEntry ? payload.indexOf(selfEntry) + 1 : null;

            const elo = selfEntry.elo;
            this.renderCurrentUserRank({ rank, elo });

            this.setStatus("");
            this.renderLeaderboard(payload);
        } catch (error) {
            console.error("Unable to load leaderboard", error);
            this.setStatus("Erreur réseau pendant le chargement du leaderboard.", true);
        }
    }
}
