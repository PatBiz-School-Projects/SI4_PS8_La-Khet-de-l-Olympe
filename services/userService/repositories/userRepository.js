const { getDb } = require('./mongo');
const User = require('../entities/user');
/** @type {User} */
async function findUserByAuthId(authId) {
    const usersCollection = await getUsersCollection();

    const plainUser = await usersCollection.findOne({ _id: authId });
    return User.builder(plainUser);
}

async function getUsersCollection() {
    const db = await getDb();
    return db.collection('users');
}

async function createUser(authId,username) {
    const usersCollection = await getUsersCollection();
    return usersCollection.insertOne({
        _id: authId,
        username,
        createdAt: new Date(),
        elo : 1000,
        profilePicture : 'img.png',
        ratedGames: 0,
        wins:0,
        losses:0,
        draws:0,
        winStreak: 0,
    });
}

async function updateWinnerElo(winnerId,newElo){
    const usersCollection = await getUsersCollection();
    return usersCollection.updateOne({_id: winnerId,},
        {
            $set: {elo: newElo},
            $inc: {
                wins:1,
                ratedGames:1,
                winStreak:1
            }
        });
}

async function updateLoserElo(loserId,newElo){
    const usersCollection = await getUsersCollection();
    return usersCollection.updateOne({_id: loserId,},
        {
            $set: {elo: newElo,winStreak:0},
            $inc: {
                losses:1,
                ratedGames:1
            }
        });
}

module.exports = {
    findUserByAuthId,
    createUser,
    updateWinnerElo,
    updateLoserElo
};
