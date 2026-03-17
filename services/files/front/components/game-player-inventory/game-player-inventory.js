import { Piece } from "../game-board/Piece.js";

import { InventoryRenderer } from "./InventoryRenderer.js";
import {GamePageActionType} from "../../pages/game-page/GamePageStateMachine/GamePageAction.js";


export class GamePlayerInventory extends HTMLElement {
    static MAX_SIZE = 15;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        /** @private @type {(Piece|null)[]} */
        this._inventory = [];
        for (let i=0; i<this.MAX_SIZE; i++) {
            this._inventory[i] = null;
        }

        /** @private @type {string} */
        this._owner;
        /** @private @type {"red"|"blue"} */
        this._color;
        /** @private @type {InventoryRenderer} */
        this.renderer;
    }

    /**
     * Called when the web component is added to the DOM.
     */
    async connectedCallback() {
        try {
            // Load the component's HTML template & CSS style

            const [htmlResponse, cssResponse] = await Promise.all([
                fetch("/components/game-player-inventory/game-player-inventory.html"),
                fetch("/components/game-player-inventory/game-player-inventory.css"),
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

        /** @type {HTMLDivElement} */
        const inventoryDiv = this.shadowRoot.querySelector('#inventory');
        this.renderer = new InventoryRenderer(inventoryDiv);

        this.renderer.setCanvasesResolution();

        inventoryDiv.addEventListener('click', (event) => {

            const hasAvailablePyramid = this._inventory.some(piece => piece !== null);

            if (hasAvailablePyramid && !inventoryDiv.classList.contains("inactive")) {
                event.stopPropagation();
                this._onPyramidClicked();
            }
        });
    }

    /** @type {string} */
    get owner() {
        return this._owner;
    }
    set owner(owner) {
        if (this.owner) {
            throw new Error("Cannot reassign 'owner'");
        }
        this._owner = owner;
    }

    /** @type {"red"|"blue"}  */
    get color() {
        return this._color;
    }
    set color(color) {
        if (this.color) {
            throw new Error("Cannot reassign 'color'");
        }
        this._color = color;
    }

    /** @param {boolean} val  */
    set active(active) {
        if (active) {
            this.shadowRoot.querySelector('#inventory').classList.remove("inactive");
        } else {
            this.shadowRoot.querySelector('#inventory').classList.add("inactive");
        }
    }

    /**
     * @param {number} slotIdx
     *
     * @returns {boolean}
     */
    hasPyramidAt(slotIdx) {
        return 0 < slotIdx && slotIdx < this._inventory.filter(p => p).length;
    }

    /**
     * @param {number} slotIdx
     *
     * @throws if there is no pyramid at this slot
     */
    getPyramidAt(slotIdx) {
        return this._inventory[slotIdx];
    }

    async actualise() {
        const inventoryResponse = await fetch("/api/game-service/inventory", {
            method: "POST", // Just bcs GET request cannot have a body
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId: this._owner }),
        });
        const { inventory } = await inventoryResponse.json();

        for (let i=0; i<GamePlayerInventory.MAX_SIZE; i++) {
            this._inventory[i] = (
                (inventory[i])
                ? Piece.fromDTO(inventory[i])
                : null
            );
        }

        await this.renderer.drawInventory(this._inventory);
    }

    async pushPyramid() {
        const endIdx = this._inventory.filter(e => e).length;
        if (endIdx >= this.MAX_SIZE) {
            throw new Error("Inventory is already full");
        }

        const pyramid = Piece.fromDTO({
            type: "Pyramid",
            owner: this._owner,
            orientation: "N",
            color: this.color,
        });
        this._inventory.push(pyramid);

        // TODO : To test (& probaly fix)
        // await this.renderer.drawPieceAt(pyramid, endIdx);

        await this.actualise();
    }

    async popPyramid() {
        const endIdx = this._inventory.filter(e => e).length;
        if (endIdx <= 0) {
            throw new Error("Inventory is already empty");
        }
        const lastIdx = endIdx -1;

        this._inventory[lastIdx] = null;

        await this.renderer.clearPieceAt(lastIdx);

        await this.actualise(); // RACE CONDITION NEED TO FIX
    }

    _onPyramidClicked() {


        console.log("Inventory clicked");

        const pyramidPiece = Piece.fromDTO({
            type: "Pyramid",
            owner: this.owner,
            orientation: "N",
            color: this.color
        });

        this.dispatchEvent(new CustomEvent("inventory-click", {
            detail: {
                type: GamePageActionType.CLICKED_PIECE_IN_INVENTORY,
                payload: {
                    piece: pyramidPiece,
                    pos: null
                }
            },
            bubbles: true,
            composed: true
        }));
    }
}
customElements.define('game-player-inventory', GamePlayerInventory);
