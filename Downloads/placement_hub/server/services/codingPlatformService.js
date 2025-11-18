const axios = require('axios');

async function fetchLeetCode(username) {
  if (!username) return null;
  try {
    const { data } = await axios.get(
      `https://leetcode-stats-api.herokuapp.com/${encodeURIComponent(username)}`,
      { timeout: 8000 }
    );

    if (!data || data.status === 'error') {
      throw new Error(data?.message || 'LeetCode API error');
    }

    return {
      username,
      problemsSolved: data.totalSolved,
      weeklySolved: data.weeklySolved ?? null,
      monthlySolved: data.monthlySolved ?? null,
      contestRating: data.contestRanking ?? data.contestRating ?? null,
      highestRating: data.contestRanking ?? data.contestRating ?? null, // LeetCode API doesn't provide max rating separately
      contests: data.contestAttended ?? null,
      percentile: data.ranking ? 100 - data.ranking / 1000 : null,
      badges: data.badges?.map((b) => b.displayName) || [],
      points: data.contributionPoints ?? null,
      lastSynced: new Date()
    };
  } catch (error) {
    console.error('[CodingStats] LeetCode fetch failed:', error.message);
    return {
      username,
      error: error.message
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

    const model = data?.model;
    if (!model) {
      throw new Error('No HackerRank profile data');
    }

    return {
      username,
      problemsSolved: model.total_submissions ?? null,
      contestRating: model.hacker?.rating ?? null,
      contests: model.contest_participation_count ?? null,
      percentile: model.percentile ?? null,
      badges: model.badges?.map((b) => b.name) || [],
      points: model.total_wins ?? null,
      lastSynced: new Date()
    };
  } catch (error) {
    console.error('[CodingStats] HackerRank fetch failed:', error.message);
    return {
      username,
      error: error.message
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

    // Fetch contest participation count separately
    let contestCount = null;
    try {
      const contestData = await axios.get(
        `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(username)}`,
        { timeout: 8000 }
      );
      if (contestData?.data?.status === 'OK') {
        contestCount = contestData.data.result?.length || 0;
      }
    } catch (err) {
      // If contest data fetch fails, continue without it
      console.log('Could not fetch Codeforces contest count');
    }

    return {
      username,
      contestRating: profile.rating ?? null,
      highestRating: profile.maxRating ?? profile.rating ?? null,
      contests: contestCount,
      percentile: profile.maxRank ?? null,
      badges: [profile.rank, profile.maxRank].filter(Boolean),
      points: profile.contribution ?? null,
      lastSynced: new Date()
    };
  } catch (error) {
    console.error('[CodingStats] Codeforces fetch failed:', error.message);
    return {
      username,
      error: error.message
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

    // Calculate highest rating from contest ratings if available
    let highestRating = data.rating ?? null;
    if (data.contestRatings && data.contestRatings.length > 0) {
      const ratings = data.contestRatings.map(cr => cr.rating).filter(Boolean);
      if (ratings.length > 0) {
        highestRating = Math.max(...ratings, data.rating || 0);
      }
    }

    return {
      username,
      contestRating: data.rating ?? null,
      highestRating: highestRating,
      contests: data.contestRatings?.length ?? null,
      percentile: data.rankings?.global ?? null,
      badges: data.badges || [],
      points: data.rating ?? null,
      lastSynced: new Date()
    };
  } catch (error) {
    console.error('[CodingStats] CodeChef fetch failed:', error.message);
    return {
      username,
      error: error.message
    };
  }
}

async function fetchGeeksForGeeks(username) {
  if (!username) return null;
  try {
    const { data } = await axios.get(
      `https://geeks-for-geeks-api.onrender.com/getUserData?userName=${encodeURIComponent(
        username
      )}`,
      { timeout: 8000 }
    );

    if (!data || data.status !== 'success') {
      throw new Error(data?.message || 'GfG API error');
    }

    return {
      username,
      problemsSolved: data.data?.codingProblem ?? null,
      contests: data.data?.contestAttended ?? null,
      badges: data.data?.badges || [],
      points: data.data?.score ?? null,
      lastSynced: new Date()
    };
  } catch (error) {
    console.error('[CodingStats] GeeksForGeeks fetch failed:', error.message);
    return {
      username,
      error: error.message
    };
  }
}

async function fetchCodingStats(handles = {}) {
  const [
    leetcode,
    hackerrank,
    codechef,
    codeforces,
    geeksforgeeks
  ] = await Promise.all([
    fetchLeetCode(handles.leetcode),
    fetchHackerRank(handles.hackerrank),
    fetchCodeChef(handles.codechef),
    fetchCodeforces(handles.codeforces),
    fetchGeeksForGeeks(handles.geeksforgeeks)
  ]);

  const codingStats = {};

  if (leetcode) codingStats.leetcode = leetcode;
  if (hackerrank) codingStats.hackerrank = hackerrank;
  if (codechef) codingStats.codechef = codechef;
  if (codeforces) codingStats.codeforces = codeforces;
  if (geeksforgeeks) codingStats.geeksforgeeks = geeksforgeeks;

  return codingStats;
}

module.exports = {
  fetchCodingStats
};


