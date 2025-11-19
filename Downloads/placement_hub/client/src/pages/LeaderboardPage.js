import React from 'react';
import LeaderboardTable from '../components/Leaderboard/LeaderboardTable';

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            Dashboard Leaderboard
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Live ranking of every registered student. Click any row to open their
            real-time coding analytics in a new tab.
          </p>
        </div>
        <LeaderboardTable
          hideHeader
        />
      </div>
    </div>
  );
}
