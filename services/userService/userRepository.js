const { getDb } = require('./mongo');
const User = require('./entities/user');
/** @type {User} */
async function findUserByAuthId(authId) {
    const db = await getDb();
    const users = db.collection('users');

    const plainUser = await users.findOne({ _id: authId });
    return User.builder(plainUser);
}

module.exports = {
    findUserByAuthId,
};
