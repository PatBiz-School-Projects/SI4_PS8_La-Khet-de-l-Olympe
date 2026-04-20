import { AppModal } from "/shared/components/app-modal/app-modal.js";
import { apiFetch} from "/utils/wrapFetch.js";

export class GameOverModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        /** @private @type {AppModal} */
        this._modal;
    }

    /**
     * Called when the web component is added to the DOM.
     */
    async connectedCallback() {
        try {
            // Load the component's HTML template & CSS style

            const [htmlResponse, cssResponse] = await Promise.all([
                apiFetch("/game/components/game-over-modal/game-over-modal.html"),
                apiFetch("/game/components/game-over-modal/game-over-modal.css"),
            ]);

            const html = await htmlResponse.text();
            const css = await cssResponse.text();

            this.shadowRoot.innerHTML = `
                <style>${css}</style>
                ${html}
            `;
        } catch (err) {
            console.error("Error while loading the component:", err)
        }

        this._modal = this.shadowRoot.querySelector("app-modal");
        this._modal.addEventListener("showing-modal", () => {
            this._toggleEventListeners(true);
        });
        this._modal.addEventListener("hiding-modal", () => {
            this._toggleEventListeners(false);
        });
    }

    _toggleEventListeners(ON) {
        this._listeners = {
            onHomeBtnClicked: _ => {
                window.location.href="/home/pages/home-page/home-page.html"
            },
            onChallengeBtnClicked: _ => {
                const challengeBtn = this.shadowRoot.querySelector("#challenge-btn");
                challengeBtn.disabled = true;

                this.dispatchEvent(new CustomEvent("challenge-opponent", {
                    detail: {/* nothing */},
                    bubbles:true,
                    composed: true,
                }));
            },
        }

        const homeBtn = this.shadowRoot.querySelector("#home-btn");
        const challengeBtn = this.shadowRoot.querySelector("#challenge-btn");

        if (ON) {
            homeBtn.addEventListener('click', this._listeners.onHomeBtnClicked);
            challengeBtn?.addEventListener('click', this._listeners.onChallengeBtnClicked);
        } else {
            homeBtn.removeEventListener('click', this._listeners.onHomeBtnClicked);
            challengeBtn?.removeEventListener('click', this._listeners.onChallengeBtnClicked);
        }
    }

    set detail(detail) {
        const detail_p = this.shadowRoot.querySelector("#detail");
        detail_p.textContent = detail;
    }

    set status(status) {
        const status_p = this.shadowRoot.querySelector("#status");
        status_p.textContent = status;
    }

    show() {
        this._modal.show();
    }

    deactivateChallenge() {
        const challengeBtn = this.shadowRoot.querySelector("#challenge-btn");
        challengeBtn.remove();
    }
}
customElements.define('game-over-modal', GameOverModal);
