const ACHIEVEMENTS_LIST = {
    FIRST_WIN: {
        id: 'FIRST_WIN',
        name: 'Première victoire',
        description: 'Remportez votre première partie.',
        iconUrl: '/assets/achievements/first-win.png',
        condition: (user) => user.totalWins >= 1
    },
    WIN_50: {
        id: 'WIN_50',
        name: 'Vétéran',
        description: 'Remportez 50 parties.',
        iconUrl: '/assets/achievements/veteran-50.png',
        condition: (user) => user.totalWins >= 50
    },
    HOT_STREAK: {
        id: 'HOT_STREAK',
        name: 'Inarrêtable',
        description: 'Remportez 5 parties d\'affilés.',
        iconUrl: '/assets/achievements/hot-streak.png',
        condition: (user) => user.winStreak >= 5
    }
};

module.exports = ACHIEVEMENTS_LIST;
