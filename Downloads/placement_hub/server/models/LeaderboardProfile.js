const mongoose = require('mongoose');

const pointsSchema = new mongoose.Schema(
  {
    today: { type: Number, default: 0, index: true },
    month: { type: Number, default: 0, index: true },
    year: { type: Number, default: 0, index: true },
    total: { type: Number, default: 0, index: true }
  },
  { _id: false }
);

const leaderboardProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    name: { type: String, required: true, index: true },
    username: { type: String, index: true },
    avatarUrl: { type: String },
    company: { type: String },
    location: { type: String },
    badges: [{ type: String }],
    profileLinks: [{ type: String }],
    points: { type: pointsSchema, default: () => ({}) },
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

// Indexes for efficient leaderboard queries
leaderboardProfileSchema.index({ 'points.today': -1 });
leaderboardProfileSchema.index({ 'points.month': -1 });
leaderboardProfileSchema.index({ 'points.year': -1 });
leaderboardProfileSchema.index({ 'points.total': -1 });
leaderboardProfileSchema.index({ username: 1 });

module.exports = mongoose.model('LeaderboardProfile', leaderboardProfileSchema);


