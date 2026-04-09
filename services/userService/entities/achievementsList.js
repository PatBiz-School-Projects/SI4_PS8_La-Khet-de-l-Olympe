const ACHIEVEMENTS_LIST = {
    FIRST_WIN: {
        id: 'FIRST_WIN',
        name: 'Première victoire',
        description: 'Remportez votre première partie.',
        iconUrl: '/assets/first-win.png',
        condition: (user) => user.totalWins >= 1
    },
    WIN_50: {
        id: 'WIN_50',
        name: 'Vétéran',
        description: 'Remportez 50 parties.',
        iconUrl: '/assets/veteran-50.png',
        condition: (user) => user.totalWins >= 50
    },
    HOT_STREAK: {
        id: 'HOT_STREAK',
        name: 'Inarrêtable',
        description: 'Remportez 5 parties d\'affilés.',
        iconUrl: '/assets/hot-streak.png',
        condition: (user) => user.winStreak >= 5
    },
    FIRST_CONNEXION: {
        id: 'FIRST_CONNEXION',
        name: 'Bienvenue!',
        description: 'Se connecter pour la première fois',
        iconUrl: '/assets/pharaoh-red.png',
        condition: (user) => user.id!=null
    }
};

module.exports = ACHIEVEMENTS_LIST;
