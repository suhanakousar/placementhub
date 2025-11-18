import React, { useCallback, useEffect, useRef, useState } from 'react';
import Leaderboard from '../components/Leaderboard/Leaderboard';
import {
  fetchRegisteredStudents,
  fetchStudentProgress,
  syncStudentCodingStats
} from '../utils/leaderboardApi';

const PAGE_SIZE = 15;

export default function LeaderboardPage() {
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedStudentSummary, setSelectedStudentSummary] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [listLoading, setListLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const selectedStudentIdRef = useRef(null);

  useEffect(() => {
    selectedStudentIdRef.current = selectedStudentId;
  }, [selectedStudentId]);

  useEffect(() => {
    async function loadStudents() {
      try {
        setListLoading(true);
        setError(null);
        const data = await fetchRegisteredStudents({
          search: searchTerm,
          page,
          limit: PAGE_SIZE
        });
        setStudents(data.students || []);
        setTotal(data.total || 0);

        if (!data.students?.length) {
          setSelectedStudentSummary(null);
          setSelectedStudentId(null);
          setProfileData(null);
          return;
        }

        const existingSelection =
          data.students.find(
            (student) => student.studentId === selectedStudentIdRef.current
          ) || data.students[0];

        setSelectedStudentSummary(existingSelection);
        if (selectedStudentIdRef.current !== existingSelection.studentId) {
          setSelectedStudentId(existingSelection.studentId);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load students.');
      } finally {
        setListLoading(false);
      }
    }
    loadStudents();
  }, [page, searchTerm]);

  const loadProfileData = useCallback(
    async (studentId, { showLoader = true } = {}) => {
      if (!studentId) return;
      if (showLoader) setProfileLoading(true);
      try {
        const data = await fetchStudentProgress(studentId);
        setProfileData(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load student progress.');
      } finally {
        if (showLoader) {
          setProfileLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!selectedStudentId) return;
    loadProfileData(selectedStudentId);
  }, [selectedStudentId, loadProfileData]);

  function handleSelectStudent(student) {
    setSelectedStudentSummary(student);
    setSelectedStudentId(student.studentId);
  }

  function handleSearch(value) {
    setSearchTerm(value);
    setPage(1);
  }

  async function handleSyncCodingStats() {
    if (!selectedStudentId) return;
    try {
      setSyncing(true);
      setError(null);
      await syncStudentCodingStats(selectedStudentId);
      await loadProfileData(selectedStudentId, { showLoader: true });
    } catch (err) {
      console.error(err);
      setError('Failed to sync coding stats. Please verify platform usernames.');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <>
      {error && (
        <div className="fixed inset-x-0 top-0 z-50 flex justify-center">
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-100 text-red-700 border border-red-200 px-4 py-1.5 text-xs shadow">
            {error}
          </div>
        </div>
      )}
      <Leaderboard
        students={students}
        selectedStudent={selectedStudentSummary}
        profileData={profileData}
        onSelectStudent={handleSelectStudent}
        searchTerm={searchTerm}
        onSearch={handleSearch}
        page={page}
        total={total}
        limit={PAGE_SIZE}
        onPageChange={setPage}
        listLoading={listLoading}
        profileLoading={profileLoading}
        onSyncCodingStats={handleSyncCodingStats}
        syncing={syncing}
      />
    </>
  );
}


