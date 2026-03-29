const { randomUUID } = require('node:crypto');
const { prepareChallengeMatch, acceptChallengeMatch } = require('./gameClient');

const challenges = new Map();

let notifier = {
    notifyUser: () => {},
};

function setChallengeNotifier(nextNotifier) {
    notifier = nextNotifier || notifier;
}

function nowIso() {
    return new Date().toISOString();
}

function toDTO(challenge) {
    return {
        id: challenge.id,
        challengerUserId: challenge.challengerUserId,
        targetUserId: challenge.targetUserId,
        gameId: challenge.gameId,
        challengerPlayerId: challenge.challengerPlayerId,
        targetPlayerId: challenge.targetPlayerId,
        status: challenge.status,
        createdAt: challenge.createdAt,
        updatedAt: challenge.updatedAt,
    };
}

function getChallengeOrThrow(challengeId) {
    const challenge = challenges.get(challengeId);
    if (!challenge) {
        throw new Error('CHALLENGE_NOT_FOUND');
    }
    return challenge;
}

function ensurePending(challenge) {
    if (challenge.status !== 'PENDING') {
        throw new Error('INVALID_CHALLENGE_STATUS');
    }
}

function emitChallengeUpdate(challenge, targetEvent) {
    const payload = { challenge: toDTO(challenge) };
    notifier.notifyUser(challenge.challengerUserId, 'challenge:updated', payload);
    notifier.notifyUser(challenge.targetUserId, 'challenge:updated', payload);
    if (targetEvent) {
        if (targetEvent.toChallenger) {
            notifier.notifyUser(challenge.challengerUserId, targetEvent.toChallenger, payload);
        }
        if (targetEvent.toTarget) {
            notifier.notifyUser(challenge.targetUserId, targetEvent.toTarget, payload);
        }
    }
}

function findPendingBetween(challengerUserId, targetUserId) {
    return Array.from(challenges.values()).find((challenge) => (
        challenge.status === 'PENDING'
        && challenge.challengerUserId === challengerUserId
        && challenge.targetUserId === targetUserId
    ));
}

async function createChallenge({ challengerUserId, targetUserId, cookieHeader }) {
    if (challengerUserId === targetUserId) {
        throw new Error('CANNOT_SELF_CHALLENGE');
    }

    const existing = findPendingBetween(challengerUserId, targetUserId);
    if (existing) {
        return toDTO(existing);
    }

    const { gameId, playerId } = await prepareChallengeMatch(cookieHeader);

    const timestamp = nowIso();
    const challenge = {
        id: randomUUID(),
        challengerUserId,
        targetUserId,
        gameId,
        challengerPlayerId: playerId,
        targetPlayerId: null,
        status: 'PENDING',
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    challenges.set(challenge.id, challenge);
    emitChallengeUpdate(challenge, { toTarget: 'challenge:incoming' });

    return toDTO(challenge);
}

function listChallenges(userId, role) {
    return Array.from(challenges.values())
        .filter((challenge) => {
            if (challenge.status !== 'PENDING') {
                return false;
            }

            if (role === 'incoming') {
                return challenge.targetUserId === userId;
            }

            if (role === 'outgoing') {
                return challenge.challengerUserId === userId;
            }

            return challenge.challengerUserId === userId || challenge.targetUserId === userId;
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map(toDTO);
}


async function acceptChallenge({ challengeId, userId, cookieHeader }) {
    const challenge = getChallengeOrThrow(challengeId);
    if (challenge.targetUserId !== userId) {
        throw new Error('FORBIDDEN');
    }
    ensurePending(challenge);

    const { playerId } = await acceptChallengeMatch(challenge.gameId, cookieHeader);

    challenge.targetPlayerId = playerId;
    challenge.status = 'ACCEPTED';
    challenge.updatedAt = nowIso();

    emitChallengeUpdate(challenge, { toChallenger: 'challenge:accepted' });
    return toDTO(challenge);
}

function declineChallenge({ challengeId, userId }) {
    const challenge = getChallengeOrThrow(challengeId);
    if (challenge.targetUserId !== userId) {
        throw new Error('FORBIDDEN');
    }
    ensurePending(challenge);

    challenge.status = 'DECLINED';
    challenge.updatedAt = nowIso();

    emitChallengeUpdate(challenge, { toChallenger: 'challenge:declined' });
    return toDTO(challenge);
}

function cancelChallenge({ challengeId, userId }) {
    const challenge = getChallengeOrThrow(challengeId);
    if (challenge.challengerUserId !== userId) {
        throw new Error('FORBIDDEN');
    }
    ensurePending(challenge);

    challenge.status = 'CANCELLED';
    challenge.updatedAt = nowIso();

    emitChallengeUpdate(challenge, { toTarget: 'challenge:cancelled' });
    return toDTO(challenge);
}

module.exports = {
    setChallengeNotifier,
    createChallenge,
    listChallenges,
    acceptChallenge,
    declineChallenge,
    cancelChallenge,
};
