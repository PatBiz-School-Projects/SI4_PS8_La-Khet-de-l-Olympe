export class InventoryRenderer {
    static SLOTS_ROW_LEN = 3;
    static SLOTS_COL_LEN = 5;

    /**
     * @param {HTMLDivElement} inventoryDiv
     */
    constructor(inventoryDiv) {
        /** @private @type {HTMLDivElement} */
        this.inventoryDiv = inventoryDiv;

        /** @private @type {Record<string, HTMLCanvasElement>} */
        this.canvases = {
            "slots-canvas":  inventoryDiv.querySelector("#slots-canvas"),
            "pieces-canvas": inventoryDiv.querySelector("#pieces-canvas"),
        };

        /** @private @type {Record<string, HTMLImageElement>} */
        this.imageCache = {};
    }

    /** @private @type {number} */
    get inventoryWidth() {
        return parseFloat(getComputedStyle(this.inventoryDiv).width);
    }

    /** @private @type {number} */
    get inventoryHeight() {
        return parseFloat(getComputedStyle(this.inventoryDiv).height);
    }

    /** @private @type {number} */
    get slotSize() {
        return Math.min(
            this.inventoryWidth  / InventoryRenderer.SLOTS_ROW_LEN,
            this.inventoryHeight / InventoryRenderer.SLOTS_COL_LEN,
        );
    }

    /**
     * @private
     *
     * Converts a flat slot index to its (x, y) pixel origin (top-left corner).
     *
     * @param {number} slotIdx
     *
     * @returns {{ x: number, y: number }}
     */
    _slotOrigin(slotIdx) {
        const col = slotIdx % InventoryRenderer.SLOTS_ROW_LEN;
        const row = Math.floor(slotIdx / InventoryRenderer.SLOTS_ROW_LEN);
        return {
            x: col * this.slotSize,
            y: row * this.slotSize,
        };
    }

    /**
     * Sets the canvases resolution to match the inventory's dimensions.
     */
    setCanvasesResolution() {
        Object.values(this.canvases).forEach(canvas => {
            canvas.width  = this.inventoryWidth;
            canvas.height = this.inventoryHeight;
        });
    }

    /**
     * @private
     *
     * @param {string} src
     *
     * @returns {Promise<HTMLImageElement>}
     */
    async _getImage(src) {
        let img = this.imageCache[src];
        if (img !== undefined) return img;

        img = new Image();
        this.imageCache[src] = img;

        return new Promise((resolve, reject) => {
            img.onload  = () => resolve(img);
            img.onerror = () => {
                delete this.imageCache[src];
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        });
    }


    ////////////////////////////////////////////////////////////////////////////
    // #slots-canvas
    ////////////////////////////////////////////////////////////////////////////

    async clearSlotsCanvas() {
        const ctx = this.canvases["slots-canvas"].getContext("2d");
        ctx.clearRect(0, 0, this.inventoryWidth, this.inventoryHeight);
    }

    /**
     * Draws an empty slot border/background at the given index.
     *
     * @param {number} slotIdx
     */
    async drawEmptySlotAt(slotIdx) {
        const ctx = this.canvases["slots-canvas"].getContext("2d");
        const { x, y } = this._slotOrigin(slotIdx);
        const size = this.slotSize;

        // Slot background
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(x, y, size, size);

        // Slot border
        ctx.strokeStyle = "#e5dec4";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
    }


    ////////////////////////////////////////////////////////////////////////////
    // #pieces-canvas
    ////////////////////////////////////////////////////////////////////////////

    async clearPiecesCanvas() {
        const ctx = this.canvases["pieces-canvas"].getContext("2d");
        ctx.clearRect(0, 0, this.inventoryWidth, this.inventoryHeight);
    }

    /**
     * Clears the piece drawn at the given slot index.
     *
     * @param {number} slotIdx
     */
    async clearPieceAt(slotIdx) {
        console.log("Efface maintenant");
        const ctx = this.canvases["pieces-canvas"].getContext("2d");
        const { x, y } = this._slotOrigin(slotIdx);
        ctx.clearRect(x, y, this.slotSize, this.slotSize);
    }

    /**
     * Draws a piece (with its orientation) at the given slot index.
     *
     * @param {Piece}  piece
     * @param {number} slotIdx
     */
    async drawPieceAt(piece, slotIdx) {
        const ctx = this.canvases["pieces-canvas"].getContext("2d");

        const pieceOffset = {
            "Pyramid": -Math.PI / 2,
            "Scarab": -Math.PI / 2,
            "Anubis": Math.PI,
            "Sphinx": Math.PI,
            "Pharaoh": Math.PI
        };

        const baseRotation = pieceOffset[piece.type] || Math.PI;


        const angleMap = {
            N:  baseRotation,
            W: -Math.PI / 2 +baseRotation,
            E:  Math.PI / 2 +baseRotation,
            S:  Math.PI +baseRotation,
        };

        const img    = await this._getImage(piece.image);
        const { x, y } = this._slotOrigin(slotIdx);
        const size   = this.slotSize;
        const angle  = angleMap[piece.orientation] ?? 0;

        // Padding so the piece doesn't fill the entire slot
        const padding = size * 0.1;
        const drawSize = size - padding * 2;

        // Rotate around the center of the slot
        const cx = x + size / 2;
        const cy = y + size / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.drawImage(img, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        ctx.restore();
    }


    ////////////////////////////////////////////////////////////////////////////
    // #inventory
    ////////////////////////////////////////////////////////////////////////////

    async clearInventory() {
        await this.clearSlotsCanvas();
        await this.clearPiecesCanvas();
    }

    async drawEmptyInventory() {
        await this.clearInventory();

        const total = InventoryRenderer.SLOTS_ROW_LEN * InventoryRenderer.SLOTS_COL_LEN;
        for (let idx = 0; idx < total; idx++) {
            await this.drawEmptySlotAt(idx);
        }
    }

    /**
     * @param {(Piece|null)[]} inventory
     */
    async drawInventory(inventory) {
        await this.clearInventory();

        for (let idx = 0; idx < inventory.length; idx++) {
            await this.drawEmptySlotAt(idx);

            const piece = inventory[idx];
            if (piece) {
                await this.drawPieceAt(piece, idx);
            }
        }
    }
}
