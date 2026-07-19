const jwt = require('jsonwebtoken');

function generateAccessToken(user) {
    return jwt.sign({ sub: user.id, role: user.role }, 'RideGuardSecret2026!', {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
}

function generateRefreshToken(user) {
    return jwt.sign({ sub: user.id }, 'RideGuardRefresh2026!', {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    });
}

module.exports = { generateAccessToken, generateRefreshToken };