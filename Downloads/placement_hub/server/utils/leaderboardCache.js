const memoryCache = {
  leaderboard: {}
};

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getLeaderboardFromCache(period) {
  const cached = memoryCache.leaderboard[period];
  if (!cached) return null;

  if (Date.now() - cached.cachedAt > CACHE_TTL_MS) {
    delete memoryCache.leaderboard[period];
    return null;
  }
  return cached;
}

function setLeaderboardInCache(period, payload) {
  if (!payload || !payload.entries) {
    delete memoryCache.leaderboard[period];
    return;
  }
  memoryCache.leaderboard[period] = {
    ...payload,
    cachedAt: Date.now()
  };
}

function clearLeaderboardCache(period) {
  if (period) {
    delete memoryCache.leaderboard[period];
    return;
  }
  memoryCache.leaderboard = {};
}

module.exports = {
  getLeaderboardFromCache,
  setLeaderboardInCache,
  clearLeaderboardCache
};


