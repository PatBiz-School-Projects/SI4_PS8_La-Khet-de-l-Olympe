import { apiFetch } from "/utils/wrapFetch.js";
import { getPictureUrl } from "/utils/picture.js";
import { sendChallenge } from "/utils/challenge.js";

export class FriendsComponent {
    constructor({ statusElement, onlineListElement, offlineListElement, onlineEmptyElement, offlineEmptyElement }) {
        this.statusElement = statusElement;
        this.onlineListElement = onlineListElement;
        this.offlineListElement = offlineListElement;
        this.onlineEmptyElement = onlineEmptyElement;
        this.offlineEmptyElement = offlineEmptyElement;
    }

    setStatus(message, isError = false) {
        this.statusElement.textContent = message;
        this.statusElement.style.color = isError ? "#ffb3b3" : "";
    }

    async challengeUser(targetUserId) {
        const result = await sendChallenge(targetUserId);
        if (!result.ok) {
            this.setStatus(result.payload?.error || "Impossible d'envoyer le défi.", true);
            return;
        }

        this.setStatus("Défi envoyé avec succès.");
    }

    renderFriendsList(targetElement, friends, canChallenge) {
        targetElement.innerHTML = "";

        friends.forEach((friend) => {
            const item = document.createElement("li");
            item.className = "leaderboard-item friend-item";

            const avatar = document.createElement("img");
            avatar.className = "leaderboard-item__avatar";
            avatar.src = getPictureUrl(friend.profilePicture);
            avatar.alt = `Avatar de ${friend.username}`;

            const username = document.createElement("span");
            username.className = "leaderboard-item__username";
            username.textContent = friend.username;

            const elo = document.createElement("span");
            elo.className = "leaderboard-item__elo";
            elo.textContent = `${friend.elo} ELO`;

            item.append(avatar, username, elo);

            if (canChallenge) {
                const challengeButton = document.createElement("button");
                challengeButton.type = "button";
                challengeButton.className = "search-action-btn search-action-btn--icon friend-challenge-btn";
                challengeButton.setAttribute("aria-label", `Défier ${friend.username}`);
                challengeButton.title = `Défier ${friend.username}`;

                const challengeIcon = document.createElement("img");
                challengeIcon.src = "/assets/challenge.svg";
                challengeIcon.alt = "";
                challengeIcon.className = "search-action-btn__icon";
                challengeIcon.setAttribute("aria-hidden", "true");

                challengeButton.append(challengeIcon);
                challengeButton.onclick = async () => {
                    challengeButton.disabled = true;
                    await this.challengeUser(friend.id);
                    challengeButton.disabled = false;
                };
                item.append(challengeButton);
            }

            targetElement.appendChild(item);
        });
    }

    async load() {
        this.onlineListElement.innerHTML = "";
        this.offlineListElement.innerHTML = "";
        this.onlineEmptyElement.hidden = true;
        this.offlineEmptyElement.hidden = true;

        const friendsResponse = await apiFetch("/api/users/friends", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!friendsResponse) {
            this.setStatus("Session expirée. Veuillez vous reconnecter.", true);
            return;
        }
        const connectedResponse = await apiFetch("/api/users/connected", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        const friendsPayload = await friendsResponse.json();
        const connectedPayload = connectedResponse.ok
            ? await connectedResponse.json()
            : { users: [] };

        if (!friendsResponse.ok) {
            this.setStatus(friendsPayload.error || "Impossible de charger vos amis.", true);
            return;
        }

        const friends = friendsPayload.friends || [];
        const connectedIds = new Set((connectedPayload.users || []).map((user) => user.id));

        const onlineFriends = friends.filter((friend) => connectedIds.has(friend.id));
        const offlineFriends = friends.filter((friend) => !connectedIds.has(friend.id));

        this.renderFriendsList(this.onlineListElement, onlineFriends, true);
        this.renderFriendsList(this.offlineListElement, offlineFriends, false);

        this.onlineEmptyElement.hidden = onlineFriends.length !== 0;
        this.offlineEmptyElement.hidden = offlineFriends.length !== 0;
        this.setStatus("");
    }
}
