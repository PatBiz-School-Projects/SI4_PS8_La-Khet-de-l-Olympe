import { AppModal } from "/shared/components/app-modal/app-modal.js";


export class GameForfeitModal extends HTMLElement {
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
                fetch("/game/components/game-forfeit-modal/game-forfeit-modal.html"),
                fetch("/game/components/game-forfeit-modal/game-forfeit-modal.css"),
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
            onContinueBtnClicked: _ => this._modal.hide(),
            onForfeitBtnClicked: _ => this.dispatchEvent(new CustomEvent("forfeit-game", {
                detail: {/* nothing */},
                bubbles:true,
                composed: true,
            })),
        }

        const continueBtn = this.shadowRoot.querySelector("#continue-btn");
        const forfeitBtn  = this.shadowRoot.querySelector("#forfeit-btn");

        if (ON) {
            continueBtn.addEventListener('click', this._listeners.onContinueBtnClicked);
            forfeitBtn.addEventListener('click', this._listeners.onForfeitBtnClicked);
        } else {
            continueBtn.removeEventListener('click', this._listeners.onContinueBtnClicked);
            forfeitBtn.removeEventListener('click', this._listeners.onForfeitBtnClicked);
        }
    }

    show() {
        this._modal.show();
    }
}
customElements.define('game-forfeit-modal', GameForfeitModal);
