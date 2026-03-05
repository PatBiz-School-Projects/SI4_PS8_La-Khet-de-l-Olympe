import {RotationRenderer} from "./RotationRenderer.js";
import {GamePageActionType} from "../../pages/game-page/GamePageStateMachine/GamePageAction.js";

export class GameRotationIndicator extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.currentPiece = null;
        this.currentPos = null;
        this.color;
        this.renderer;
    }

    async connectedCallback() {
        try{

            const [htmlResponse, cssResponse] = await Promise.all([fetch("/components/game-rotation-indicator/game-rotation-indicator.html"),
                fetch("/components/game-rotation-indicator/game-rotation-indicator.css"),]);

            const html = await htmlResponse.text();
            const css = await cssResponse.text();

            this.shadowRoot.innerHTML = `
                <style>${css}</style>
                ${html}
            `;

            const rotationDiv = this.shadowRoot.querySelector('#rotate-indicator');

            this.renderer = new RotationRenderer(rotationDiv);
            this._setupListeners();
        }catch(err){
            console.error("Error while loading the component:", err);
        }
    }

    async showPiece(piece,pos) {
        this.currentPiece = piece;
        this.currentPos = pos;
        this.style.display= "block";
        this.active=true;
        await this.renderer.drawRotationIndicator(piece);
    }

    set active(active) {
        if (active) {
            this.shadowRoot.querySelector('#rotate-indicator').classList.remove("inactive");
            this.style.display = "block";
        } else {
            this.shadowRoot.querySelector('#rotate-indicator').classList.add("inactive");
            this.style.display = "none";
            this.currentPiece = null;
            this.currentPos = null;
        }
    }
    set owner(owner){
        if (this._owner) {
            throw new Error("Cannot reassign 'owner'");
        }
        this._owner = owner;
    }

    _setupListeners() {
        this.shadowRoot.querySelector("#left-button").onclick = (event) => {
            console.log("button left clicked");
            event.stopPropagation();
            this._dispatchRotation("left");
        };
        this.shadowRoot.querySelector("#right-button").onclick = (event) => {
            console.log("button right clicked");
            event.stopPropagation();
            this._dispatchRotation("right");
        };
    }

    _dispatchRotation(direction) {
        if (!this.currentPiece) return;

        this.dispatchEvent(new CustomEvent("game-rotation", {
            detail: {
                type: GamePageActionType.CLICKED_ROTATE_ARROW,
                payload: {
                    piece: this.currentPiece,
                    pos: this.currentPos,
                    rotation: direction
                }
            },
            bubbles: true,
            composed: true
        }));
    }
}
customElements.define('game-rotation-indicator', GameRotationIndicator);