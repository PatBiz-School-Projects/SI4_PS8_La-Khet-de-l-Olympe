const { getDb } = require('./mongo');

async function getFriendshipsCollection(){
    const db = await getDb();
    return db.collection("friendships");
}

async function findByUsers(userId1,userId2){
    const friendships = await getFriendshipsCollection();
    return friendships.findOne({user_id_1: userId1,user_id_2:userId2});
}

async function requestFriendship({userId1,userId2,requested_by}){
    const friendships = await getFriendshipsCollection();
    const toInsert = {
        user_id_1: userId1,
        user_id_2: userId2,
        status: 'pending',
        requested_by: requested_by,
        accepted_at: null
    }
    const result = await friendships.insertOne(toInsert);
    return {
        _id: result.insertedId
    }
}

async function acceptFriendship({userId1,userId2}){
    const friendships = await getFriendshipsCollection();
    return friendships.updateOne({_id: userId1,user_id:userId2,status: 'pending'},{$set:{accepted_at: new Date(),status:'accepted'}});
}

async function deletePendingFriendship({ userId1, userId2 }) {
    const friendships = await getFriendshipsCollection();
    return friendships.deleteOne({ user_id_1: userId1, user_id_2: userId2, status: 'pending' });
}

async function deleteAcceptedFriendship({ userId1, userId2 }) {
    const friendships = await getFriendshipsCollection();
    return friendships.deleteOne({ user_id_1: userId1, user_id_2: userId2, status: 'accepted' });
}

async function listAcceptedFriendshipsByUser(userId) {
    const friendships = await getFriendshipsCollection();

    return friendships.find({
        status: 'accepted',
        $or: [{ user_id_1: userId }, { user_id_2: userId }],
    }).toArray();
}

async function listPendingReceivedRequests(userId) {
    const friendships = await getFriendshipsCollection();

    return friendships.find({
        status: 'pending',
        requested_by: { $ne: userId },
        $or: [{ user_id_1: userId }, { user_id_2: userId }],
    }).toArray();
}

module.exports = {findByUsers,requestFriendship,acceptFriendship,deleteAcceptedFriendship,deletePendingFriendship,listAcceptedFriendshipsByUser,listPendingReceivedRequests};
