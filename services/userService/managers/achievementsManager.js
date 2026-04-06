const ACHIEVEMENTS_LIST = require('../entities/achievementsList');

class AchievementsManager {
    static checkNewAchievements(user) {
        const newlyUnlocked = [];

        if (!user.achievements) {
            console.log("ACHIEVEMENTS CREATED");
            user.achievements = [];
        }

        for (const key in ACHIEVEMENTS_LIST) {
            const achievement = ACHIEVEMENTS_LIST[key];

            if (!user.achievements.includes(achievement.id)) {
                if (achievement.condition(user)) {
                    user.achievements.push(achievement.id);
                    newlyUnlocked.push(achievement);
                }
            }
        }

        return newlyUnlocked;
    }
    static getAchievementsCatalogue() {
        return Object.values(ACHIEVEMENTS_LIST).map(achievement => ({
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            iconUrl: achievement.iconUrl || '/assets/pharaoh-blue.png'
        }));
    }
}

module.exports = AchievementsManager;
