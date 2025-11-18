const mongoose = require('mongoose');

const LeaderboardEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaderboardProfile', index: true },
    name: String,
    username: String,
    avatarUrl: String,
    company: String,
    points: Number,
    rank: Number
  },
  { _id: false }
);

const LeaderboardCacheSchema = new mongoose.Schema(
  {
    period: {
      type: String,
      enum: ['today', 'month', 'year'],
      required: true,
      index: true
    },
    generatedAt: { type: Date, default: Date.now, index: true },
    entries: [LeaderboardEntrySchema]
  },
  { timestamps: true }
);

LeaderboardCacheSchema.index({ period: 1, generatedAt: -1 });

module.exports = mongoose.model('LeaderboardCache', LeaderboardCacheSchema);


