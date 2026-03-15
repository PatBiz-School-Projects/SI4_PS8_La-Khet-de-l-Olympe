class ConnectedUsersService {
    constructor() {
        this.connectedUsers = new Map();
    }

    addConnectedUser(user) {
        this.connectedUsers.set(user.authId, user);
        return user;
    }

    disconnectUser(authId) {
        return this.connectedUsers.delete(authId);
    }

    isUserConnected(authId) {
        return this.connectedUsers.has(authId);
    }

    getConnectedUsers() {
        return Array.from(this.connectedUsers.values());
    }
}

module.exports = new ConnectedUsersService();
