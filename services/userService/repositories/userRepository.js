const { getDb } = require('./mongo');
const User = require('../entities/user');
/** @type {User} */
async function findUserByAuthId(authId) {
    const usersCollection = await getUsersCollection();

    const plainUser = await usersCollection.findOne({ _id: authId });
    return User.builder(plainUser);
}

async function findUserByQuery(query,limit) {
    const usersCollection = await getUsersCollection();
     return usersCollection.find({
        username: {
            $regex: query,
            $options: 'i'
        }
    }).limit(limit).toArray();
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
        totalGames: 0,
        totalWins:0,
        totalLosses:0,
        totalDraws:0,
        winStreak: 0,
    });
}

async function updateProfilePicture(userId,newProfilePicture){
    const userCollection = await getUsersCollection();
    userCollection.updateOne({_id: userId,},{
        $set: {profilePicture: newProfilePicture}
    })
}

async function updateUserStats(userId, {newElo, won, lost, drew}) {
    const usersCollection = await getUsersCollection();
    if (won) {
        usersCollection.updateOne({_id: userId,}, {
            $set: {elo: newElo},
            $inc: {
                winStreak: 1,
                totalGames:1,
                totalWins:1,
            },
        });
    } else if (lost) {
        usersCollection.updateOne({_id: userId,}, {
            $set: {elo: newElo, winStreak: 0},
            $inc: {
                totalGames:1,
                totalLosses:1,
            },
        });
    } else if (drew) {
        usersCollection.updateOne({_id: userId,}, {
            $set: {elo: newElo, winStreak: 0},
            $inc: {
                totalGames:1,
                totalDraws:1,
            },
        });
    }
}

async function findTopUsersByElo(limit) {
    const usersCollection = await getUsersCollection();
    return usersCollection.find(
        {},
        {
            projection: {
                _id: 0,
                username: 1,
                elo: 1,
                profilePicture: 1,
            },
        }
    ).sort({ elo: -1, username: 1 }).limit(limit).toArray();
}



module.exports = {
    createUser,
    findUserByAuthId,
    updateUserStats,
    updateProfilePicture,
    findUserByQuery,
    findTopUsersByElo
};
