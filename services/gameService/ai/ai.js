const { PlayerID } = require("../Player");

const { Board } = require("../entities/board");
const { Inventory } = require("../entities/inventory");
const { Piece } = require("../entities/piece");
const {LaserService} = require("../manager/laserService");


const AIActionGenerator = {
    move: (playerId, piece, from, to) => ({
        method: "move",
        args: {
            playerId,
            piece: piece.toDTO(),
            from,
            to,
        },
    }),
    place: (playerId, piece, pos) => ({
        method: "place",
        args: {
            playerId,
            piece: piece.toDTO(),
            pos,
        },
    }),
    rotate: (playerId, piece, pos, rotation) => ({
        method: "rotate",
        args: {
            playerId,
            piece: piece.toDTO(),
            pos,
            rotation,
        },
    }),
    switch: (playerId, piece1, pos1, piece2, pos2) => ({
        method: "switch",
        args: {
            playerId,
            piece1: piece1.toDTO(),
            pos1,
            piece2: piece2.toDTO(),
            pos2,
        },
    }),
}


/**
 * @abstract
 */
class AI {
    constructor(playerId, board, inventory) {
        /** @private @type {PlayerID} */
        this._playerId = playerId;

        /** @private @type {Board} */
        this._board = board;

        /** @private @type {Inventory} */
        this._inventory = inventory;
    }

    /**
     * @protected
     */
    _getLegalActions(playerId, board, inventory) {
        const computeOrthogonalNeighbourPositions = (pos) => [
            {x:pos.x+1, y:pos.y},
            {x:pos.x, y:pos.y+1},
            {x:pos.x-1, y:pos.y},
            {x:pos.x, y:pos.y-1},
        ];

        const isWithinBounds = (p) => p.x >= 0 && p.x < Board.GRID_LEN && p.y >= 0 && p.y < Board.GRID_LEN;

        const ret = [];

        let scarab, scarabPos;
        let sphinx, sphinxPos;
        let pharaoh, pharaohPos;

        for (let x=0; x<Board.GRID_LEN; x++) {
            for (let y=0; y<Board.GRID_LEN; y++) {
                const pos = {x, y};
                if (board.hasPieceAt(pos)) {
                    const piece = board.getPieceAt(pos);
                    if (piece.owner === playerId) {
                        if (piece.canMove()) {
                            computeOrthogonalNeighbourPositions(pos)
                                .filter(npos => isWithinBounds(npos) && !board.hasPieceAt(npos))
                                .forEach(npos => ret.push(AIActionGenerator.move(playerId, piece, pos, npos)));
                        }

                        if (piece.canRotate()) {
                            for (const rotation of ["left","right"]) {
                                ret.push(AIActionGenerator.rotate(playerId, piece, pos, rotation));
                            }
                        }

                        switch (piece.type) {
                            case "Scarab":
                                scarab = piece;
                                scarabPos = pos;
                                break;
                            case "Sphinx":
                                sphinx = piece;
                                sphinxPos = pos;
                                break;
                            case "Pharaoh":
                                pharaoh = piece;
                                pharaohPos = pos;
                                break;
                        }
                    }
                } else if (
                    !inventory.isEmpty()
                    && computeOrthogonalNeighbourPositions(pos).filter(isWithinBounds).every(npos => {
                        if (board.hasPieceAt(npos)) {
                            const npiece = board.getPieceAt(npos);
                            if (npiece.type === "Sphinx") {
                                return false;
                            }
                            if (npiece.type === "Pharaoh" && npiece.owner === playerId) {
                                return false
                            }
                        }
                        return true;
                    })
                ) {
                    for (const orientation of ["N", "E", "W", "S"]) {
                        const piece = Piece.fromDTO({
                            type: "Pyramid",
                            owner: playerId,
                            color: inventory.color,
                            orientation: orientation,
                        });
                        ret.push(AIActionGenerator.place(playerId, piece, pos));
                    }
                }
            }
        }

        ret.push(AIActionGenerator.switch(playerId, scarab, scarabPos, sphinx, sphinxPos));
        ret.push(AIActionGenerator.switch(playerId, scarab, scarabPos, pharaoh, pharaohPos))

        return ret;
    }

    /**
     * @abstract
     */
    computeNextAction() { throw new Error("Not implemented"); }
}


class RandomAI extends AI {
    constructor(playerId, board, inventory) {
        super(playerId, board, inventory)
    }

    computeNextAction() {
        const legalActions = this._getLegalActions(this._playerId,this._board,this._inventory);
        return legalActions[Math.floor(Math.random() * legalActions.length)];
    }
}


class MiniMaxAI extends AI {
    constructor(playerId, board, inventory, opponentInventory,opponentId) {
        super(playerId, board, inventory);
        this._opponentInventory = opponentInventory;
        this._opponentId = opponentId;
        this._maxDepth = 2;
    }

    computeNextAction() {
        let bestScore = -Infinity;
        let bestAction = null;

        const board = this._board;
        const myInventory = this._inventory;
        const opponentInventory = this._opponentInventory;

        console.log("MINIMAX COMMENCE À RÉFLÉCHIR...");
        const legalActions = this._getLegalActions(this._playerId,this._board,this._inventory);

        const simulatedLaserService = new LaserService(this._board);
        for(const action of legalActions) {

            this._applyAction(board,myInventory,action);
            const  result = this._simulateFireLaser(simulatedLaserService, board, myInventory, opponentInventory,this._playerId);
            let pharaohDead = result.pharaohDead;
            const pieceDestroyed = result.destroyedLog;
            let score = this._minimax(board, myInventory,opponentInventory,simulatedLaserService, this._maxDepth - 1, -Infinity, Infinity, false,pharaohDead);


            this._undoLaser(board, myInventory, opponentInventory,pieceDestroyed, this._playerId);
            this._undoAction(board,myInventory,action);


            if (score > bestScore) {
                bestScore = score;
                bestAction = action;
            }

        }
        console.log("MINIMAXAI : ",bestAction);
        return bestAction || legalActions[0];
    }


    _undoAction(board, inventory, action) {
        const { method, args } = action;


        switch (method) {
            case "move":
                const piece = board.getPieceAt(args.to);
                board.movePiece(piece, args.to, args.from);
                break;

            case "rotate":
                const pieceToRotate = board.getPieceAt(args.pos);
                const inverseRotation = args.rotation === "left" ? "right" : "left";
                board.rotatePiece(pieceToRotate, args.pos, inverseRotation);
                break;

            case "switch":
                const piece1 = board.getPieceAt(args.pos1);
                const piece2 = board.getPieceAt(args.pos2);
                board.switchPieces(piece1, args.pos1, piece2, args.pos2);
                break;

            case "place":
                board.removePiece(args.pos);
                inventory.pushPyramid();
                break;
        }
    }

    _undoLaser(board, myInv,oppInv, destroyedPiecesLog,currentPlayerId) {
        for (const record of destroyedPiecesLog) {

            board.putPiece(record.piece, record.pos);

            if (record.piece.type === "Pharaoh") {

                board.setPharaohByOwner(record.piece.owner, {x: record.pos.x, y: record.pos.y, orientation: record.piece.orientation});
            }
            if (record.piece.type === "Pyramid") {
                if (record.piece.owner === this._playerId) {
                    myInv.popPyramid();
                } else {
                    oppInv.popPyramid();
                }
            }
        }
    }

    _applyAction(simulatedBoard,simulatedInventory,action){
        const { method, args } = action;

        switch (method) {
            case "move":
                const piece = simulatedBoard.getPieceAt(args.from);
                simulatedBoard.movePiece(piece, args.from, args.to);
                break;

            case "rotate":
                const pieceToRotate = simulatedBoard.getPieceAt(args.pos);
                simulatedBoard.rotatePiece(pieceToRotate, args.pos, args.rotation);
                break;

            case "switch":

                const p1 = simulatedBoard.getPieceAt(args.pos1);
                const p2 = simulatedBoard.getPieceAt(args.pos2);
                simulatedBoard.switchPieces(p1, args.pos1, p2, args.pos2);
                break;

            case "place":
                const newPiece = Piece.fromDTO(args.piece)
                simulatedBoard.placePiece(newPiece, args.pos);
                simulatedInventory.popPyramid();
                break;

            default:
                throw new Error(`[MiniMaxAI] Méthode d'action inconnue : ${method}`);
        }
    }

    _simulateFireLaser(simulatedLaserService,newBoard,myInv, oppInv,activePlayerId){

        let pharaohDead = false;
        const fakePlayer = { playerId: activePlayerId };

        const {destroyedPieces} = simulatedLaserService.fireLaser(fakePlayer);

        const destroyedLog = [];

        for (const piece of destroyedPieces) {

            const realPieceObj = newBoard.getPieceAt({x: piece.x, y: piece.y});

            destroyedLog.push({ pos: {x: piece.x, y: piece.y}, piece: realPieceObj });

            if(piece.type === "Pharaoh"){
                pharaohDead=true;
                newBoard.setPharaohByOwner(piece.owner,null);
            }
            if (piece.type === "Pyramid") {

                if (realPieceObj.owner === this._playerId) {
                    myInv.pushPyramid();
                } else {
                    oppInv.pushPyramid();
                }

            }
            newBoard.removePiece({x: piece.x, y: piece.y});
        }
        return {pharaohDead,destroyedLog};
    }

    _minimax(board,myInv,oppInv,laserService,depth,alpha,beta,isMaximizingPlayer,pharaohDead) {
        if (depth === 0 || pharaohDead) {
            return this._evaluateBoard(board);
        }

        if (isMaximizingPlayer) {
            let maxEval = -Infinity;
            const actions = this._getLegalActions(this._playerId, board, myInv);

            for (const action of actions) {

                this._applyAction(board, myInv, action);

                const result=this._simulateFireLaser(laserService,board,myInv, oppInv,this._playerId);
                const isDead = result.pharaohDead;
                const pieceDestroyed = result.destroyedLog;

                let evalScore = this._minimax(board, myInv,oppInv,laserService,depth - 1, alpha, beta, false,isDead);
                maxEval = Math.max(maxEval, evalScore);

                alpha = Math.max(alpha, evalScore);

                this._undoLaser(board, myInv, oppInv,pieceDestroyed, this._playerId);
                this._undoAction(board,myInv,action);
                if (beta <= alpha) break;
            }
            return maxEval;

        } else {

            let minEval = Infinity;
            const actions = this._getLegalActions(this._opponentId, board, oppInv);

            for (const action of actions) {

                this._applyAction(board, oppInv, action);

                const result=this._simulateFireLaser(laserService,board,myInv, oppInv,this._opponentId);
                const isDead = result.pharaohDead;
                const pieceDestroyed = result.destroyedLog;

                let evalScore = this._minimax(board, myInv,oppInv, laserService,depth - 1, alpha, beta, true,isDead);
                minEval = Math.min(minEval, evalScore);


                beta = Math.min(beta, evalScore);

                this._undoLaser(board, myInv, oppInv,pieceDestroyed, this._playerId);
                this._undoAction(board,oppInv,action);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    _evaluateBoard(board) { //normaliser le score
        let score = 0;
        if(!board.getPharaohByOwner(this._playerId)) return -100000;
        if (!board.getPharaohByOwner(this._opponentId)) return  +100000;
        for (let y = 0; y < Board.GRID_LEN; y++) {
            for (let x = 0; x < Board.GRID_LEN; x++) {
                const cell = board.grid[y][x];

                if (cell.content !== null) {

                    const piece = cell.content;
                    const multiplier = piece.owner === this._playerId ? 1 : -1;
                    score += this.getPieceValue(piece.type) * multiplier;

                    // score += this.getPiecePositionalValue(x, y, piece.type) * multiplier;
                }
            }
        }
        score += this.evaluatePosition(board,this._playerId) - this.evaluatePosition(board, this._opponentId);
        score += board.countPiecesByOwner(this._playerId) * 10;
        score -= board.countPiecesByOwner(this._opponentId) * 10;
        return score;
    }

    getPieceValue(type){
        switch (type) {
            case "Anubis": return 110;
            case "Pyramid": return 210;
            case "Scarab": return 260;
            case "Sphinx": return 10;
            case "Pharaoh": return 10;
            default: return 0;
        }
    }

    evaluatePosition(board,playerId){
        let score = 0;
        const king = board.getPharaohByOwner(playerId);

        if(king!=null){
            score += this.evaluateKingSafety(board,playerId,king);
        }

        return score;

    }

    evaluateKingSafety(board, playerId, king){ //facteur decroissant avec distance avec le roi et quel piece est autour
        let score = 0;
        const directions = [
            { dx: 1, dy: 0 }, { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }, { dx: 0, dy: -1 }
        ];

        for (const dir of directions) {
            const nx = king.x + dir.dx;
            const ny = king.y + dir.dy;

            if (nx >= 0 && nx < Board.GRID_LEN && ny >= 0 && ny < Board.GRID_LEN) {
                const cell = board.grid[ny][nx];
                if (cell.content !== null) {
                    if (cell.content.owner === playerId) {
                        score += 40;

                        if (cell.content.type === "Anubis") {
                            score += 30;
                        }
                    } else {
                        score -= 50;
                    }
                }
            }
        }
        return score;
    }
}

module.exports = { RandomAI, MiniMaxAI };



