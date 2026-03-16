function mapError(error) {
    const message = String(error?.message || 'UNKNOWN_ERROR');

    if (message === 'MISSING_TOKEN') return [401, 'MISSING_TOKEN'];
    if (message.includes('INVALID_TOKEN') || message.includes('JWT') || message.includes('TOKEN')) return [401, 'INVALID_TOKEN'];
    if (message === 'FRIENDSHIP_ALREADY_EXISTS') return [409, 'FRIENDSHIP_ALREADY_EXISTS'];
    if (message === 'FRIENDSHIP_NOT_PENDING') return [409, 'FRIENDSHIP_NOT_PENDING'];
    if (message === 'CANNOT_SELF_REQUEST') return [403, 'CANNOT_SELF_REQUEST'];
    if (message === 'PENDING_REQUEST_NOT_FOUND') return [404, 'PENDING_REQUEST_NOT_FOUND'];
    if (message === 'FRIENDSHIP_NOT_ACCEPTED') return [404, 'FRIENDSHIP_NOT_ACCEPTED'];

    return [500, message];
}

module.exports = {mapError};
