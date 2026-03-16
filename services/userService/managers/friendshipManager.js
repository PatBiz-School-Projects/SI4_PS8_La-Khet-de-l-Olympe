const friendshipRepository = require("../repositories/friendshipsRepository")

function orderIdsDESCOrder(userId1,userId2){
    return userId1<=userId2?{
        "user_id_1": userId1,
        "user_id_2": userId2
    } : {
        "user_id_1": userId2,
        "user_id_2": userId1
    }
}

async function requestFriendship(currentUserId,targetUserId){
    if(currentUserId===targetUserId){
        throw new Error("CANNOT_SELF_REQUEST");
    }
    const {userId1, userId2} = orderIdsDESCOrder(currentUserId,targetUserId);
    const existing = await friendshipRepository.findByUsers(userId1, userId2);
    if (existing) {
        throw new Error('FRIENDSHIP_ALREADY_EXISTS');
    }
    const created = await friendshipRepository.requestFriendship({
        userId1,
        userId2,
        requestedBy: currentUserId,
    });
    return {
        id: created._id,
    }
}

async function acceptFriendship(currentUserId,requestUserId){
    const { userId1, userId2 } = orderIdsDESCOrder(currentUserId, requestUserId);

    const relation = await friendshipRepository.findByUsers(userId1, userId2);
    if (relation.status !== 'pending') {
        throw new Error('FRIENDSHIP_NOT_PENDING');
    }
    await friendshipRepository.acceptFriendship({userId1, userId2});
}

async function declineOrCancelRequest(currentUserId, targetUserId) {
    const { userId1, userId2 } = orderIdsDESCOrder(currentUserId, targetUserId);

    const relation = await friendshipRepository.findByUsers(userId1, userId2);
    if (!relation || relation.status !== 'pending') {
        throw new Error('PENDING_REQUEST_NOT_FOUND');
    }

    await friendshipRepository.deletePendingFriendship({ userId1, userId2 });
}

async function removeFriend(currentUserId,targetUserId){
    const { userId1, userId2 } = orderIdsDESCOrder(currentUserId, targetUserId);
    const relation = await friendshipRepository.findByUsers(userId1, userId2);
    if (!relation || relation.status !== 'accepted') {
        throw new Error('FRIENDSHIP_NOT_ACCEPTED');
    }

    await friendshipRepository.deleteAcceptedFriendship({ userId1, userId2 });
}

async function getAllFriends(userId){
    return friendshipRepository.listAcceptedFriendshipsByUser(userId);
}

async function listReceivedRequests(userId){
    return friendshipRepository.listPendingReceivedRequests(userId);
}

module.exports = {removeFriend,getAllFriends,listReceivedRequests,declineOrCancelRequest,acceptFriendship,requestFriendship};

