const axios = require('axios');

const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
const MAX_RETRIES = 2;
const RAPIDAPI_KEY =
  process.env.RAPIDAPI_KEY ||
  process.env.X_RAPIDAPI_KEY ||
  'f627be65a2mshfe6bd4a0cff94f1p16906fjsn66a6d43077ce';
const RAPIDAPI_HOST =
  process.env.RAPIDAPI_HOST || 'competitive-coding-api.p.rapidapi.com';
const LEETCODE_API_HOST = 'leetcodeapi.p.rapidapi.com';

const platformCache = new Map();

const BASE_WEIGHTS = {
  leetcode: 0.35,
  codeforces: 0.25,
  codechef: 0.15,
  hackerrank: 0.10
};
const OTHER_WEIGHT = 0.15;

const PLATFORM_DEFINITIONS = {
  leetcode: {
    id: 'leetcode',
    label: 'LeetCode',
    domains: ['leetcode.com'],
    accentColor: '#f89f1b',
    ratingRange: { min: 0, max: 3000 },
    profileUrl: (username) => `https://leetcode.com/${username}`,
    fetcher: fetchLeetCode
  },
  codeforces: {
    id: 'codeforces',
    label: 'Codeforces',
    domains: ['codeforces.com'],
    accentColor: '#2563eb',
    ratingRange: { min: 0, max: 4000 },
    profileUrl: (username) => `https://codeforces.com/profile/${username}`,
    fetcher: fetchCodeforces
  },
  codechef: {
    id: 'codechef',
    label: 'CodeChef',
    domains: ['codechef.com'],
    accentColor: '#8b5a2b',
    ratingRange: { min: 0, max: 3600 },
    profileUrl: (username) => `https://www.codechef.com/users/${username}`,
    fetcher: fetchCodeChef
  },
  hackerrank: {
    id: 'hackerrank',
    label: 'HackerRank',
    domains: ['hackerrank.com'],
    accentColor: '#16a34a',
    ratingRange: { min: 0, max: 5000 },
    profileUrl: (username) => `https://www.hackerrank.com/${username}`,
    fetcher: fetchHackerRank
  },
  hackerearth: {
    id: 'hackerearth',
    label: 'HackerEarth',
    domains: ['hackerearth.com'],
    accentColor: '#1d4ed8',
    ratingRange: { min: 0, max: 3000 },
    profileUrl: (username) => `https://www.hackerearth.com/@${username}`,
    fetcher: (username) => fetchFromCompetitiveApi('hackerearth', username)
  },
  spoj: {
    id: 'spoj',
    label: 'Spoj',
    domains: ['spoj.com'],
    accentColor: '#ec4899',
    ratingRange: { min: 0, max: 3000 },
    profileUrl: (username) => `https://www.spoj.com/users/${username}/`,
    fetcher: (username) => fetchFromCompetitiveApi('spoj', username)
  },
  interviewbit: {
    id: 'interviewbit',
    label: 'InterviewBit',
    domains: ['interviewbit.com'],
    accentColor: '#9333ea',
    ratingRange: { min: 0, max: 6000 },
    profileUrl: (username) => `https://www.interviewbit.com/profile/${username}`,
    fetcher: (username) => fetchFromCompetitiveApi('interviewbit', username)
  },
  atcoder: {
    id: 'atcoder',
    label: 'AtCoder',
    domains: ['atcoder.jp'],
    accentColor: '#0ea5e9',
    ratingRange: { min: 0, max: 4000 },
    profileUrl: (username) => `https://atcoder.jp/users/${username}`,
    fetcher: (username) => fetchFromCompetitiveApi('atcoder', username)
  },
  smartinterviews: {
    id: 'smartinterviews',
    label: 'SmartInterviews',
    domains: ['smartinterviews.in', 'smartinterviews.com'],
    accentColor: '#e11d48',
    ratingRange: { min: 0, max: 100 },
    profileUrl: (username) => username,
    fetcher: async (username) => ({
      platformId: 'smartinterviews',
      username,
      warning: 'SmartInterviews API is not yet available. Data will appear once the platform provides public stats.'
    })
  },
  github: {
    id: 'github',
    label: 'GitHub',
    domains: ['github.com'],
    accentColor: '#0f172a',
    ratingRange: { min: 0, max: 5000 },
    profileUrl: (username) => `https://github.com/${username}`,
    fetcher: fetchGitHub
  }
};

const DOMAIN_PLATFORM_MAP = Object.values(PLATFORM_DEFINITIONS).reduce(
  (acc, platform) => {
    platform.domains?.forEach((domain) => {
      acc.set(domain, platform.id);
    });
    return acc;
  },
  new Map()
);

function buildSparkline(value = 1500, points = 12, variance = 0.08) {
  const result = [];
  let current = value || 1500;
  const labels = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];
  for (let i = points - 1; i >= 0; i -= 1) {
    current = Math.max(
      0,
      Math.round(
        current * (1 - variance / 2 + Math.random() * variance)
      )
    );
    result.unshift({ label: labels[(12 - i) % labels.length], value: current });
  }
  return result;
}

function normalizeValue(value, min, max) {
  if (value === null || value === undefined) return 0;
  if (max - min === 0) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

function detectPlatformFromUrl(url = '') {
  if (!url) return null;
  try {
    const target = new URL(url.startsWith('http') ? url : `https://${url}`);
    const domain = target.hostname.replace('www.', '');

    const platformId =
      DOMAIN_PLATFORM_MAP.get(domain) ||
      Array.from(DOMAIN_PLATFORM_MAP.entries()).find(([key]) =>
        domain.endsWith(key)
      )?.[1];

    if (!platformId) return null;

    return PLATFORM_DEFINITIONS[platformId];
  } catch (error) {
    return null;
  }
}

function extractUsernameFromUrl(url = '', platformId) {
  if (!url) return null;
  const platform = PLATFORM_DEFINITIONS[platformId];
  if (!platform) return null;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const segments = parsed.pathname.split('/').filter(Boolean);
    return segments.pop() || null;
  } catch (error) {
    const segments = url.split('/').filter(Boolean);
    return segments.pop() || null;
  }
}

async function withRetries(fn, retries = MAX_RETRIES) {
  let attempt = 0;
  let lastError;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt > retries) break;
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }
  throw lastError;
}

async function fetchPlatformPayload(platformId, username) {
  if (!platformId || !username) {
    return null;
  }
  const key = `${platformId}:${username.toLowerCase()}`;
  const cached = platformCache.get(key);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.payload;
  }

  const platform = PLATFORM_DEFINITIONS[platformId];
  if (!platform) {
    return {
      platformId,
      username,
      warning: 'Unsupported platform'
    };
  }

  try {
    const payload = await withRetries(() =>
      platform.fetcher(username, platform)
    );
    platformCache.set(key, { fetchedAt: now, payload });
    return payload;
  } catch (error) {
    const warning = error?.message || 'Failed to fetch platform data';
    platformCache.set(key, {
      fetchedAt: now,
      payload: { platformId, username, warning }
    });
    return { platformId, username, warning };
  }
}

async function fetchPlatforms(entries = []) {
  if (!entries.length) return [];
  const unique = Array.from(
    new Map(
      entries.map((entry) => [
        `${entry.platformId}:${(entry.username || '').toLowerCase()}`,
        entry
      ])
    ).values()
  );

  const payloads = await Promise.all(
    unique.map((entry) =>
      fetchPlatformPayload(entry.platformId, entry.username)
    )
  );

  return payloads
    .map((payload, index) => ({
      ...payload,
      platformId: payload?.platformId || unique[index].platformId,
      username: payload?.username || unique[index].username,
      profileUrl:
        payload?.profileUrl ||
        PLATFORM_DEFINITIONS[unique[index].platformId]?.profileUrl?.(
          unique[index].username
        )
    }))
    .filter(Boolean);
}

function calculatePlatformScores(platforms = []) {
  const summaries = [];
  const others = platforms.filter(
    (entry) => !BASE_WEIGHTS[entry.platformId]
  );
  const otherWeightShare =
    others.length > 0 ? OTHER_WEIGHT / others.length : 0;

  platforms.forEach((entry) => {
    const definition = PLATFORM_DEFINITIONS[entry.platformId] || {};
    const weight =
      BASE_WEIGHTS[entry.platformId] !== undefined
        ? BASE_WEIGHTS[entry.platformId]
        : otherWeightShare;
    const normalized = normalizeValue(
      entry.currentRating ?? entry.points ?? entry.solvedProblems,
      definition.ratingRange?.min ?? 0,
      definition.ratingRange?.max ?? 3000
    );
    summaries.push({
      ...entry,
      weightApplied: weight,
      normalizedScore: normalized,
      weightedScore: normalized * weight
    });
  });

  const aggregateScore = summaries.reduce(
    (sum, item) => sum + (item.weightedScore || 0),
    0
  );

  const scoreDistribution = summaries.map((entry) => ({
    name: PLATFORM_DEFINITIONS[entry.platformId]?.label || entry.platformId,
    value: Math.round((entry.weightedScore || 0) * 100000),
    color: PLATFORM_DEFINITIONS[entry.platformId]?.accentColor
  }));

  return {
    summaries,
    scoreDistribution,
    displayScore: Math.round(aggregateScore * 100000)
  };
}

async function fetchLeetCode(username) {
  if (!username) return null;
  
  // Try RapidAPI first, fallback to herokuapp if it fails
  try {
    const { data } = await axios.get(
      `https://${LEETCODE_API_HOST}/${encodeURIComponent(username)}`,
      {
        timeout: 8000,
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': LEETCODE_API_HOST
        }
      }
    );

    console.log(`LeetCode RapidAPI response for ${username}:`, JSON.stringify(data).substring(0, 200));

    // Parse RapidAPI response - handle different response structures
    if (data) {
      // Try to extract rating from various possible fields
      const rating = data.rating ?? data.contestRating ?? data.contestRanking ?? data.currentRating ?? null;
      const maxRating = data.highestRating ?? data.maxRating ?? data.highestContestRating ?? rating ?? null;
      const contests = data.contestsAttended ?? data.totalContests ?? data.contests ?? null;
      const solved = data.totalSolved ?? data.problemsSolved ?? data.solvedProblems ?? null;
      
      return {
        platformId: 'leetcode',
        username,
        currentRating: rating,
        highestRating: maxRating,
        totalContests: contests,
        solvedProblems: solved,
        ratingChange: data.ratingChange ?? null,
        points: (rating ?? 0) * 0.3 + (solved ?? 0) * 2,
        badges: data.badges || [],
        lastActivity: data.lastActivity ? new Date(data.lastActivity) : null,
        history: buildSparkline(rating || solved || 1500)
      };
    }
  } catch (rapidApiError) {
    console.log(`RapidAPI LeetCode fetch failed for ${username}, trying fallback:`, rapidApiError.message);
    if (rapidApiError.response) {
      console.log('RapidAPI error response:', rapidApiError.response.status, rapidApiError.response.data);
    }
  }

  // Fallback to herokuapp API
  try {
    const { data } = await axios.get(
      `https://leetcode-stats-api.herokuapp.com/${encodeURIComponent(
        username
      )}`,
      { timeout: 8000 }
    );

    if (!data || data.status === 'error') {
      throw new Error(data?.message || 'LeetCode API error');
    }

    return {
      platformId: 'leetcode',
      username,
      currentRating: data.contestRanking ?? data.contestRating ?? null,
      highestRating: data.contestRanking ?? data.contestRating ?? null,
      totalContests: data.contestAttended ?? null,
      solvedProblems: data.totalSolved ?? null,
      ratingChange: data.contestRanking ?? null,
      points: (data.contestRanking ?? 0) * 0.3 + (data.totalSolved ?? 0) * 2,
      badges: data.badges?.map((badge) => badge.displayName) || [],
      lastActivity: data.recentSubmissions?.[0]?.timestamp
        ? new Date(Number(data.recentSubmissions[0].timestamp) * 1000)
        : null,
      history: buildSparkline(data.contestRanking || data.totalSolved || 1500)
    };
  } catch (error) {
    return {
      platformId: 'leetcode',
      username,
      warning: error.response?.data?.message || error.message
    };
  }
}

async function fetchHackerRank(username) {
  if (!username) return null;
  try {
    const { data } = await axios.get(
      `https://www.hackerrank.com/rest/contests/master/hackers/${encodeURIComponent(
        username
      )}/profile`,
      { timeout: 8000 }
    );

    if (!data?.model) {
      throw new Error('No HackerRank profile data');
    }

    const model = data.model;

    return {
      platformId: 'hackerrank',
      username,
      currentRating: model.hacker?.rating ?? null,
      highestRating: model.hacker?.rating ?? null,
      totalContests: model.contest_participation_count ?? null,
      solvedProblems: model.total_submissions ?? null,
      ratingChange: null,
      badges: model.badges?.map((badge) => badge.name) || [],
      lastActivity: model.last_submission?.time
        ? new Date(model.last_submission.time)
        : null,
      history: buildSparkline(model.hacker?.rating || 1200)
    };
  } catch (error) {
    return {
      platformId: 'hackerrank',
      username,
      warning: error.message
    };
  }
}

async function fetchCodeforces(username) {
  if (!username) return null;
  try {
    const { data } = await axios.get(
      `https://codeforces.com/api/user.info?handles=${encodeURIComponent(
        username
      )}`,
      { timeout: 8000 }
    );

    if (data?.status !== 'OK' || !data?.result?.length) {
      throw new Error('Codeforces API error');
    }

    const profile = data.result[0];

    let contestCount = null;
    let lastActivity = null;
    let ratingChange = null;
    let ratingHistory = [];
    
    try {
      const contestData = await axios.get(
        `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(
          username
        )}`,
        { timeout: 8000 }
      );
      if (contestData?.data?.status === 'OK' && contestData.data.result) {
        const contests = contestData.data.result;
        contestCount = contests.length || 0;
        
        if (contests.length > 0) {
          const lastContest = contests[contests.length - 1];
          const previousContest = contests.length > 1 ? contests[contests.length - 2] : null;
          
          // Calculate rating change from last contest
          if (previousContest && lastContest.newRating && previousContest.newRating) {
            ratingChange = lastContest.newRating - previousContest.newRating;
          } else if (lastContest.newRating && profile.rating) {
            // If only one contest, compare with current rating
            ratingChange = profile.rating - lastContest.newRating;
          }
          
          if (lastContest?.ratingUpdateTimeSeconds) {
            lastActivity = new Date(
              lastContest.ratingUpdateTimeSeconds * 1000
            );
          }
          
          // Build real rating history from contest data
          ratingHistory = contests.slice(-12).map(contest => ({
            name: new Date(contest.ratingUpdateTimeSeconds * 1000).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            rating: contest.newRating || contest.oldRating || 0
          }));
        }
      }
    } catch (err) {
      console.warn('[CodingStats] Codeforces rating history failed:', err.message);
    }

    return {
      platformId: 'codeforces',
      username,
      currentRating: profile.rating ?? null,
      highestRating: profile.maxRating ?? profile.rating ?? null,
      totalContests: contestCount,
      solvedProblems: null,
      ratingChange: ratingChange,
      badges: [profile.rank, profile.maxRank].filter(Boolean),
      lastActivity,
      history: ratingHistory.length > 0 ? ratingHistory : buildSparkline(profile.rating || 1600)
    };
  } catch (error) {
    return {
      platformId: 'codeforces',
      username,
      warning: error.message
    };
  }
}

async function fetchCodeChef(username) {
  if (!username) return null;
  try {
    const { data } = await axios.get(
      `https://codechef-api.vercel.app/${encodeURIComponent(username)}`,
      { timeout: 8000 }
    );

    if (!data || data.success === false) {
      throw new Error(data?.message || 'CodeChef API error');
    }

    let highestRating = data.rating ?? null;
    if (data.contestRatings && data.contestRatings.length > 0) {
      const ratings = data.contestRatings
        .map((cr) => cr.rating)
        .filter(Boolean);
      if (ratings.length > 0) {
        highestRating = Math.max(...ratings, data.rating || 0);
      }
    }

    const lastContest = data.contestRatings?.[data.contestRatings.length - 1];

    return {
      platformId: 'codechef',
      username,
      currentRating: data.rating ?? null,
      highestRating,
      totalContests: data.contestRatings?.length ?? null,
      solvedProblems: null,
      ratingChange:
        lastContest?.rating && data.rating
          ? data.rating - lastContest.rating
          : null,
      badges: data.badges || [],
      lastActivity: lastContest?.date ? new Date(lastContest.date) : null,
      history: buildSparkline(data.rating || 1600)
    };
  } catch (error) {
    return {
      platformId: 'codechef',
      username,
      warning: error.message
    };
  }
}

async function fetchFromCompetitiveApi(platformKey, username) {
  if (!username) return null;
  if (!RAPIDAPI_KEY) {
    return {
      platformId: platformKey,
      username,
      warning: 'RapidAPI key missing. Set RAPIDAPI_KEY in server environment.'
    };
  }
  try {
    const { data } = await axios.get(
      `https://${RAPIDAPI_HOST}/api/${platformKey}/${encodeURIComponent(
        username
      )}`,
      {
        timeout: 8000,
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        }
      }
    );
    if (!data || (data.status && data.status !== 'Success')) {
      throw new Error(data?.message || `${platformKey} API error`);
    }
    return {
      platformId: platformKey,
      username,
      currentRating: data.rating ?? data.current_rating ?? null,
      highestRating: data.highest ?? data.highest_rating ?? null,
      totalContests: data.contests_attended ?? data.contests ?? null,
      solvedProblems: data.problems_solved ?? data.solved ?? null,
      ratingChange: data.rating_change ?? null,
      badges: data.badges || [],
      lastActivity: data.last_online ? new Date(data.last_online) : null,
      history: buildSparkline(data.rating || 1400)
    };
  } catch (error) {
    return {
      platformId: platformKey,
      username,
      warning: error.response?.data?.message || error.message
    };
  }
}

async function fetchGitHub(username) {
  if (!username) return null;
  try {
    const { data } = await axios.get(
      `https://api.github.com/users/${encodeURIComponent(username)}`,
      { timeout: 8000, headers: { 'User-Agent': 'placement-hub' } }
    );
    return {
      platformId: 'github',
      username,
      currentRating: data.followers ?? null,
      highestRating: data.followers ?? null,
      totalContests: data.public_repos ?? null,
      solvedProblems: data.public_gists ?? null,
      ratingChange: null,
      badges: [],
      lastActivity: data.updated_at ? new Date(data.updated_at) : null,
      history: buildSparkline(data.followers || 50)
    };
  } catch (error) {
    return {
      platformId: 'github',
      username,
      warning: error.message
    };
  }
}

async function fetchCodingStats(handles = {}) {
  const entries = [];
  
  // Fetch CodeChef, Codeforces, LeetCode, and HackerRank
  if (handles.codechef) {
    entries.push({ platformId: 'codechef', username: handles.codechef });
  }
  if (handles.codeforces) {
    entries.push({ platformId: 'codeforces', username: handles.codeforces });
  }
  if (handles.leetcode) {
    entries.push({ platformId: 'leetcode', username: handles.leetcode });
  }
  if (handles.hackerrank) {
    entries.push({ platformId: 'hackerrank', username: handles.hackerrank });
  }
  
  if (entries.length === 0) {
    return {
      codechef: null,
      codeforces: null,
      leetcode: null,
      hackerrank: null
    };
  }
  
  const platforms = await fetchPlatforms(entries);
  
  const result = {
    codechef: null,
    codeforces: null,
    leetcode: null,
    hackerrank: null
  };
  
  platforms.forEach(platform => {
    if (platform.platformId === 'codechef') {
      result.codechef = {
        contestRating: platform.currentRating,
        highestRating: platform.highestRating,
        contests: platform.totalContests || 0,
        ratingChange: platform.ratingChange || 0,
        ratingHistory: platform.history || [],
        points: platform.points || 0,
        warning: platform.warning || null
      };
    } else if (platform.platformId === 'codeforces') {
      result.codeforces = {
        contestRating: platform.currentRating,
        highestRating: platform.highestRating,
        contests: platform.totalContests || 0,
        ratingChange: platform.ratingChange || 0,
        ratingHistory: platform.history || [],
        points: platform.points || 0,
        warning: platform.warning || null
      };
    } else if (platform.platformId === 'leetcode') {
      result.leetcode = {
        contestRating: platform.currentRating,
        highestRating: platform.highestRating,
        contests: platform.totalContests || 0,
        ratingChange: platform.ratingChange || 0,
        ratingHistory: platform.history || [],
        problemsSolved: platform.solvedProblems,
        points: platform.points || (platform.solvedProblems ? platform.solvedProblems * 10 : 0),
        warning: platform.warning || null
      };
    } else if (platform.platformId === 'hackerrank') {
      result.hackerrank = {
        points: platform.points || platform.currentRating || 0,
        solvedProblems: platform.solvedProblems,
        warning: platform.warning || null
      };
    }
  });
  
  return result;
}

module.exports = {
  PLATFORM_DEFINITIONS,
  BASE_WEIGHTS,
  OTHER_WEIGHT,
  detectPlatformFromUrl,
  extractUsernameFromUrl,
  fetchPlatforms,
  calculatePlatformScores,
  fetchCodingStats
};
