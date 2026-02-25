// CAUTION : This is a very minimal implementation to make the rest of the code works.

// TODO : Making a true `Player` class and a player manager

class Player {
    constructor(playerId) {
        this._playerId = playerId;
    }

    get playerId() {
        return this._playerId;
    }
}

module.exports = { Player };
