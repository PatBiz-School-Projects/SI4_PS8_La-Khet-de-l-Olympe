class User {
    constructor({ id, username, elo, profilePicture }) {
        this.id = id;
        this.username = username;
        this.elo = elo;
        this.profilePicture = profilePicture;
    }

    static builder(document) {
        if (!document) {
            return null;
        }

        return new User({
            id: document._id?.toString?.() ?? String(document._id),
            username: document.username,
            elo: document.elo,
            profilePicture: document.profilePicture,
        });
    }

    gameUserDTO() {
        return {
            id: this.id,
            username: this.username,
            elo: this.elo,
        };
    }
}

module.exports = User;
