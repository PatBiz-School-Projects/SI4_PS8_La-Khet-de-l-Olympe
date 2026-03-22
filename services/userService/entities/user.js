class User {
    constructor({ id, username, elo, profilePicture,ratedGames,wins,losses,draws,winstreak }) {
        this.id = id;
        this.username = username;
        this.elo = elo;
        this.profilePicture = profilePicture;
        this.ratedGames = ratedGames;
        this.wins = wins;
        this.losses = losses;
        this.draws = draws;
        this.winStreak = winstreak;
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
            ratedGames: document.ratedGames,
            wins: document.wins,
            losses: document.losses,
            draws: document.draws,
            winStreak: document.winStreak
        });
    }

    gameUserDTO() {
        return {
            id: this.id,
            username: this.username,
            elo: this.elo,
        };
    }

    getWinrate(){
        return this.wins/this.ratedGames;
    }
}

module.exports = User;
