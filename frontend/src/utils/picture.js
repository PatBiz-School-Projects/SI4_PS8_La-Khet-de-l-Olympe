export function getPictureUrl(profilePicture) {
    if (!profilePicture) {
        return '/assets/pharaoh-blue.png';
    }

    if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://') || profilePicture.startsWith('/')) {
        return profilePicture;
    }

    return `/assets/${profilePicture}`;
}


