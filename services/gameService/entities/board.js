const {Player} = require('../Player');

const { Cell } = require('./cell');
const { Piece } = require('./piece');

const { StartingPositions } = require('../manager/startingPositions');


class Board {
    static GRID_LEN = 10;

    constructor(players) {
        /** @type {Player[]} */
        this._players = players;

        this.grid = [];

        for (let i = 0; i < Board.GRID_LEN; i++) {
            this.grid[i] = [];
            for (let j = 0; j < Board.GRID_LEN; j++) {
                this.grid[i][j] = new Cell(i, j, null);
            }
        }

        this.sphinxes = {};
        this.pharaohs = {};
    }

    init() {
        const sp = new StartingPositions(this._players, Board.GRID_LEN);
        sp.generateAndApply(this);

        this._findAndCacheSphinxes();
        this._findAndCachePharaohs();
    }

    _findAndCacheSphinxes() {
        for (let x = 0; x < Board.GRID_LEN; x++) {
            for (let y = 0; y < Board.GRID_LEN; y++) {
                if (this.hasPieceAt({x, y})) {
                    const piece = this.getPieceAt({x, y});
                    if (piece.type === "Sphinx") {
                        this.sphinxes[piece.owner] = {
                            x: x, y: y, orientation: piece.orientation
                        };
                    }
                }
            }
        }
    }

    _findAndCachePharaohs() {
        for (let x = 0; x < Board.GRID_LEN; x++) {
            for (let y = 0; y < Board.GRID_LEN; y++) {
                if (this.hasPieceAt({x, y})) {
                    const piece = this.getPieceAt({x, y});
                    if (piece.type === "Pharaoh") {
                        this.pharaohs[piece.owner] = {
                            x: x, y: y, orientation: piece.orientation
                        };
                    }
                }
            }
        }
    }


    toDTO() {
        return {
            grid: this.grid.map(
                row => row.map(
                    cell => (
                        cell.toDTO()
                    )
                )
            )
        };
    }


    /**
     * @param {{x: number, y: number}} pos
     *
     * @returns {boolean}
     */
    hasPieceAt(pos) {
        if (
            pos.x < 0 || Board.GRID_LEN <= pos.x
            || pos.y < 0 || Board.GRID_LEN <= pos.y
        ) {
            return false;
        }
        return !this.grid[pos.x][pos.y].isEmpty();
    }

    /**
     * @param {{x: number, y: number}} pos
     *
     * @returns {Piece}
     * @throws when there is no piece at the given position
     */
    getPieceAt(pos) {
        const piece = this.grid[pos.x][pos.y].content;
        if (!piece) {
            throw new Error(`No piece at {x:${pos.x}, y:${pos.y}}`);
        }

        return piece;
    }

    getSphinxByOwner(owner) {
        return this.sphinxes[owner];
    }

    setSphinxByOwner(owner, value) {
        this.sphinxes[owner] = value;
    }

    getPharaohByOwner(owner){
        return this.pharaohs[owner];
    }

    setPharaohByOwner(owner,value){
        this.pharaohs[owner] = value;
    }


    /** @alias  {@link addPiece()} */
    putPiece(piece, pos) {
        this.grid[pos.x][pos.y].put(piece);
    }
    /** @alias {@link putPiece()} */
    addPiece(piece, pos) {
        this.putPiece(piece, pos);
    }

    /** @alias  {@link removePiece()} */
    emptyCell(pos) {
        this.grid[pos.x][pos.y].empty();
    }
    /** @alias  {@link emptyCell()} */
    removePiece(pos) {
        this.emptyCell(pos);
    }

    clearPieces(){
        this.grid.flat().forEach(cell=>cell._content=null);
    }

    ////////////////////////////////////////////////////////////////////////////
    // Actions

    // All actions should have been validated before calling the following methods

    movePiece(_piece, from, to) {
        const piece = this.getPieceAt(from);

        this.emptyCell(from);
        this.putPiece(piece, to);
    }

    /**
     * @throws if a piece is already at the given position
     */
    placePiece(piece, pos) {
        // REVIEW : Shouldn't be needed as the action has been validated
        if (this.hasPieceAt(pos)) {
            throw new Error(`A piece is already at the desired position {x:${pos.x}, y:${pos.y}}`);
        }

        this.putPiece(piece, pos);
    }

    rotatePiece(_piece, pos, rotation) {
        const piece = this.getPieceAt(pos);
        piece.rotate(rotation);
        if (_piece.type === "Sphinx") {
            this.setSphinxByOwner(piece.owner,{x:pos.x,y:pos.y,orientation:piece.orientation})
        }
        if(_piece.type === "Pharaoh") {
            this.setPharaohByOwner(piece.owner,{x:pos.x,y:pos.y,orientation:piece.orientation})
        }
    }

    switchPieces(piece1, pos1, piece2, pos2) {
        if(piece2.type==="Sphinx"){
            this.setSphinxByOwner(piece2.owner, {x: pos1.x, y: pos1.y,orientation: piece2.orientation});
        }
        if(piece2.type==="Pharaoh"){
            this.setPharaohByOwner(piece2.owner, {x: pos1.x, y: pos1.y,orientation:piece2.orientation});
        }

        //NEEDED FOR AI
        if(piece1.type === "Sphinx"){
            this.setSphinxByOwner(piece1.owner, {x: pos2.x, y: pos2.y, orientation: piece1.orientation});
        }
        if(piece1.type === "Pharaoh"){
            this.setPharaohByOwner(piece1.owner, {x: pos2.x, y: pos2.y, orientation: piece1.orientation});
        }
        this.emptyCell(pos1);
        this.putPiece(piece2, pos1);

        this.emptyCell(pos2);
        this.putPiece(piece1, pos2);
    }

    countPiecesByOwner(playerId) {
        return this.grid.flat()
            .filter(cell => cell.content !== null && cell.content.owner === playerId)
            .length;
    }
}

module.exports = { Board };
