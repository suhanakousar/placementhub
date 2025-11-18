const express = require('express');
const axios = require('axios');
const LeaderboardProfile = require('../models/LeaderboardProfile');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

async function findProfileByParam(id) {
  return (
    (await LeaderboardProfile.findOne({ userId: id })) ||
    (await LeaderboardProfile.findById(id))
  );
}

router.get('/:id/profile', async (req, res) => {
  try {
    const profile = await findProfileByParam(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'User not found in leaderboard' });
    }

    res.json({
      id: profile._id,
      userId: profile.userId,
      name: profile.name,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      company: profile.company,
      location: profile.location,
      badges: profile.badges,
      points: profile.points,
      metadata: profile.metadata,
      profileLinks: profile.profileLinks
    });
  } catch (error) {
    console.error('[Leaderboard] GET /api/users/:id/profile error:', error);
    res.status(500).json({ message: 'Failed to load user profile' });
  }
});

router.post(
  '/:id/fetch-links',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const profile = await findProfileByParam(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: 'User not found in leaderboard' });
      }

      const results = [];
      for (const link of profile.profileLinks || []) {
        try {
          const response = await axios.get(link, { timeout: 8000 });
          results.push({
            link,
            status: response.status,
            length:
              typeof response.data === 'string'
                ? response.data.length
                : JSON.stringify(response.data).length
          });
        } catch (error) {
          results.push({
            link,
            error: error.message
          });
        }
      }

      profile.metadata = {
        ...(profile.metadata || {}),
        externalFetch: {
          fetchedAt: new Date(),
          results
        }
      };

      await profile.save();

      res.json({
        message: 'Fetched external data from student links (admin only)',
        results
      });
    } catch (error) {
      console.error('[Leaderboard] POST /api/users/:id/fetch-links error:', error);
      res.status(500).json({ message: 'Failed to fetch external links' });
    }
  }
);

module.exports = router;


