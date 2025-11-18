const express = require('express');
const LeaderboardProfile = require('../models/LeaderboardProfile');
const LeaderboardCache = require('../models/LeaderboardCache');
const Student = require('../models/Student');
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

const PLATFORM_CONFIG = {
  leetcode: {
    label: 'LeetCode',
    baseUrl: 'https://leetcode.com/',
    accent: '#f89f1b'
  },
  hackerrank: {
    label: 'HackerRank',
    baseUrl: 'https://www.hackerrank.com/',
    accent: '#16a34a'
  },
  codechef: {
    label: 'CodeChef',
    baseUrl: 'https://www.codechef.com/users/',
    accent: '#8b5a2b'
  },
  codeforces: {
    label: 'Codeforces',
    baseUrl: 'https://codeforces.com/profile/',
    accent: '#3182ce'
  },
  geeksforgeeks: {
    label: 'GeeksforGeeks',
    baseUrl: 'https://auth.geeksforgeeks.org/user/',
    accent: '#0f9d58'
  }
};

function buildCodingProfiles(studentDoc, leaderboardProfile) {
  const personalInfo = studentDoc?.personalInfo || {};
  const metadataStats = leaderboardProfile?.metadata?.codingStats || {};
  const externalSyncedAt =
    leaderboardProfile?.metadata?.externalFetch?.fetchedAt || null;

  return Object.entries(PLATFORM_CONFIG)
    .map(([key, config]) => {
      const username = personalInfo[key];
      const stats = metadataStats[key] || null;

      if (!username && !stats) {
        return null;
      }

      return {
        key,
        platform: config.label,
        username: username || stats?.username || null,
        profileUrl:
          username || stats?.username
            ? `${config.baseUrl}${username || stats?.username}`
            : null,
        accentColor: config.accent,
        metrics: {
          problemsSolved:
            stats?.problemsSolved ?? stats?.solved ?? null,
          contestRating: stats?.contestRating ?? stats?.rating ?? null,
          contests: stats?.contests ?? null,
          percentile: stats?.percentile ?? null,
          streak: stats?.streak ?? null,
          weeklySolved: stats?.weeklySolved ?? null,
          monthlySolved: stats?.monthlySolved ?? null,
          lastSynced: stats?.lastSynced ?? externalSyncedAt
        },
        trend: stats?.trend ?? 'steady',
        badges: stats?.badges || [],
        points: stats?.points ?? null
      };
    })
    .filter(Boolean);
}

async function findRankingsForUser(userId) {
  const rankings = {};

  for (const period of PERIODS) {
    const cache = await LeaderboardCache.findOne({ period })
      .sort({ generatedAt: -1 })
      .lean();
    const entry = cache?.entries?.find(
      (e) => e.userId?.toString() === userId?.toString()
    );
    rankings[period] = entry?.rank || null;
  }

  return rankings;
}

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
    const {
      userId,
      deltaPoints = {},
      profile = {},
      reason,
      sourceLink,
      codingStats
    } = req.body || {};

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

    if (reason || codingStats) {
      leaderboardProfile.metadata = {
        ...(leaderboardProfile.metadata || {}),
        ...(codingStats
          ? {
              codingStats: {
                ...(leaderboardProfile.metadata?.codingStats || {}),
                ...codingStats
              }
            }
          : {}),
        ...(reason
          ? {
              lastScoreUpdate: {
                reason,
                updatedBy: req.user?._id,
                updatedAt: new Date()
              }
            }
          : {})
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

function buildStudentSummary(studentDoc, leaderboardProfile) {
  const personalInfo = studentDoc.personalInfo || {};
  const academicInfo = studentDoc.academicInfo || {};
  const placementStatus = studentDoc.placementStatus || {};
  const profileCompletion = studentDoc.profileCompletion || {};

  return {
    studentId: studentDoc._id,
    userId: studentDoc.userId,
    fullName: `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim(),
    rollNumber: academicInfo.rollNumber || null,
    department: academicInfo.department || null,
    year: academicInfo.year || null,
    avatarUrl:
      personalInfo.profilePhoto ||
      leaderboardProfile?.avatarUrl ||
      null,
    placementStage: placementStatus.currentStage || 'profile_created',
    profileCompletion: profileCompletion.percentage || 0,
    badges: leaderboardProfile?.badges || [],
    points: leaderboardProfile?.points || {},
    codingHandles: {
      leetcode: personalInfo.leetcode,
      hackerrank: personalInfo.hackerrank,
      codechef: personalInfo.codechef,
      codeforces: personalInfo.codeforces,
      geeksforgeeks: personalInfo.geeksforgeeks
    }
  };
}

router.get(
  '/students',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const page = parsePositiveInt(req.query.page, 1);
      const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
      const search = (req.query.search || '').trim();
      const skip = (page - 1) * limit;

      const searchFilter = search
        ? {
            $or: [
              { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
              { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
              { 'academicInfo.rollNumber': { $regex: search, $options: 'i' } },
              { 'academicInfo.department': { $regex: search, $options: 'i' } }
            ]
          }
        : {};

      const [total, students] = await Promise.all([
        Student.countDocuments(searchFilter),
        Student.find(searchFilter)
          .select(
            'personalInfo academicInfo placementStatus profileCompletion userId'
          )
          .sort({ 'personalInfo.firstName': 1 })
          .skip(skip)
          .limit(limit)
          .lean()
      ]);

      const userIds = students.map((student) => student.userId);
      const leaderboardProfiles = await LeaderboardProfile.find({
        userId: { $in: userIds }
      })
        .select('userId avatarUrl badges points metadata')
        .lean();

      const profileMap = new Map(
        leaderboardProfiles.map((profile) => [
          profile.userId.toString(),
          profile
        ])
      );

      const summaries = students.map((student) =>
        buildStudentSummary(student, profileMap.get(student.userId.toString()))
      );

      res.json({
        page,
        limit,
        total,
        students: summaries
      });
    } catch (error) {
      console.error('[Leaderboard] GET /api/leaderboard/students error:', error);
      res.status(500).json({ message: 'Failed to load student list' });
    }
  }
);

router.get(
  '/students/:studentId/progress',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const student = await Student.findById(req.params.studentId)
        .populate('userId', 'email')
        .lean();

      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const userRef = student.userId?._id || student.userId;

      const leaderboardProfile = await LeaderboardProfile.findOne({
        userId: userRef
      }).lean();

      const codingProfiles = buildCodingProfiles(student, leaderboardProfile);
      const rankings = await findRankingsForUser(userRef);

      const projectsCount = student.projects?.length || 0;
      const hackathonCount = student.hackathons?.length || 0;
      const certificationCount = student.certifications?.length || 0;

      const progressSummary = {
        totalProblemsSolved: codingProfiles.reduce(
          (sum, profile) => sum + (profile.metrics.problemsSolved || 0),
          0
        ),
        totalContests: codingProfiles.reduce(
          (sum, profile) => sum + (profile.metrics.contests || 0),
          0
        ),
        weeklySolved: codingProfiles.reduce(
          (sum, profile) => sum + (profile.metrics.weeklySolved || 0),
          0
        ),
        monthlySolved: codingProfiles.reduce(
          (sum, profile) => sum + (profile.metrics.monthlySolved || 0),
          0
        ),
        projectsCount,
        hackathonCount,
        certificationCount,
        lastSynced:
          codingProfiles
            .map((profile) => profile.metrics.lastSynced)
            .filter(Boolean)
            .sort((a, b) => new Date(b) - new Date(a))[0] || null
      };

      res.json({
        student: {
          id: student._id,
          userId: userRef,
          fullName: `${student.personalInfo?.firstName || ''} ${
            student.personalInfo?.lastName || ''
          }`.trim(),
          email: student.userId?.email,
          phone: student.personalInfo?.phone,
          department: student.academicInfo?.department,
          year: student.academicInfo?.year,
          rollNumber: student.academicInfo?.rollNumber,
          avatarUrl:
            student.personalInfo?.profilePhoto ||
            leaderboardProfile?.avatarUrl ||
            null,
          location: student.personalInfo?.address?.city,
          placementStage: student.placementStatus?.currentStage,
          profileCompletion: student.profileCompletion?.percentage || 0
        },
        leaderboard: {
          points: leaderboardProfile?.points || {},
          badges: leaderboardProfile?.badges || [],
          rankings
        },
        codingProfiles,
        progress: progressSummary
      });
    } catch (error) {
      console.error(
        '[Leaderboard] GET /api/leaderboard/students/:id/progress error:',
        error
      );
      res.status(500).json({ message: 'Failed to load student progress' });
    }
  }
);

module.exports = router;


