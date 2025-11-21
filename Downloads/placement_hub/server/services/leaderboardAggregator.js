const {
  PLATFORM_DEFINITIONS,
  BASE_WEIGHTS,
  OTHER_WEIGHT,
  detectPlatformFromUrl,
  extractUsernameFromUrl,
  fetchPlatforms,
  calculatePlatformScores
} = require('./codingPlatformService');

const FALLBACK_ACTIVITY_WINDOW = 1000 * 60 * 60 * 24 * 30; // 30 days

function collectPlatformEntries(studentDoc = {}) {
  const entries = [];
  const personalInfo = studentDoc.personalInfo || {};

  const legacyHandles = [
    { platformId: 'leetcode', value: personalInfo.leetcode },
    { platformId: 'codeforces', value: personalInfo.codeforces },
    { platformId: 'codechef', value: personalInfo.codechef },
    { platformId: 'hackerrank', value: personalInfo.hackerrank },
    { platformId: 'geeksforgeeks', value: personalInfo.geeksforgeeks },
    { platformId: 'github', value: personalInfo.github }
  ];

  legacyHandles.forEach(({ platformId, value }) => {
    if (!value) return;
    const username = extractUsernameFromUrl(value, platformId) || value;
    entries.push({ platformId, username });
  });

  if (Array.isArray(studentDoc.codingProfiles)) {
    studentDoc.codingProfiles.forEach((profile) => {
      if (!profile?.url) return;
      const detected = profile.platform
        ? PLATFORM_DEFINITIONS[profile.platform]
        : detectPlatformFromUrl(profile.url);
      if (!detected) return;

      const username =
        profile.username ||
        extractUsernameFromUrl(profile.url, detected.id) ||
        profile.url;

      entries.push({ platformId: detected.id, username, url: profile.url });
    });
  }

  return entries;
}

function aggregateTieBreakers(platformSummaries = []) {
  let recentActivityScore = 0;
  let totalContests = 0;
  let highestRating = 0;
  let lastActivity = null;

  const now = Date.now();

  platformSummaries.forEach((summary) => {
    if (summary.totalContests) {
      totalContests += summary.totalContests;
    }
    if (summary.currentRating) {
      highestRating = Math.max(highestRating, summary.currentRating);
    }
    if (summary.lastActivity) {
      const last = new Date(summary.lastActivity).getTime();
      lastActivity = !lastActivity || last > lastActivity ? last : lastActivity;
      const decay = Math.max(
        0,
        1 - (now - last) / FALLBACK_ACTIVITY_WINDOW
      );
      recentActivityScore += decay;
    }
  });

  if (lastActivity) {
    lastActivity = new Date(lastActivity);
  }

  return {
    recentActivityScore,
    totalContests,
    highestPlatformRating: highestRating,
    lastActivity
  };
}

function buildRankingSeries(platformSummaries = []) {
  const historySource =
    platformSummaries.find((entry) => entry.history?.length);

  if (!historySource?.history?.length) {
    return [];
  }

  return historySource.history.map((point, index) => ({
    name: point.label || `P${index + 1}`,
    solved: point.value
  }));
}

async function buildPlatformSummaries(studentDoc) {
  const entries = collectPlatformEntries(studentDoc);
  if (!entries.length) return [];
  const payloads = await fetchPlatforms(entries);

  return payloads.map((payload) => {
    const definition = PLATFORM_DEFINITIONS[payload.platformId] || {};
    return {
      ...payload,
      label: definition.label || payload.platformId,
      accentColor: definition.accentColor,
      profileUrl:
        payload.profileUrl ||
        definition.profileUrl?.(payload.username) ||
        null
    };
  });
}

async function buildStudentLeaderboardEntry(studentDoc) {
  const personalInfo = studentDoc.personalInfo || {};
  const academicInfo = studentDoc.academicInfo || {};

  const platforms = await buildPlatformSummaries(studentDoc);
  if (!platforms.length) {
    return {
      studentId: studentDoc._id,
      fullName: `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim(),
      avatarUrl: personalInfo.profilePhoto || null,
      department: academicInfo.department,
      year: academicInfo.year,
      displayScore: 0,
      platforms: [],
      tieBreakers: {
        recentActivityScore: 0,
        totalContests: 0,
        highestPlatformRating: 0,
        lastActivity: null
      },
      warnings: ['No coding profiles available']
    };
  }

  const { summaries, scoreDistribution, displayScore } =
    calculatePlatformScores(platforms);

  const tieBreakers = aggregateTieBreakers(summaries);

  return {
    studentId: studentDoc._id,
    userId: studentDoc.userId,
    fullName: `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim(),
    avatarUrl: personalInfo.profilePhoto || null,
    department: academicInfo.department,
    year: academicInfo.year,
    displayScore,
    scoreDistribution,
    platforms: summaries,
    tieBreakers
  };
}

async function buildStudentDetail(studentDoc) {
  const leaderboardEntry = await buildStudentLeaderboardEntry(studentDoc);
  const globalRankingSeries = buildRankingSeries(leaderboardEntry.platforms);

  return {
    student: {
      id: leaderboardEntry.studentId,
      firstName: studentDoc.personalInfo?.firstName || '',
      lastName: studentDoc.personalInfo?.lastName || '',
      fullName: leaderboardEntry.fullName,
      avatarUrl: leaderboardEntry.avatarUrl,
      department: leaderboardEntry.department,
      year: leaderboardEntry.year,
      email: studentDoc.userId?.email || null
    },
    displayScore: leaderboardEntry.displayScore,
    scoreDistribution: leaderboardEntry.scoreDistribution,
    platforms: leaderboardEntry.platforms,
    tieBreakers: leaderboardEntry.tieBreakers,
    globalRankingSeries
  };
}

module.exports = {
  collectPlatformEntries,
  buildPlatformSummaries,
  buildStudentLeaderboardEntry,
  buildStudentDetail
};

