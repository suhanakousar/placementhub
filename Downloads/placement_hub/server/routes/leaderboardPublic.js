const express = require('express');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');
const {
  detectPlatformFromUrl,
  extractUsernameFromUrl
} = require('../services/codingPlatformService');
const {
  buildStudentLeaderboardEntry,
  buildStudentDetail
} = require('../services/leaderboardAggregator');

const router = express.Router();

const LEADERBOARD_CACHE_TTL = 1000 * 60; // 1 minute cache for aggregated ranks

const leaderboardCache = {
  fetchedAt: 0,
  entries: []
};

function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function sortLeaderboard(entries = []) {
  return [...entries].sort((a, b) => {
    if (b.displayScore !== a.displayScore) {
      return b.displayScore - a.displayScore;
    }
    const activityDiff =
      (b.tieBreakers?.recentActivityScore || 0) -
      (a.tieBreakers?.recentActivityScore || 0);
    if (activityDiff !== 0) {
      return activityDiff;
    }
    const contestsDiff =
      (b.tieBreakers?.totalContests || 0) -
      (a.tieBreakers?.totalContests || 0);
    if (contestsDiff !== 0) {
      return contestsDiff;
    }
    const ratingDiff =
      (b.tieBreakers?.highestPlatformRating || 0) -
      (a.tieBreakers?.highestPlatformRating || 0);
    if (ratingDiff !== 0) {
      return ratingDiff;
    }
    const lastA = a.tieBreakers?.lastActivity
      ? new Date(a.tieBreakers.lastActivity).getTime()
      : 0;
    const lastB = b.tieBreakers?.lastActivity
      ? new Date(b.tieBreakers.lastActivity).getTime()
      : 0;
    return lastB - lastA;
  });
}

async function loadLeaderboardEntries(force = false) {
  const now = Date.now();
  if (
    !force &&
    leaderboardCache.entries.length &&
    now - leaderboardCache.fetchedAt < LEADERBOARD_CACHE_TTL
  ) {
    return leaderboardCache.entries;
  }

  const students = await Student.find()
    .select('personalInfo academicInfo codingProfiles userId')
    .populate('userId', 'email')
    .lean();

  const entries = [];
  for (const student of students) {
    try {
      const entry = await buildStudentLeaderboardEntry(student);
      entries.push(entry);
    } catch (error) {
      console.warn(
        '[Leaderboard] Failed to build entry for student',
        student?._id,
        error.message
      );
    }
  }

  leaderboardCache.entries = entries;
  leaderboardCache.fetchedAt = now;
  return entries;
}

router.get('/', async (req, res) => {
  try {
    const limit = parsePositiveInt(req.query.limit, 200);
    const entries = await loadLeaderboardEntries();
    const ranked = sortLeaderboard(entries)
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        studentId: entry.studentId,
        username: entry.fullName,
        avatarUrl: entry.avatarUrl,
        department: entry.department,
        year: entry.year,
        overallScore: entry.displayScore,
        tieBreakers: entry.tieBreakers,
        platforms: entry.platforms.slice(0, 4)
      }));

    res.json({ students: ranked });
  } catch (error) {
    console.error('[Leaderboard] GET /api/leaderboard-public error', error);
    res
      .status(500)
      .json({ message: 'Failed to load leaderboard', error: error.message });
  }
});

router.get('/:studentId', async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId)
      .populate('userId', 'email')
      .lean();

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const detail = await buildStudentDetail(student);
    const leaderboard = sortLeaderboard(await loadLeaderboardEntries());
    const rankIndex = leaderboard.findIndex(
      (entry) => entry.studentId?.toString() === student._id.toString()
    );

    res.json({
      ...detail,
      globalRank: rankIndex >= 0 ? rankIndex + 1 : null
    });
  } catch (error) {
    console.error(
      '[Leaderboard] GET /api/leaderboard-public/:id error',
      error
    );
    res
      .status(500)
      .json({ message: 'Failed to load student analytics', error: error.message });
  }
});

router.put(
  '/:studentId/coding-profiles',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const { links = [] } = req.body;
      if (!Array.isArray(links) || !links.length) {
        return res
          .status(400)
          .json({ message: 'links must be a non-empty array of URLs' });
      }

      const student = await Student.findById(req.params.studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      student.codingProfiles = links
        .filter((link) => typeof link === 'string' && link.trim().length)
        .map((link) => {
          const detected = detectPlatformFromUrl(link);
          return {
            url: link.trim(),
            platform: detected?.id || null,
            username: detected
              ? extractUsernameFromUrl(link, detected.id)
              : null
          };
        });

      await student.save();
      leaderboardCache.fetchedAt = 0;

      res.json({
        message: 'Coding profile links updated',
        codingProfiles: student.codingProfiles
      });
    } catch (error) {
      console.error(
        '[Leaderboard] PUT /api/leaderboard-public/:id/coding-profiles error',
        error
      );
      res
        .status(500)
        .json({ message: 'Failed to update coding profiles', error: error.message });
    }
  }
);

module.exports = router;

