function expectedScore(playerRating, opponentRating) {
    return 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
}

function streakBonus(winStreak = 0, cap = 36, smoothing = 4) {
    const normalizedStreak = Number.isFinite(winStreak) ? winStreak : 0;
    const s = Math.max(0, normalizedStreak);
    const h = Math.max(1, smoothing);

    return cap * (s * s) / (s * s + h * h);
}

function computeEloWithWinStreak({
                                     winnerRating,
                                     loserRating,
                                     winnerWinStreak = 0,
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
    };
}

module.exports= {computeEloWithWinStreak};
