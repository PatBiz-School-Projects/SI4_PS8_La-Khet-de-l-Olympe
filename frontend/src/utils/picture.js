export function getPictureUrl(profilePicture) {
    if (!profilePicture) {
        return '/assets/pharaoh-blue.png';
    }

    if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://') || profilePicture.startsWith('/')) {
        return profilePicture;
    }

    return `/assets/${profilePicture}`;
}

export function getGlobalPicturePath(profilePicture) {
    const parts = profilePicture.split("/");
    return parts[parts.length - 1];
}
