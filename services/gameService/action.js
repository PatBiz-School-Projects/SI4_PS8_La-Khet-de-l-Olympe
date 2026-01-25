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
        return boardManager.movePiece(fromX, fromY, toX, toY);
    },
    switch : (boardManager,{args}) => {
        const {fromX,fromY,toX,toY} = args;
        return boardManager.switch(fromX,fromY,toX,toY);
    },
    place : (boardManager,{args}) => {
        console.log(boardManager)
        return boardManager.placePiece(args);
    }
}

module.exports = ACTIONS;
