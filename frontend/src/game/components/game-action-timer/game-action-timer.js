export class GameActionTimer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        /** @private @type {boolean} */
        this._isReady = false;

        /** @private @type {HTMLElement} */
        this._timerElem;
    }

    /**
     * Called when the web component is added to the DOM.
     */
    async connectedCallback() {
        try {
            // Load the component's HTML template & CSS style

            const [htmlResponse, cssResponse] = await Promise.all([
                fetch("/game/components/game-action-timer/game-action-timer.html"),
                fetch("/game/components/game-action-timer/game-action-timer.css"),
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
        this._timerElem = this.shadowRoot.querySelector('#timer');
    }

    /**
     * @param {number} remainingTime
     */
    onTimerSync(remainingTime) {
        if (!this._isReady) {
            return;
        }

        const totalSeconds = Math.ceil(remainingTime / 1000);
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');

        this._timerElem.textContent = `${minutes}:${seconds}`;
    }
}
customElements.define('game-action-timer', GameActionTimer);
