const { Router } = require('../helpers/router');
const {
    handleCreateChallenge,
    handleListIncomingChallenges,
    handleListOutgoingChallenges,
    handleGetChallenge,
    handleAcceptChallenge,
    handleDeclineChallenge,
    handleCancelChallenge,
} = require('./handler');

const ROUTER = new Router()
    .add('/api/challenge-service/challenges', {
        POST: handleCreateChallenge,
    })
    .add('/api/challenge-service/challenges/incoming', {
        GET: handleListIncomingChallenges,
    })
    .add('/api/challenge-service/challenges/outgoing', {
        GET: handleListOutgoingChallenges,
    })
    .add('/api/challenge-service/challenges/:challengeId', {
        GET: handleGetChallenge,
    })
    .add('/api/challenge-service/challenges/:challengeId/accept', {
        POST: handleAcceptChallenge,
    })
    .add('/api/challenge-service/challenges/:challengeId/decline', {
        POST: handleDeclineChallenge,
    })
    .add('/api/challenge-service/challenges/:challengeId/cancel', {
        POST: handleCancelChallenge,
    });

exports.manage = async (req, res) => {
    await ROUTER.handle(req, res);
};
