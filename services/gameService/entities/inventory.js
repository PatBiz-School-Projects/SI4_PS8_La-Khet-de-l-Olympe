const { PlayerID } = require("../Player");

const { Piece } = require("./piece");


class Inventory {
    static MAX_SIZE = 15;
    static INITIAL_SIZE = 7;

    constructor(owner, color) {
        /** @private @type {PlayerID} */
        this._owner = owner;

        /** @private @type {"red"|"blue"} */
        this._color = color;

        /** @private @type {Piece[]} */
        this._pieces = [];

        this._locked1 = 0; // Disponibles au prochain tour
        this._locked2 = 0; // Capturées à ce tour-ci

        for(let i=0; i<Inventory.INITIAL_SIZE; i++) {
            this.pushPyramid();
        }
    }

    get owner() {
        return this._owner;
    }

    get color() {
        return this._color;
    }

    get pyramidsCount(){
        return this._pieces.length;
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
            color: this._color,
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

    clear(){
        this._pieces = [];
    }

    pushLockedPyramid() {
        this._locked2++;
    }

    unlockPendingPyramids() {

        for (let i = 0; i < this._locked1; i++) {
            this.pushPyramid();
        }

        this._locked1 = this._locked2;
        this._locked2 = 0;
    }
}

module.exports = { Inventory };
