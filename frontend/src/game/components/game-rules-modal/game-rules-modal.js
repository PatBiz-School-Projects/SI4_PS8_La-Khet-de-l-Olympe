import { apiFetch } from "/utils/wrapFetch.js";

export class GameRulesModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        try {
            const [htmlResponse, cssResponse] = await Promise.all([
                apiFetch("/game/components/game-rules-modal/game-rules-modal.html"),
                apiFetch("/game/components/game-rules-modal/game-rules-modal.css"),
            ]);

            const html = await htmlResponse.text();
            const css = await cssResponse.text();

            this.shadowRoot.innerHTML = `
                <style>${css}</style>
                ${html}
            `;

            this.shadowRoot.querySelector('#close-btn').addEventListener('click', () => {
                this.hide();
            });

        } catch (err) {
            console.error("Error while loading the rules component:", err);
        }
    }

    show() {
        this.shadowRoot.querySelector("app-modal").show();
    }

    hide() {
        this.shadowRoot.querySelector("app-modal").hide();
    }
}
customElements.define('game-rules-modal', GameRulesModal);
