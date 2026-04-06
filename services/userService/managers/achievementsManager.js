const ACHIEVEMENTS_LIST = require('../entities/achievementsList');

class AchievementsManager {
    static checkNewAchievements(user) {
        const newlyUnlocked = [];

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
}

module.exports = AchievementsManager;
