const ActionIA = {
    rotate(cell, direction) {
        return {
            action: "ROTATE",
            cell,
            result: direction // "CLOCKWISE" | "ANTICLOCKWISE"
        };
    },

    move(from, to) {
        return {
            action: "MOVE",
            cell: from,
            result: to
        };
    },

    place(fromReserveCell, destination, orientation) {
        return {
            action: "PLACE",
            cell: fromReserveCell,
            result: {
                destination,
                orientation
            }
        };
    },

    exchange(scarabCell, targetCell) {
        return {
            action: "EXCHANGE",
            cell: scarabCell,
            result: targetCell
        };
    }
};

const ACTIONS = {
    move : (boardManager,{args}) => {
        const {fromX,fromY,toX,toY} = args;
        console.log(args)
        return boardManager.movePiece(fromX, fromY, toX, toY);
    },
    switch : (boardManager,{args}) => {
        const {fromX,fromY,toX,toY} = args;
        return boardManager.switch(fromX,fromY,toX,toY);
    },
    place : (boardManager,{args}) => {
        return boardManager.placePiece(args);
    },
    rotate : (boardManager,{args}) => {
        const { x, y, turns } = args;
        return boardManager.rotatePiece(x,y,turns);
    }
}

module.exports = ACTIONS;
