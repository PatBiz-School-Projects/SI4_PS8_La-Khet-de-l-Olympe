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

        console.log("MINIMAX COMMENCE À RÉFLÉCHIR...");
        const legalActions = this._getLegalActions(this._playerId,this._board,this._inventory);
        for(const action of legalActions) {

            let simulatedBoard = this._cloneBoard(this._board);
            let simulatedInventory = this._cloneInventory(this._inventory);
            let simulatedOppInv = this._cloneInventory(this._opponentInventory);
            const simulatedLaserService = new LaserService(simulatedBoard);

            this._applyAction(simulatedBoard,simulatedInventory,action);
            let pharaohDead = this._simulateFireLaser(simulatedLaserService, simulatedBoard, simulatedOppInv,this._playerId);
            let score = this._minimax(simulatedBoard, simulatedInventory,simulatedOppInv, this._maxDepth - 1, -Infinity, Infinity, false,pharaohDead);

            if (score > bestScore) {
                bestScore = score;
                bestAction = action;
            }

        }
        console.log("MINIMAXAI : ",bestAction);
        return bestAction || legalActions[0];
    }

    _cloneBoard(originalBoard) {

        const newBoard = new Board(originalBoard._players);

        for (let x = 0; x < Board.GRID_LEN; x++) {
            for (let y = 0; y < Board.GRID_LEN; y++) {
                if (originalBoard.hasPieceAt({x, y})) {

                    const originalPiece = originalBoard.getPieceAt({x, y});
                    const pieceDTO = (typeof originalPiece.toDTO === 'function')
                        ? originalPiece.toDTO()
                        : originalPiece;

                    const clonedPiece = Piece.fromDTO(pieceDTO);

                    newBoard.putPiece(clonedPiece, {x, y});
                    const orientation = clonedPiece.orientation;
                    if (clonedPiece.type === "Sphinx") {
                        newBoard.setSphinxByOwner(clonedPiece.owner, {x, y,orientation});
                    } else if (clonedPiece.type === "Pharaoh") {
                        newBoard.setPharaohByOwner(clonedPiece.owner, {x, y,orientation});
                    }
                }
            }
        }

        return newBoard;
    }

    _cloneInventory(originalInventory){
        const newInventory = new Inventory(originalInventory.owner, originalInventory.color);
        newInventory.clear();
        for(let i =0;i<originalInventory.pyramidsCount;i++){
            newInventory.pushPyramid();
        }
        return newInventory;
    }

    _applyAction(simulatedBoard,simulatedInventory,action){
        const { method, args } = action;

        const realPiece = args.piece ? Piece.fromDTO(args.piece) : null;

        const realPiece1 = args.piece1 ? Piece.fromDTO(args.piece1) : null;
        const realPiece2 = args.piece2 ? Piece.fromDTO(args.piece2) : null;
        switch (method) {
            case "move":
                simulatedBoard.movePiece(realPiece, args.from, args.to);
                break;

            case "rotate":
                simulatedBoard.rotatePiece(realPiece, args.pos, args.rotation);
                break;

            case "switch":
                simulatedBoard.switchPieces(realPiece1, args.pos1, realPiece2, args.pos2);
                break;

            case "place":
                simulatedBoard.placePiece(realPiece, args.pos);
                simulatedInventory.popPyramid();
                break;

            default:
                throw new Error(`[MiniMaxAI] Méthode d'action inconnue : ${method}`);
        }
    }

    _simulateFireLaser(simulatedLaserService,newBoard,nonActiveInventory,activePlayerId){

        let pharaohDead = false;
        const fakePlayer = { playerId: activePlayerId };

        const {destroyedPieces} = simulatedLaserService.fireLaser(fakePlayer);
        for (const piece of destroyedPieces) {
            if(piece.type === "Pharaoh"){
                pharaohDead=true;
                newBoard.setPharaohByOwner(piece.owner,null);
            }
            if (piece.type === "Pyramid") {

                nonActiveInventory.pushPyramid();

            }
            newBoard.removePiece({x: piece.x, y: piece.y});
        }
        return pharaohDead;
    }

    _minimax(board,myInv,oppInv,depth,alpha,beta,isMaximizingPlayer,pharaohDead) {
        if (depth === 0 || pharaohDead) {
            return this._evaluateBoard(board);
        }

        if (isMaximizingPlayer) {
            let maxEval = -Infinity;
            const actions = this._getLegalActions(this._playerId, board, inventory);

            for (const action of actions) {
                const newBoard = this._cloneBoard(board);
                const newInv = this._cloneInventory(myInv);
                const simulatedOppInv = this._cloneInventory(oppInv);
                const newLaserService  = new LaserService(newBoard);

                this._applyAction(newBoard, newInv, action);

                let isDead =this._simulateFireLaser(newLaserService,newBoard,simulatedOppInv,this._playerId);

                let evalScore = this._minimax(newBoard, newInv,simulatedOppInv,depth - 1, alpha, beta, false,isDead);
                maxEval = Math.max(maxEval, evalScore);

                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break;
            }
            return maxEval;

        } else {

            let minEval = Infinity;
            const actions = this._getLegalActions(this._opponentId, board, oppInv);

            for (const action of actions) {
                const newBoard = this._cloneBoard(board);
                const newInv = this._cloneInventory(myInv);
                const newOppInv = this._cloneInventory(oppInv);
                const newLaserService  = new LaserService(newBoard);
                this._applyAction(newBoard, newOppInv, action);

                let isDead = this._simulateFireLaser(newLaserService,newBoard,newInv,this._opponentId);

                let evalScore = this._minimax(newBoard, newInv,newOppInv, depth - 1, alpha, beta, true,isDead);
                minEval = Math.min(minEval, evalScore);


                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    _evaluateBoard(board) {
        let score = 0;
        if(!board.getPharaohByOwner(this._playerId)) score -=100000;
        if (!board.getPharaohByOwner(this._opponentId)) score +=100000;
        score += this.evaluateMaterial(board,this._playerId) - this.evaluateMaterial(board, this._opponentId);
        score += this.evaluatePosition(board,this._playerId) - this.evaluatePosition(board, this._opponentId);
        score += board.countPiecesByOwner(this._playerId) * 10;
        score -= board.countPiecesByOwner(this._opponentId) * 10;
        return score;
    }

    evaluateMaterial(board,playerId){
        let score = 0
        const materials =board.grid.flat().filter(cell=>cell.content !== null && cell.content.owner===playerId);
        for(const material of materials){
            switch (material.content.type){
                case "Anubis" : score += 100;
                                break;
                case "Pyramid" : score += 200;
                                break;
                case "Scarab" : score += 250;
                                break;

                case "Sphinx" : break;

                case "Pharaoh" : break;

                default : throw new Error("Unknown type of pieces");
            }
        }
        return score;
    }

    evaluatePosition(board,playerId){
        let score = 0;
        const king = board.getPharaohByOwner(playerId);

        if(king!=null){
            score += this.evaluateKingPosition(board,playerId,king);
        }

        return score;

    }

    evaluateKingPosition(board,playerId,king){ //facteur decroissant avec distance avec le roi et quel piece est autour
        let score = 0;
        const computeOrthogonalNeighbourPositions = (pos) => [
            {x:pos.x+1, y:pos.y},
            {x:pos.x, y:pos.y+1},
            {x:pos.x-1, y:pos.y},
            {x:pos.x, y:pos.y-1},
        ];

        const isWithinBounds = (p) => p.x >= 0 && p.x < Board.GRID_LEN && p.y >= 0 && p.y < Board.GRID_LEN;
        const orthogonalPosition = computeOrthogonalNeighbourPositions({x:king.x, y:king.y});

        orthogonalPosition.filter(pos=>isWithinBounds(pos)&&board.hasPieceAt(pos)&&board.getPieceAt(pos).owner===playerId)
            .forEach(()=> score += 40);
        return score;
    }
}

module.exports = { RandomAI, MiniMaxAI };



