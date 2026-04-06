class User {
    constructor({ id, username, elo, profilePicture,totalGames,totalWins,totalLosses,totalDraws,winStreak,achievements }) {
        this.id = id;
        this.username = username;
        this.elo = elo;
        this.profilePicture = profilePicture;
        this.totalGames = totalGames;
        this.totalWins = totalWins;
        this.totalLosses = totalLosses;
        this.totalDraws = totalDraws;
        this.winStreak = winStreak;
        this.achievements = achievements;
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
            totalGames: document.totalGames,
            totalWins: document.totalWins,
            totalLosses: document.totalLosses,
            totalDraws: document.totalDraws,
            winStreak: document.winStreak,
            achievements: document.achievements || []
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
        return this.totalWins/this.totalGames;
    }
}

module.exports = User;
