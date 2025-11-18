import React, { useEffect, useMemo, useState } from 'react';

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

          <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-6 space-y-6">
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
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center text-lg font-semibold text-gray-600 dark:text-gray-200">
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
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {profileData.student.fullName}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {profileData.student.department} ·{' '}
                        {profileData.student.rollNumber || 'Roll N/A'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {profileData.student.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['today', 'month', 'year'].map((period) => (
                      <div
                        key={period}
                        className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-200"
                      >
                        {period.charAt(0).toUpperCase() + period.slice(1)} Rank:{' '}
                        {profileData.leaderboard.rankings?.[period] || '—'}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {['today', 'month', 'year', 'total'].map((period) => (
                    <div
                      key={period}
                      className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4"
                    >
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {period === 'total'
                          ? 'Total Points'
                          : `${period.charAt(0).toUpperCase() + period.slice(1)} Points`}
                      </p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-2">
                        {profileData.leaderboard.points?.[period] ?? 0}
                      </p>
                    </div>
                  ))}
                </div>

                <div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Coding Platform Stats
                    </h3>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <p className="text-gray-500 dark:text-gray-400">
                      Last sync: {formatDate(progress.lastSynced)}
                    </p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {codingProfiles.map((profile) => (
                        <div
                          key={profile.key}
                          className="rounded-2xl border border-gray-100 dark:border-gray-700 p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
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
                                className="text-xs font-medium text-primary-600 hover:underline"
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
                          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500 dark:text-gray-400">
                                Problems Solved
                              </p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {formatValue(profile.metrics.problemsSolved)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-gray-400">
                                Contest Rating
                              </p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {formatValue(profile.metrics.contestRating)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-gray-400">
                                Contests
                              </p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {formatValue(profile.metrics.contests)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-gray-400">
                                Weekly Solved
                              </p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {formatValue(profile.metrics.weeklySolved)}
                              </p>
                            </div>
                          </div>
                          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                            Last synced: {formatDate(profile.metrics.lastSynced)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-600 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No coding platform data has been synced for this student yet.
                    </div>
                  )}
                </div>

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

