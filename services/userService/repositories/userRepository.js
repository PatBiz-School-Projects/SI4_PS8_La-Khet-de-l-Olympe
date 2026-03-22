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

module.exports = {
    findUserByAuthId,
    createUser
};
