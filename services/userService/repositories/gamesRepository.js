const {getDb} = require('./mongo');

async function getGamesCollection() {
    const db = await getDb();
    return db.collection('games');
}

async function createGame({winnerId,loserId,oldEloW,oldEloL,newEloW,newEloL}) {
    const games = await getGamesCollection();
    return games.insertOne({
        winnerId:winnerId,
        loserId:loserId,
        oldEloW:oldEloW,
        oldEloL:oldEloL,
        newEloW:newEloW,
        newEloL:newEloL,
        createdAt:new Date(),
    });
}

async function findGameById(gameId) {
    const games = await getGamesCollection();
    return games.findOne({ _id: gameId });
}

module.exports = {
    createGame,
    findGameById,
}

