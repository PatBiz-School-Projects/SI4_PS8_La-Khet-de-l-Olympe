const { Player } = require("../Player");

const { Piece, PieceOrientation } = require("../entities/piece");


class PieceColorizer {
    constructor (players) {
        /** @type {Player[]} */
        this._players = players;
    }

    colorize(piece) {
        if (piece.owner === this._players[0].playerId) {
            return { ...piece, color: "blue" };
        } else {
            return { ...piece, color: "red" };
        }
    }
}


class StartingPositions {
    constructor(players, boardSize = 10) {
        /** @type {Player[]} */
        this._players = players;

        // TODO : Replace the piece colorizer by a more in place solution
        this.pieceColorizer = new PieceColorizer(players);

        this.N = boardSize;
        if (this.N % 2 !== 0) throw new Error("Board size must be even for central symmetry.");
    }

    /**
     * Génère et place toutes les pièces sur le board (P1 + P2 par symétrie centrale).
     * @param {Board} board
     * @returns {any[]}
     */
    generateAndApply(board) {
        const piecesP1 = this._generateP1Pieces(board);
        const piecesP2 = piecesP1.map(p => this._mirrorPieceDto(p, this._players[1].playerId));

        // Place P1 puis P2 sur le board
        for (const dto of [...piecesP1, ...piecesP2]) {
            this._safeAdd(board, dto);
        }

        return [...piecesP1, ...piecesP2];
    }

    // -----------------------------
    // Génération P1 (validée)
    // -----------------------------

    _generateP1Pieces(board) {
        // 1) Sphinx P1
        const sphinx1 = this._placeSphinxP1(board);

        // Sphinx P2 (pour la contrainte "colonne du sphinx adverse")
        const sphinx2 = this._mirrorPieceDto(sphinx1, this._players[1].playerId);

        // 2) Pharaoh P1 (ligne 3, contraintes)
        const pharaoh1 = this._placePharaohP1(board, sphinx1, sphinx2);

        // 3) Anubis #1 (ligne 5, col pharaoh, face adversaire)
        const anubis1 = this._placeAnubis1P1(board, pharaoh1);

        // 4) Anubis #2 (ligne 3, col sphinx adverse, face adversaire)
        const anubis2 = this._placeAnubis2P1(board, sphinx2);

        // 5) Scarab (ligne 4 aléatoire, orientation aléatoire)
        const scarab1 = this._placeScarabP1(board);

        return [sphinx1, pharaoh1, anubis1, anubis2, scarab1];
    }

    _placeSphinxP1(board) {
        const x = 0; // first line
        const y = this._randInt(0, this.N - 1);

        this._assertFree(board, x, y, "Sphinx");

        const orientation = this._sphinxHorizontalOrientation(y);

        return { type: "Sphinx", owner: this._players[0].playerId, x, y, orientation };
    }

    _placePharaohP1(board, sphinx1, sphinx2) {
        const x = 2; // 3rd line (0-index)

        const forbiddenCols = new Set([0, this.N - 1, sphinx1.y, sphinx2.y]);

        const candidates = [];
        for (let y = 0; y < this.N; y++) {
            if (!forbiddenCols.has(y) && !board.hasPieceAt({x, y})) {
                candidates.push(y);
            }
        }
        if (candidates.length === 0) {
            throw new Error("No valid Pharaoh placement on line 3 (constraints too strict / occupied).");
        }

        const y = this._choice(candidates);

        // Orientation pas imposée par tes règles -> random
        return { type: "Pharaoh", owner: this._players[0].playerId, x, y, orientation: this._randOrientation() };
    }

    _placeAnubis1P1(board, pharaoh1) {
        const x = 4; // 5th line
        const y = pharaoh1.y;

        this._assertFree(board, x, y, "Anubis1");

        return { type: "Anubis", owner: this._players[0].playerId, x, y, orientation: "S" }; // face adversaire
    }

    _placeAnubis2P1(board, sphinx2) {
        const x = 2; // 3rd line
        const y = sphinx2.y;

        this._assertFree(board, x, y, "Anubis2");

        return { type: "Anubis", owner: this._players[0].playerId, x, y, orientation: "S" }; // face adversaire
    }

    _placeScarabP1(board) {
        const x = 3; // 4th line

        const candidates = [];
        for (let y = 0; y < this.N; y++) {
            if (!board.hasPieceAt({x, y})) {
                candidates.push(y);
            }
        }
        if (candidates.length === 0) throw new Error("No valid Scarab placement on line 4 (occupied).");

        const y = this._choice(candidates);

        return { type: "Scarab", owner: this._players[0].playerId, x, y, orientation: this._randOrientation() };
    }

    // -----------------------------
    // Pose sur le board
    // -----------------------------

    _safeAdd(board, pieceDto) {
        const piece = Piece.fromDTO(this.pieceColorizer.colorize(pieceDto));
        if (!piece) throw new Error("Invalid piece DTO: " + JSON.stringify(pieceDto));

        this._assertFree(board, pieceDto.x, pieceDto.y, pieceDto.type);

        board.putPiece(piece, {x: pieceDto.x, y: pieceDto.y});
    }

    _assertFree(board, x, y, name) {
        if (board.hasPieceAt({x, y})) {
            throw new Error(`${name} target cell {x:${x}, y:${y}} already occupied.`);
        }
    }

    // -----------------------------
    // Symétrie centrale (P2)
    // -----------------------------

    _mirrorPieceDto(pieceDtoP1, ownerP2) {
        const max = this.N - 1;
        const x = max - pieceDtoP1.x;
        const y = max - pieceDtoP1.y;

        return {
            type: pieceDtoP1.type,
            owner: ownerP2,
            x,
            y,
            orientation: this._mirrorOrientation180(pieceDtoP1.orientation),
        };
    }

    _mirrorOrientation180(o) {
        switch (o) {
            case "N": return "S";
            case "S": return "N";
            case "E": return "W";
            case "W": return "E";
            default: throw new Error("Invalid orientation: " + o);
        }
    }

    // -----------------------------
    // Sphinx orientation rule
    // -----------------------------

    _sphinxHorizontalOrientation(col) {
        const left = col;
        const right = (this.N - 1) - col;

        if (right > left) return "E";
        if (left > right) return "W";
        return Math.random() < 0.5 ? "E" : "W";
    }

    // -----------------------------
    // Random helpers
    // -----------------------------

    _randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    _choice(arr) {
        return arr[this._randInt(0, arr.length - 1)];
    }

    _randOrientation() {
        return this._choice(Object.values(PieceOrientation));
    }
}

module.exports = { StartingPositions };
