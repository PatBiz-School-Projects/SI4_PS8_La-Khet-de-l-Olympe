/**
 * @typedef {Object} ELOUpdate
 *
 * @prop {number} oldELO
 * @prop {number} delta
 * @prop {number} newELO
 * @prop {number|undefined} streakBonus
 */
const ELOUpdate = undefined;


function computeELO(playerCurrELO, opponentCurrELO) {
    return 1 / (1 + 10 ** ((opponentCurrELO - playerCurrELO) / 400));
}


function streakBonus(winStreak = 0, cap = 36, smoothing = 4) {
    const normalizedStreak = Number.isFinite(winStreak) ? winStreak : 0;

    const s = Math.max(0, normalizedStreak);
    const h = Math.max(1, smoothing);

    return cap * (s*s) / (s*s + h*h);
}


/**
 * @param {number} winnerCurrELO
 * @param {number} loserCurrELO
 * @param {number} winnerWinStreak
 * @param {number} kFactor
 * @param {number} streakCap
 * @param {number} smoothing
 *
 * @returns {{ winner: ELOUpdate, loser: ELOUpdate }}
 */
function computeEloWithWinStreak(
    winnerId,
    winnerCurrELO,

    loserId,
    loserCurrELO,

    winnerWinStreak,
) {
    const kFactor = 24;
    const streakCap = 36;
    const smoothing = 4;

    // ELO without win streak bonus
    const winnerBaseELO = computeELO(winnerCurrELO, loserCurrELO);

    const baseDelta = kFactor * (1 - winnerBaseELO);
    const bonus = streakBonus(winnerWinStreak, streakCap, smoothing);

    const winnerDelta = Math.round(baseDelta + bonus);
    const loserDelta = -Math.round(baseDelta);

    return {
        [winnerId]: {
            oldELO: winnerCurrELO,
            delta: winnerDelta,
            newELO: winnerCurrELO + winnerDelta,
            streakBonus: bonus,
        },
        [loserId]: {
            oldELO: loserCurrELO,
            delta: loserDelta,
            newELO: loserCurrELO + loserDelta,
        },
    };
}


function computeEloOnDraw(player1Id, player1ELO, player2Id, player2ELO) {
    return {
        [player1Id]: {
            oldELO: player1ELO,
            delta: 0,
            newELO: player1ELO,
        },
        [player2Id]: {
            oldELO: player2ELO,
            delta: 0,
            newELO: player2ELO,
        },
    };
}

module.exports = {
    ELOUpdate,
    computeELO,
    computeEloWithWinStreak,
    computeEloOnDraw,
};
