class ConnectedUsersService {
    constructor() {
        this.connectedUsers = new Map();
    }

    addConnectedUser(user) {
        this.connectedUsers.set(user.id, user);
    }

    disconnectUser(authId) {
        this.connectedUsers.delete(authId);
    }

    isUserConnected(authId) {
        return this.connectedUsers.has(authId);
    }

    getConnectedUsers() {
        return Array.from(this.connectedUsers.values());
    }
}

module.exports = new ConnectedUsersService();
