/**
 * @enum {typeof GameMode[keyof typeof GameMode]}
 */
export const GameMode = Object.freeze({
    SOLO: "SOLO",
    LOCAL_MULTIPLAYER: "LOCAL_MULTIPLAYER",
    MULTIPLAYER: "MULTIPLAYER",
});


/**
 * @typedef {string} PlayerID
 */
export const PlayerID = undefined;


/**
 * @typedef {Object} PlayerDTO
 *
 * @prop {PlayerID} playerId
 * @prop {UserID} userId
 * @prop {{
 *     username: string,
 *     profilePicture: string,
 *     elo: number,
 *     liveWinStreak: number,
 * }} profile
 */
export const PlayerDTO = undefined;
