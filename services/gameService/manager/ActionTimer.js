class ActionTimer {
    /** @readonly @type {number} */
    static TICK_INTERVAL = 250 // 0.25s
    /** @readonly @type {number} */
    static ACTION_MAX_DURATION = 2 * 60 * 1000 // 2min in ms

    constructor(game) {
        this.game = game;

        this._intervalId;
        this._timeoutId;
    }

    start() {
        this._stop()

        const startTimestamp = Date.now();

        this._intervalId = setInterval(() => {
            const elapsed = Date.now() - startTimestamp;
            const remainingTime = Math.max(0, ActionTimer.ACTION_MAX_DURATION - elapsed);

            this.game.players.forEach(player => {
                player.socket?.emit("action-timer-sync", {remainingTime});
            });
        }, ActionTimer.TICK_INTERVAL);

        this._timeoutId = setTimeout(() => {
            this._timeout();
        }, ActionTimer.ACTION_MAX_DURATION);
    }

    /**
     * @private
     */
    _timeout() {
        this.game.nextTurn();
    }

    /**
     * @private
     */
    _stop() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
        }
        if (this._timeoutId) {
            clearTimeout(this._timeoutId);
        }
    }
}

module.exports = { ActionTimer };
