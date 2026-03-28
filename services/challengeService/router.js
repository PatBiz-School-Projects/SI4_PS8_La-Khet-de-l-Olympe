const { Router } = require('./helpers/router');
const { handleCreateChallenge } = require('./handler');

const ROUTER = new Router()
    .add('/api/challenge-service/challenges', {
        POST: handleCreateChallenge,
    });

exports.manage = async (req, res) => {
    await ROUTER.handle(req, res);
};
