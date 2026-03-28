
const { prepareChallengeMatch, acceptChallengeMatch } = require('./gameClient');

const pendingChallenges = new Map();

function challengeKey(challengerUserId, targetUserId) {
    return `${challengerUserId}->${targetUserId}`;
}

async function createChallenge({ challengerUserId, targetUserId, cookieHeader }) {
    if (challengerUserId === targetUserId) {
        throw new Error('CANNOT_SELF_CHALLENGE');
    }

    const reciprocalKey = challengeKey(targetUserId, challengerUserId);
    const reciprocalChallenge = pendingChallenges.get(reciprocalKey);

    if (reciprocalChallenge) {
        const { gameId, createdAt } = reciprocalChallenge;
        const { playerId } = await acceptChallengeMatch(gameId, cookieHeader);

        pendingChallenges.delete(reciprocalKey);

        return {
            challengerUserId,
            targetUserId,
            gameId,
            playerId,
            createdAt,
            status: 'ACCEPTED',
        };
    }

    const existingChallengeKey = challengeKey(challengerUserId, targetUserId);
    const existingChallenge = pendingChallenges.get(existingChallengeKey);
    if (existingChallenge) {
        return {
            ...existingChallenge,
            status: 'PENDING',
        };
    }

    const { gameId, playerId } = await prepareChallengeMatch(cookieHeader);

    const challenge = {
        challengerUserId,
        targetUserId,
        gameId,
        playerId,
        createdAt: new Date().toISOString(),
    };

    pendingChallenges.set(existingChallengeKey, challenge);

    return {
        ...challenge,
        status: 'PENDING',
    };
}

module.exports = {
    createChallenge,
};
