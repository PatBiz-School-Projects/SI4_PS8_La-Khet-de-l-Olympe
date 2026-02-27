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
