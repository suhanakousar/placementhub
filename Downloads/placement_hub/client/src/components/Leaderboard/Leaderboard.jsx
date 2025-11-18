import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';

function formatValue(value, fallback = '—') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  return value;
}

function formatDate(value) {
  if (!value) return 'Not synced';
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export default function Leaderboard({
  students,
  selectedStudent,
  profileData,
  onSelectStudent,
  searchTerm,
  onSearch,
  page,
  total,
  limit,
  onPageChange,
  listLoading,
  profileLoading,
  onSyncCodingStats,
  syncing
}) {
  const [localSearch, setLocalSearch] = useState(searchTerm || '');

  useEffect(() => {
    setLocalSearch(searchTerm || '');
  }, [searchTerm]);

  const totalPages = useMemo(
    () => (total && limit ? Math.max(1, Math.ceil(total / limit)) : 1),
    [total, limit]
  );

  const codingProfiles = profileData?.codingProfiles || [];
  const progress = profileData?.progress || {};
  const leaderboardPoints = profileData?.leaderboard?.points || {};

  const scoreDistribution = useMemo(() => {
    const data = codingProfiles.map((profile) => ({
      name: profile.platform,
      value: profile.metrics.problemsSolved || profile.points || 0,
      color: profile.accentColor || '#6366F1'
    }));
    if (!data.length) {
      return [{ name: 'No data', value: 1, color: '#CBD5F5' }];
    }
    return data;
  }, [codingProfiles]);

  const globalRankingSeries = useMemo(() => {
    const rankings = profileData?.leaderboard?.rankings || {};
    const totalSolved = progress.totalProblemsSolved || 0;
    const basePoints = [
      Math.max(0, totalSolved - 60),
      Math.max(0, totalSolved - 30),
      totalSolved
    ];
    return basePoints.map((value, index) => ({
      name: ['Opening', 'Mid Term', 'Now'][index],
      solved: value,
      ranking: Object.values(rankings)[index] || null
    }));
  }, [progress.totalProblemsSolved, profileData?.leaderboard?.rankings]);

  const overallScore = useMemo(() => {
    const codingScore = codingProfiles.reduce(
      (sum, profile) =>
        sum +
        (profile.metrics.problemsSolved || 0) * 2 +
        (profile.metrics.contestRating || 0),
      0
    );
    return Math.round(codingScore || leaderboardPoints.total || 0);
  }, [codingProfiles, leaderboardPoints.total]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    onSearch?.(localSearch.trim());
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Student Coding Leaderboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Browse every registered student. Select a profile to review their coding platforms,
              score breakdowns, and overall progress trends.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Registered Students
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Search by name, roll number, or department to focus on specific cohorts.
              </p>
              <form onSubmit={handleSearchSubmit} className="mt-4 flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => {
                      setLocalSearch(e.target.value);
                      if (!e.target.value) {
                        onSearch?.('');
                      }
                    }}
                    placeholder="Search students..."
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 text-xs">
                    ⌕
                  </span>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold shadow hover:bg-primary-500 transition-colors"
                >
                  Search
                </button>
              </form>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
              {listLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="px-6 py-5 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2 mt-3" />
                  </div>
                ))
              ) : students?.length ? (
                students.map((student) => {
                  const isActive =
                    selectedStudent?.studentId === student.studentId;
                  return (
                    <button
                      key={student.studentId}
                      type="button"
                      onClick={() => onSelectStudent?.(student)}
                      className={`w-full text-left px-6 py-4 flex items-start gap-4 transition ${
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-500/10'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-200 overflow-hidden">
                          {student.avatarUrl ? (
                            <img
                              src={
                                student.avatarUrl.startsWith('http')
                                  ? student.avatarUrl
                                  : `${process.env.REACT_APP_API_URL?.replace('/api', '') || ''}/${student.avatarUrl}`
                              }
                              alt={student.fullName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            (student.fullName || 'NA')
                              .split(' ')
                              .map((part) => part[0])
                              .join('')
                              .slice(0, 2)
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {student.fullName || 'Unnamed Student'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {student.department || 'Department N/A'} ·{' '}
                          {student.rollNumber || 'Roll N/A'}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            Stage: {student.placementStage}
                          </span>
                          <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                            Profile {student.profileCompletion || 0}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Total Points
                        </p>
                        <p className="text-base font-semibold text-primary-600 dark:text-primary-300">
                          {student.points?.total ?? 0}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  No students matched your search.
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
              <p>
                Page <span className="font-semibold">{page}</span> of{' '}
                <span className="font-semibold">{totalPages}</span>
              </p>
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange?.(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onPageChange?.(Math.min(totalPages, page + 1))
                  }
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
            {profileLoading ? (
              <div className="space-y-5 animate-pulse">
                <div className="h-5 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded" />
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="h-24 bg-gray-100 dark:bg-gray-700 rounded-xl" />
                  ))}
                </div>
              </div>
            ) : profileData ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="col-span-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-white/20 overflow-hidden flex items-center justify-center text-lg font-semibold">
                        {profileData.student.avatarUrl ? (
                          <img
                            src={
                              profileData.student.avatarUrl.startsWith('http')
                                ? profileData.student.avatarUrl
                                : `${process.env.REACT_APP_API_URL?.replace('/api', '') || ''}/${profileData.student.avatarUrl}`
                            }
                            alt={profileData.student.fullName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (profileData.student.fullName || 'NA')
                            .split(' ')
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)
                        )}
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold">
                          {profileData.student.fullName}
                        </h2>
                        <p className="text-sm text-white/70">
                          {profileData.student.department} ·{' '}
                          {profileData.student.rollNumber || 'Roll N/A'}
                        </p>
                        <p className="text-sm text-white/70">
                          {profileData.student.email}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-right">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-white/70">
                          Overall Score
                        </p>
                        <p className="text-3xl font-bold">{overallScore}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-white/70">
                          Global Rank (Today)
                        </p>
                        <p className="text-3xl font-bold">
                          {profileData.leaderboard.rankings?.today || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-700">
                    <p className="text-xs uppercase font-medium text-gray-500 dark:text-gray-400">
                      Recent Education
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                      {profileData.student.department || 'Department'} • Year{' '}
                      {profileData.student.year || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Roll: {profileData.student.rollNumber || '—'}
                    </p>
                    <hr className="my-4 border-dashed border-gray-200 dark:border-gray-700" />
                    <div className="grid grid-cols-2 gap-3">
                      {['today', 'month', 'year', 'total'].map((period) => (
                        <div key={period}>
                          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {period === 'total'
                              ? 'Total Points'
                              : `${period} pts`}
                          </p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {profileData.leaderboard.points?.[period] ?? 0}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Global Rankings
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Based on problems solved
                      </span>
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={globalRankingSeries}>
                          <defs>
                            <linearGradient id="colorRank" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Tooltip
                            contentStyle={{
                              background: '#111827',
                              border: 'none',
                              borderRadius: '0.5rem',
                              color: '#fff'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="solved"
                            stroke="#6366F1"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRank)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Score Distribution
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Weighted by problems solved per platform
                      </p>
                      <div className="space-y-3">
                        {scoreDistribution.map((entry) => (
                          <div key={entry.name} className="flex items-center gap-3">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {entry.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {entry.value} pts
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="w-44 h-44">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={scoreDistribution}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={40}
                            outerRadius={80}
                            stroke="none"
                          >
                            {scoreDistribution.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Coding Platform Stats
                  </h3>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <p>Last sync: {formatDate(progress.lastSynced)}</p>
                    <button
                      type="button"
                      onClick={onSyncCodingStats}
                      disabled={syncing || profileLoading}
                      className="inline-flex items-center justify-center rounded-lg border border-primary-200 text-primary-600 px-3 py-1.5 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-50"
                    >
                      {syncing ? 'Syncing…' : 'Sync Latest Stats'}
                    </button>
                  </div>
                </div>

                {codingProfiles.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {codingProfiles.map((profile) => {
                      const metrics = profile.metrics;
                      const sparkline = [
                        { value: Math.max(0, (metrics.problemsSolved || 0) - 60) },
                        { value: Math.max(0, (metrics.problemsSolved || 0) - 30) },
                        { value: metrics.problemsSolved || 0 }
                      ];
                      return (
                        <div
                          key={profile.key}
                          className="rounded-2xl border border-gray-100 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-900"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {profile.platform}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {profile.username || 'Handle not provided'}
                              </p>
                            </div>
                            {profile.profileUrl && (
                              <a
                                href={profile.profileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold text-blue-600 hover:underline"
                              >
                                View Profile
                              </a>
                            )}
                          </div>
                          {profile.error && (
                            <p className="mt-2 text-xs text-red-500">
                              {profile.error}
                            </p>
                          )}
                          <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                            <div>
                              <p className="uppercase text-xs">Current Rating</p>
                              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                                {formatValue(metrics.contestRating)}
                              </p>
                            </div>
                            <div>
                              <p className="uppercase text-xs">Total Contests</p>
                              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                                {formatValue(metrics.contests)}
                              </p>
                            </div>
                            <div>
                              <p className="uppercase text-xs">Problems Solved</p>
                              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                                {formatValue(metrics.problemsSolved)}
                              </p>
                            </div>
                            <div>
                              <p className="uppercase text-xs">Weekly Change</p>
                              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                                {formatValue(metrics.weeklySolved)}
                              </p>
                            </div>
                          </div>
                          <div className="h-16 mt-3">
                            <ResponsiveContainer>
                              <AreaChart data={sparkline}>
                                <Area
                                  type="monotone"
                                  dataKey="value"
                                  stroke={profile.accentColor || '#6366F1'}
                                  fill={profile.accentColor || '#6366F1'}
                                  fillOpacity={0.15}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Last synced: {formatDate(metrics.lastSynced)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-600 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No coding platform data has been synced for this student yet.
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Progress Overview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Problems Solved
                      </p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-2">
                        {progress.totalProblemsSolved || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        +{progress.weeklySolved || 0} this week · +
                        {progress.monthlySolved || 0} this month
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Contests & Hackathons
                      </p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-2">
                        {progress.totalContests || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Hackathons: {progress.hackathonCount || 0}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Portfolio
                      </p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-2">
                        {progress.projectsCount || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Certifications: {progress.certificationCount || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                Select a student to view their detailed progress.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

