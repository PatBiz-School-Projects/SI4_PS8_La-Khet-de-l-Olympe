export class GameTurnIndicator extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._activePlayerName_slot;
    }

    /**
     * Called when the web component is added to the DOM.
     */
    async connectedCallback() {
        try {
            // Load the component's HTML template & CSS style

            const [htmlResponse, cssResponse] = await Promise.all([
                fetch("/game/components/game-turn-indicator/game-turn-indicator.html"),
                fetch("/game/components/game-turn-indicator/game-turn-indicator.css"),
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

        this._activePlayerName_span = this.shadowRoot.querySelector('#active-player-name');
    }


    /** @param {string} playerName  */
    set activePlayerName(playerName) {
        this._activePlayerName_span.textContent = playerName;
    }

    /** @param {"red"|"blue"} color */
    set color(color) {
        switch (color) {
            case "red":
                this._activePlayerName_span.classList.add("red");
                this._activePlayerName_span.classList.remove("blue");
                break;

            case "blue":
                this._activePlayerName_span.classList.add("blue");
                this._activePlayerName_span.classList.remove("red");
                break;
        }
    }
}
customElements.define('game-turn-indicator', GameTurnIndicator);
