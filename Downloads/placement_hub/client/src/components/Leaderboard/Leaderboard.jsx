import React, { useEffect, useMemo, useState } from 'react';

const PERIOD_TABS = [
  { id: 'today', label: 'Today' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' }
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function rankStyle(rank) {
  if (rank === 1) {
    return 'border-amber-400/60 bg-gradient-to-r from-amber-500/10 to-yellow-300/5 shadow-[0_0_40px_rgba(251,191,36,0.25)]';
  }
  if (rank === 2) {
    return 'border-slate-200/60 bg-gradient-to-r from-slate-200/10 to-slate-50/5';
  }
  if (rank === 3) {
    return 'border-orange-400/60 bg-gradient-to-r from-orange-500/10 to-amber-400/5';
  }
  return 'border-slate-800/80 bg-slate-900/60';
}

export default function Leaderboard({
  highlightedUser,
  entries,
  onPeriodChange,
  onSearch,
  page,
  total,
  limit,
  period,
  onPageChange,
  searchTerm
}) {
  const [localSearch, setLocalSearch] = useState(searchTerm || '');

  useEffect(() => {
    setLocalSearch(searchTerm || '');
  }, [searchTerm]);

  const totalPages = useMemo(
    () => (total && limit ? Math.max(1, Math.ceil(total / limit)) : 1),
    [total, limit]
  );

  function handleSearchSubmit(e) {
    e.preventDefault();
    onSearch?.(localSearch);
  }

  return (
    <div className="min-h-screen w-full flex items-start justify-center px-4 py-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)] gap-6">
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl shadow-slate-950/60 p-6 flex flex-col gap-6">
          <header className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-50 tracking-tight">Highlighted Profile</h1>
              <p className="text-sm text-slate-400 mt-1">
                Focus on a single student&apos;s progress and ranking.
              </p>
            </div>
            {highlightedUser?.rank && (
              <div className="flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/10 px-4 py-1.5">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-xs font-medium text-emerald-200">Rank #{highlightedUser.rank}</p>
              </div>
            )}
          </header>

          {highlightedUser ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={
                      highlightedUser.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        highlightedUser.name
                      )}&background=0f172a&color=e5e7eb`
                    }
                    alt={highlightedUser.name}
                    className="h-20 w-20 rounded-2xl border border-slate-700 object-cover"
                  />
                  <span className="absolute -bottom-1 -right-1 inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-amber-300">
                    #{highlightedUser.rank}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-slate-50">{highlightedUser.name}</p>
                  {highlightedUser.username && (
                    <p className="text-sm text-slate-400">@{highlightedUser.username}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    {highlightedUser.company && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2.5 py-1 border border-slate-700 text-slate-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {highlightedUser.company}
                      </span>
                    )}
                    {highlightedUser.location && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2.5 py-1 border border-slate-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        {highlightedUser.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-2">
                <div className="rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Today</p>
                  <p className="mt-1 text-xl font-semibold text-slate-50">
                    {highlightedUser.points?.today ?? 0}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">This Month</p>
                  <p className="mt-1 text-xl font-semibold text-slate-50">
                    {highlightedUser.points?.month ?? 0}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Total</p>
                  <p className="mt-1 text-xl font-semibold text-amber-300">
                    {highlightedUser.points?.total ?? highlightedUser.points?.year ?? 0}
                  </p>
                </div>
              </div>

              {Array.isArray(highlightedUser.badges) && highlightedUser.badges.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-slate-400 mb-1.5">Badges</p>
                  <div className="flex flex-wrap gap-2">
                    {highlightedUser.badges.map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/40 text-[11px] font-medium text-amber-200 px-2.5 py-1"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Select a user from the leaderboard to see their profile details.
            </p>
          )}
        </section>

        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl shadow-slate-950/60 p-6 flex flex-col gap-4">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-50 tracking-tight">Leaderboard</h2>
              <p className="text-sm text-slate-400 mt-1">
                Live rankings based on SmartInterviews-style scoring.
              </p>
            </div>
            <div className="inline-flex items-center rounded-full bg-slate-900 px-1 py-1 border border-slate-800 shadow-sm">
              {PERIOD_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onPeriodChange?.(tab.id)}
                  className={classNames(
                    'px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors',
                    period === tab.id
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-400 hover:text-slate-100'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </header>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 mt-2">
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
                placeholder="Search by name or username..."
                className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3.5 py-2.5 pr-9 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500/60"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center text-slate-500 text-xs">
                ⌕
              </span>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-3.5 py-2.5 text-xs font-semibold text-emerald-950 shadow-lg shadow-emerald-500/40 hover:bg-emerald-400 transition-colors"
            >
              Search
            </button>
          </form>

          <div className="mt-3 -mx-2 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
            <div className="hidden md:grid grid-cols-[60px_minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.2fr)] gap-2 px-4 py-2.5 bg-slate-950/60 text-[11px] font-medium uppercase tracking-wide text-slate-500 border-b border-slate-800">
              <div>Rank</div>
              <div>Student</div>
              <div>Company</div>
              <div className="text-right">Points</div>
            </div>

            <ul className="divide-y divide-slate-800">
              {entries?.length ? (
                entries.map((entry) => (
                  <li
                    key={entry.userId || entry._id}
                    onClick={entry.onClick}
                    className={classNames('px-2 md:px-4 py-3 cursor-pointer transition-colors', 'hover:bg-slate-900/70')}
                  >
                    <div
                      className={classNames(
                        'grid grid-cols-[50px_minmax(0,2.4fr)_minmax(0,1.4fr)_minmax(0,1.1fr)] md:grid-cols-[60px_minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.2fr)] gap-2 items-center rounded-xl border px-2.5 md:px-3 py-2.5 md:py-3',
                        rankStyle(entry.rank)
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-slate-100">#{entry.rank}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <img
                          src={
                            entry.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              entry.name
                            )}&background=020617&color=e5e7eb`
                          }
                          alt={entry.name}
                          className="h-9 w-9 rounded-xl border border-slate-800 object-cover"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-50">{entry.name}</span>
                          {entry.username && (
                            <span className="text-xs text-slate-400">@{entry.username}</span>
                          )}
                        </div>
                      </div>

                      <div className="hidden sm:flex flex-col">
                        <span className="text-xs text-slate-300">{entry.company || '—'}</span>
                      </div>

                      <div className="flex items-center justify-end">
                        <span className="text-sm font-semibold text-emerald-300">{entry.points}</span>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-4 py-6 text-sm text-slate-400 text-center">
                  No results for this period / search.
                </li>
              )}
            </ul>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-400">
            <p>
              Page <span className="font-semibold text-slate-100">{page}</span> of{' '}
              <span className="font-semibold text-slate-100">{totalPages}</span>
            </p>
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => onPageChange?.(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-900/80"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-900/80"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


