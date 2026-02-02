import "../game-board/game-board.js";

class GamePage extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        try {
            // Load the component's HTML template & CSS style

            const [htmlResponse, cssResponse] = await Promise.all([
                fetch("gamePage/gamePage.html"),
                fetch("gamePage/gamePage.css"),
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

        this.updateGamePage();
    }

    updateGamePage() {
        const board = this.shadowRoot.querySelector("game-board");
        const playerIndicator = this.shadowRoot.querySelector("#current-player-id");

        board.addEventListener('turn-updated', (event)=>{
            const playerNumber = event.detail.player;
            if(playerIndicator){
                playerIndicator.textContent = playerNumber;
                playerIndicator.style.color = (playerNumber === 1) ? "#007bff" : "#dc3545";
            }
        })
    }
}
customElements.define('game-page', GamePage);
