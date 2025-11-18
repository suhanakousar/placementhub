const cron = require('node-cron');
const LeaderboardProfile = require('../models/LeaderboardProfile');
const LeaderboardCache = require('../models/LeaderboardCache');
const {
  setLeaderboardInCache,
  clearLeaderboardCache
} = require('../utils/leaderboardCache');

const PERIODS = ['today', 'month', 'year'];

function pointsField(period) {
  switch (period) {
    case 'today':
      return 'points.today';
    case 'month':
      return 'points.month';
    case 'year':
      return 'points.year';
    default:
      return 'points.total';
  }
}

async function buildEntries(period) {
  const field = pointsField(period);
  const profiles = await LeaderboardProfile.find({})
    .sort({ [field]: -1, createdAt: 1 })
    .select('userId name username avatarUrl company points')
    .lean();

  return profiles.map((profile, index) => ({
    userId: profile.userId || profile._id,
    name: profile.name,
    username: profile.username,
    avatarUrl: profile.avatarUrl,
    company: profile.company,
    points: profile.points?.[period] ?? profile.points?.total ?? 0,
    rank: index + 1
  }));
}

async function recalculateLeaderboardFor(period) {
  const entries = await buildEntries(period);
  const payload = {
    period,
    generatedAt: new Date(),
    entries
  };

  await LeaderboardCache.create(payload);
  setLeaderboardInCache(period, payload);

  return payload;
}

async function recalculateAllLeaderboards() {
  for (const period of PERIODS) {
    await recalculateLeaderboardFor(period);
  }
}

function scheduleLeaderboardJob() {
  cron.schedule('*/10 * * * *', async () => {
    try {
      console.log('[Leaderboard] Cron: recalculating ranks');
      await recalculateAllLeaderboards();
    } catch (error) {
      console.error('[Leaderboard] Cron error:', error);
    }
  });
}

function invalidateAllLeaderboards() {
  clearLeaderboardCache();
}

module.exports = {
  PERIODS,
  recalculateLeaderboardFor,
  recalculateAllLeaderboards,
  scheduleLeaderboardJob,
  invalidateAllLeaderboards,
  buildEntries
};


