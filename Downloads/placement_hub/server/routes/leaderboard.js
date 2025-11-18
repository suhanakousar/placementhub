const express = require('express');
const LeaderboardProfile = require('../models/LeaderboardProfile');
const LeaderboardCache = require('../models/LeaderboardCache');
const {
  getLeaderboardFromCache,
  setLeaderboardInCache,
  clearLeaderboardCache
} = require('../utils/leaderboardCache');
const {
  PERIODS,
  buildEntries
} = require('../jobs/recalculateLeaderboard');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

router.get('/', async (req, res) => {
  try {
    const period = PERIODS.includes(req.query.period) ? req.query.period : 'today';
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
    const skip = (page - 1) * limit;

    let cached = getLeaderboardFromCache(period);

    if (!cached || !cached.entries || !cached.entries.length) {
      const latestCache = await LeaderboardCache.findOne({ period })
        .sort({ generatedAt: -1 })
        .lean();

      if (latestCache?.entries?.length) {
        cached = latestCache;
        setLeaderboardInCache(period, latestCache);
      } else {
        const entries = await buildEntries(period);
        cached = {
          period,
          generatedAt: new Date(),
          entries
        };
        await LeaderboardCache.create(cached);
        setLeaderboardInCache(period, cached);
      }
    }

    const entries = cached.entries ?? [];
    res.json({
      period,
      generatedAt: cached.generatedAt,
      page,
      limit,
      total: entries.length,
      entries: entries.slice(skip, skip + limit)
    });
  } catch (error) {
    console.error('[Leaderboard] GET /api/leaderboard error:', error);
    res.status(500).json({ message: 'Failed to load leaderboard' });
  }
});

router.post('/score', protect, authorize('admin'), async (req, res) => {
  try {
    const { userId, deltaPoints = {}, profile = {}, reason, sourceLink } = req.body || {};

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const increments = {
      today: Number(deltaPoints.today || 0),
      month: Number(deltaPoints.month || 0),
      year: Number(deltaPoints.year || 0),
      total: Number(deltaPoints.total || 0)
    };

    if (!Object.values(increments).some((value) => value !== 0)) {
      return res.status(400).json({ message: 'deltaPoints must include at least one non-zero value' });
    }

    let leaderboardProfile = await LeaderboardProfile.findOne({ userId });

    if (!leaderboardProfile) {
      if (!profile.name) {
        return res.status(400).json({ message: 'Profile name is required when creating a new leaderboard entry' });
      }

      leaderboardProfile = new LeaderboardProfile({
        userId,
        name: profile.name,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        company: profile.company,
        location: profile.location,
        badges: profile.badges || [],
        profileLinks: profile.profileLinks || []
      });
    } else {
      leaderboardProfile.name = profile.name ?? leaderboardProfile.name;
      leaderboardProfile.username = profile.username ?? leaderboardProfile.username;
      leaderboardProfile.avatarUrl = profile.avatarUrl ?? leaderboardProfile.avatarUrl;
      leaderboardProfile.company = profile.company ?? leaderboardProfile.company;
      leaderboardProfile.location = profile.location ?? leaderboardProfile.location;
      leaderboardProfile.badges = profile.badges ?? leaderboardProfile.badges;

      if (Array.isArray(profile.profileLinks) && profile.profileLinks.length) {
        const mergedLinks = new Set([...(leaderboardProfile.profileLinks || []), ...profile.profileLinks]);
        leaderboardProfile.profileLinks = Array.from(mergedLinks);
      }
    }

    leaderboardProfile.points.today += increments.today;
    leaderboardProfile.points.month += increments.month;
    leaderboardProfile.points.year += increments.year;
    leaderboardProfile.points.total += increments.total;

    if (sourceLink) {
      leaderboardProfile.profileLinks = leaderboardProfile.profileLinks || [];
      if (!leaderboardProfile.profileLinks.includes(sourceLink)) {
        leaderboardProfile.profileLinks.push(sourceLink);
      }
    }

    if (reason) {
      leaderboardProfile.metadata = {
        ...(leaderboardProfile.metadata || {}),
        lastScoreUpdate: {
          reason,
          updatedBy: req.user?._id,
          updatedAt: new Date()
        }
      };
    }

    await leaderboardProfile.save();

    clearLeaderboardCache();

    res.json({
      message: 'Score updated successfully',
      profile: leaderboardProfile
    });
  } catch (error) {
    console.error('[Leaderboard] POST /api/leaderboard/score error:', error);
    res.status(500).json({ message: 'Failed to update score' });
  }
});

module.exports = router;


