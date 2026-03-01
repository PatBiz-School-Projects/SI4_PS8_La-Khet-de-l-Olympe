const { PlayerID } = require("../Player");

const { Piece } = require("./piece");


class Inventory {
    static MAX_SIZE = 15;
    static INITIAL_SIZE = 7;

    constructor(owner) {
        /** @private @type {PlayerID} */
        this._owner = owner;

        /** @private @type {Piece[]} */
        this._pieces = [];
        for(let i=0; i<Inventory.INITIAL_SIZE; i++) {
            this.pushPyramid();
        }
    }

    get owner() {
        return this._owner;
    }

    toDTO() {
        const ret = [];
        for (let i=0; i<this._pieces.length; i++) {
            ret.push(this._pieces[i].toDTO());
        }
        return ret;
    }

    isEmpty() {
        return this._pieces.length === 0;
    }

    pushPyramid() {
        this._pieces.push(Piece.fromDTO({
            type: "Pyramid",
            owner: this._owner,
            orientation: "N",
        }));
    }

    /**
     * @throws if the inventory is empty
     */
    popPyramid() {
        if (this.isEmpty()) {
            throw new Error("The inventory is empty");
        }
        this._pieces.pop();
    }
}

module.exports = { Inventory };
