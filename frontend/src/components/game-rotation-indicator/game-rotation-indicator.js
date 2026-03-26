import {RotationRenderer} from "./RotationRenderer.js";
import {GamePageActionType} from "../../pages/game-page/GamePageStateMachine/GamePageAction.js";
import {Piece} from "../game-board/Piece.js";

export class GameRotationIndicator extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.currentPiece = null;
        this.currentPos = null;
        this.color;
        this.renderer;
        this.mode = 'board';
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

    async showPiece(piece,pos=null,mode='board') {
        this.currentPiece = piece;
        this.currentPos = pos;
        this.mode = mode;
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
            // DEBUG::
            console.log("Clicked on left rotation button");

            event.stopPropagation();
            this._dispatchRotation("left");
        };
        this.shadowRoot.querySelector("#right-button").onclick = (event) => {
            // DEBUG::
            console.log("Clicked on right rotation button");

            event.stopPropagation();
            this._dispatchRotation("right");
        };
    }

    _rotatePieceLocally(direction){
        const orientations = ["N", "E", "S", "W"];
        let idx = orientations.indexOf(this.currentPiece.orientation || "N");

        if (direction === "left") {
            idx = (idx - 1 + 4) % 4;
        } else {
            idx = (idx + 1) % 4;
        }
        const newOrientation = orientations[idx];

        const pieceDTO = {
            type: this.currentPiece.type,
            owner: this.currentPiece.owner,
            color: this.currentPiece.color,
            orientation: newOrientation
        };

        this.currentPiece= Piece.fromDTO(pieceDTO);
    }

    async _dispatchRotation(direction) {
        if (!this.currentPiece) return;

        if (this.mode === 'board') {
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
        } else if (this.mode === 'inventory') {
            this._rotatePieceLocally(direction);
            await this.renderer.drawRotationIndicator(this.currentPiece);
        }

    }
}
customElements.define('game-rotation-indicator', GameRotationIndicator);
