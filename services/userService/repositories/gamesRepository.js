const {getDb} = require('./mongo');

async function getGamesCollection() {
    const db = await getDb();
    return db.collection('games');
}

async function createGame(matchRecord) {
    const games = await getGamesCollection();
    return games.insertOne({
        ...matchRecord,
        createdAt: new Date(),
    });
}

async function findGameById(gameId) {
    const games = await getGamesCollection();
    return games.findOne({ gameId });
}

module.exports = {
    createGame,
    findGameById,
}

