import {apiFetch} from '/'
export class AppModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        /** @private @type {boolean} */
        this._isReady = false;
    }

    /**
     * Called when the web component is added to the DOM.
     */
    async connectedCallback() {
        try {
            // Load the component's HTML template & CSS style

            const [htmlResponse, cssResponse] = await Promise.all([
                apiFetch("/shared/components/app-modal/app-modal.html"),
                apiFetch("/shared/components/app-modal/app-modal.css"),
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

        this._isReady = true;
    }

    _toggleEventListeners(ON) {
        this._listeners = {
            onCloseButtonClicked: _ => this.hide(),
            onOverlayClicked: _ => this.hide(),
            onKeydown: event => {
                if (event.key === 'Escape') {
                    this.hide();
                }
            },
        }

        const closeBtn = this.shadowRoot.querySelector("#close-modal-btn");
        const overlay  = this.shadowRoot.querySelector("#modal-overlay");

        if (ON) {
            closeBtn.addEventListener('click', this._listeners.onCloseButtonClicked);
            overlay.addEventListener('click', this._listeners.onOverlayClicked);
            document.addEventListener('keydown', this._listeners.onKeydown);
        } else {
            closeBtn.removeEventListener('click', this._listeners.onCloseButtonClicked);
            overlay.removeEventListener('click', this._listeners.onOverlayClicked);
            document.removeEventListener('keydown', this._listeners.onKeydown);
        }
    }

    show() {
        if (!this._isReady) {
            return;
        }

        const modal = this.shadowRoot.querySelector("#modal");
        modal.style.display = 'flex';

        this._toggleEventListeners(true);

        this.dispatchEvent(new CustomEvent("showing-modal", {
            detail: {/* nothing */},
            bubbles:true,
            composed: true,
        }));
    }

    hide() {
        if (!this._isReady) {
            return;
        }

        const modal = this.shadowRoot.querySelector("#modal");
        modal.style.display = 'none';

        this._toggleEventListeners(false);

        this.dispatchEvent(new CustomEvent("hiding-modal", {
            detail: {/* nothing */},
            bubbles:true,
            composed: true,
        }));
    }
}
customElements.define('app-modal', AppModal);
