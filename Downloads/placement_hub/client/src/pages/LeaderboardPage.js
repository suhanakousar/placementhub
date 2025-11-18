import React, { useEffect, useState } from 'react';
import Leaderboard from '../components/Leaderboard/Leaderboard';
import {
  fetchLeaderboard,
  fetchLeaderboardProfile
} from '../utils/leaderboardApi';

const PAGE_SIZE = 20;

export default function LeaderboardPage() {
  const [period, setPeriod] = useState('today');
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [highlightedUser, setHighlightedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchLeaderboard(period, page, PAGE_SIZE);
        const mappedEntries = (data.entries || []).map((entry) => ({
          ...entry,
          onClick: () => handleSelectUser(entry)
        }));

        setEntries(mappedEntries);
        setTotal(data.total || 0);

        if (!highlightedUser && data.entries && data.entries.length > 0) {
          handleSelectUser(data.entries[0], { replace: true });
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load leaderboard.');
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, page]);

  async function handleSelectUser(entry, options = {}) {
    try {
      const profile = await fetchLeaderboardProfile(entry.userId || entry._id);
      setHighlightedUser({
        ...profile,
        rank: entry.rank
      });
    } catch (err) {
      console.error(err);
      if (!options.replace) {
        setHighlightedUser((prev) => prev || null);
      }
    }
  }

  function handlePeriodChange(newPeriod) {
    setPeriod(newPeriod);
    setPage(1);
  }

  function handleSearch(value) {
    setSearchTerm(value);
  }

  const filteredEntries = entries.filter((entry) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      entry.name.toLowerCase().includes(term) ||
      entry.username?.toLowerCase().includes(term)
    );
  });

  return (
    <>
      {loading && (
        <div className="fixed inset-x-0 top-0 z-50 flex justify-center">
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-900/90 border border-slate-700 px-4 py-1.5 text-xs text-slate-200 shadow-lg shadow-slate-950/60">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Loading leaderboard...
          </div>
        </div>
      )}
      {error && (
        <div className="fixed inset-x-0 top-0 z-50 flex justify-center">
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-900/90 border border-red-700 px-4 py-1.5 text-xs text-red-100 shadow-lg shadow-slate-950/60">
            {error}
          </div>
        </div>
      )}
      <Leaderboard
        highlightedUser={highlightedUser}
        entries={filteredEntries}
        onPeriodChange={handlePeriodChange}
        onSearch={handleSearch}
        page={page}
        total={total}
        limit={PAGE_SIZE}
        period={period}
        onPageChange={setPage}
        searchTerm={searchTerm}
      />
    </>
  );
}


