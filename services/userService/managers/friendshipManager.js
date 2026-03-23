const friendshipRepository = require("../repositories/friendshipsRepository")
const usersRepository = require("../repositories/userRepository")

function orderIdsDESCOrder(userId1,userId2){
    return userId1<=userId2?{
        "userId1": userId1,
        "userId2": userId2
    } : {
        "userId1": userId2,
        "userId2": userId1
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
        requestedBy: currentUserId
    });
    return {
        id: created._id,
    }
}

async function acceptFriendship(currentUserId,requestUserId){
    const { userId1, userId2 } = orderIdsDESCOrder(currentUserId, requestUserId);

    const relation = await friendshipRepository.findByUsers(userId1, userId2);
    if (!relation) {
        throw new Error('FRIENDSHIP_NOT_FOUND');
    }
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
    const friendships = await friendshipRepository.listAcceptedFriendshipsByUser(userId);
    const friends = await Promise.all(friendships.map(async (friendship) => {
        const friendId = friendship.user_id_1 === userId ? friendship.user_id_2 : friendship.user_id_1;
        const friend = await usersRepository.findUserByAuthId(friendId);

        if (!friend) {
            return null;
        }

        return {
            id: friend.id,
            username: friend.username,
            elo: friend.elo,
            profilePicture: friend.profilePicture,
            friendshipId: friendship._id?.toString?.() ?? null,
            acceptedAt: friendship.accepted_at,
        };
    }));

    return friends.filter(Boolean);
}

async function listReceivedRequests(userId){
    const requests = await friendshipRepository.listPendingReceivedRequests(userId);
    const enrichedRequests = await Promise.all(requests.map(async (request) => {
        const requesterId = request.requested_by;
        const requester = await usersRepository.findUserByAuthId(requesterId);

        if (!requester) {
            return null;
        }

        return {
            id: request._id?.toString?.() ?? null,
            requester: {
                id: requester.id,
                username: requester.username,
                elo: requester.elo,
                profilePicture: requester.profilePicture,
            },
        };
    }));

    return enrichedRequests.filter(Boolean);
}

async function isUserPresent(userId){
    const user = await usersRepository.findUserByAuthId(userId);
    return user!=null;
}

module.exports = {removeFriend,getAllFriends,listReceivedRequests,declineOrCancelRequest,acceptFriendship,requestFriendship,isUserPresent};

