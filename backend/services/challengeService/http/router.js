const { Router } = require('../helpers/router');
const { authenticated } = require('../helpers/middlewares');

const {
    handleCreateChallenge,
    handleListIncomingChallenges,
    handleAcceptChallenge,
    handleDeclineChallenge,
    handleCancelChallenge,
} = require('./handler');


const ROUTER = (new Router()
    .add('/api/challenge-service/challenges', {
        POST: authenticated(handleCreateChallenge),
    })
    .add('/api/challenge-service/challenges/incoming', {
        GET: authenticated(handleListIncomingChallenges),
    })
    .add('/api/challenge-service/challenges/:challengeId/accept', {
        POST: authenticated(handleAcceptChallenge),
    })
    .add('/api/challenge-service/challenges/:challengeId/decline', {
        POST: authenticated(handleDeclineChallenge),
    })
    .add('/api/challenge-service/challenges/:challengeId/cancel', {
        POST: authenticated(handleCancelChallenge),
    })
);

exports.manage = async (req, res) => {
    await ROUTER.handle(req, res);
};
