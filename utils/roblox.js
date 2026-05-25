const noblox = require('noblox.js');

function extractRobloxName(nickname) {
    const match = nickname?.match(/^\[.*?\]\s*(\S+)/);
    return match ? match[1] : null;
}

async function getUserIdFromName(username) {
    try {
        return await noblox.getIdFromUsername(username);
    } catch {
        return null;
    }
}

async function getCurrentRank(groupId, userId) {
    try {
        return await noblox.getRankInGroup(groupId, userId);
    } catch {
        return null;
    }
}

async function getRoleMap(groupId) {
    const roles = await noblox.getRoles(groupId);
    const map = {};
    for (const role of roles) {
        map[role.name.toLowerCase()] = { id: role.id, rank: role.rank };
    }
    return map;
}

module.exports = {
    extractRobloxName,
    getUserIdFromName,
    getCurrentRank,
    getRoleMap
};