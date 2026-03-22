function expectedScore(playerRating, opponentRating) {
    return 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
}

function streakBonus(winStreak, cap = 36, smoothing = 4) {
    const s = Math.max(0, winStreak);
    const h = Math.max(1, smoothing);

    return cap * (s * s) / (s * s + h * h);
}

function computeEloWithWinStreak({
                                     winnerRating,
                                     loserRating,
                                     winnerWinStreak,
                                     kFactor = 24,
                                     streakCap = 36,
                                     smoothing = 4,
                                 }) {
    const expectedWinner = expectedScore(winnerRating, loserRating);
    const baseDelta = kFactor * (1 - expectedWinner);
    const bonus = streakBonus(winnerWinStreak, streakCap, smoothing);

    const winnerDelta = Math.round(baseDelta + bonus);
    const loserDelta = -Math.round(baseDelta);

    return {
        winner: {
            oldRating: winnerRating,
            delta: winnerDelta,
            newRating: winnerRating + winnerDelta,
            streakBonus: bonus,
        },
        loser: {
            oldRating: loserRating,
            delta: loserDelta,
            newRating: loserRating + loserDelta,
        },
        /*meta: {
            expectedWinner,
            baseDelta,
            bonus,
            kFactor,
            streakCap,
            smoothing,
        },*/
    };
}

module.exports= {computeEloWithWinStreak};
