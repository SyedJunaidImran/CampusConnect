/**
 * AdminAttendance — college-wide attendance oversight and record management for Administrators.
 */
import { useState, useEffect } from 'react';
import { getAllCourses } from '../../api/courseApi';
import {
  getCourseAttendanceOnDate,
  submitBatchAttendance,
  getCourseAttendanceDates,
} from '../../api/attendanceApi';
import {
  HiOutlineClipboardCheck,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineSave,
  HiOutlineSearch,
} from 'react-icons/hi';

export default function AdminAttendance() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [sheet, setSheet] = useState(null);
  const [attendances, setAttendances] = useState({});
  const [pastDates, setPastDates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const res = await getAllCourses();
        const list = res.data.data || [];
        setCourses(list);
        if (list.length > 0) {
          setSelectedCourseId(list[0].id.toString());
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load courses.');
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;

    const fetchDates = async () => {
      try {
        const res = await getCourseAttendanceDates(parseInt(selectedCourseId, 10));
        setPastDates(res.data.data || []);
      } catch (err) {
        console.error('Failed to load course dates', err);
      }
    };
    fetchDates();
  }, [selectedCourseId]);

  const loadAttendanceSheet = async () => {
    if (!selectedCourseId || !selectedDate) return;

    try {
      setLoadingSheet(true);
      setError('');
      setSuccessMsg('');

      const res = await getCourseAttendanceOnDate(
        parseInt(selectedCourseId, 10),
        selectedDate
      );
      const data = res.data.data;
      setSheet(data);

      const map = {};
      data.records.forEach((r) => {
        map[r.studentId] = r.status || 'PRESENT';
      });
      setAttendances(map);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance.');
      setSheet(null);
    } finally {
      setLoadingSheet(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId && selectedDate) {
      loadAttendanceSheet();
    }
  }, [selectedCourseId, selectedDate]);

  const handleStatusToggle = (studentId, status) => {
    setAttendances((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!sheet || sheet.records.length === 0) return;

    try {
      setSaving(true);
      setError('');
      setSuccessMsg('');

      const payload = {
        courseId: parseInt(selectedCourseId, 10),
        attendanceDate: selectedDate,
        records: sheet.records.map((r) => ({
          studentId: r.studentId,
          status: attendances[r.studentId] || 'PRESENT',
        })),
      };

      const res = await submitBatchAttendance(payload);
      setSuccessMsg(res.data.message || 'Attendance records saved by Admin!');
      setSheet(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const filteredRecords = sheet?.records.filter((r) => {
    if (!searchQuery) return true;
    return (
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentRollNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) || [];

  return (
    <div>
      <div className="page-header">
        <h1>Attendance Oversight (Admin)</h1>
        <p>Review, verify, and modify class attendance records across all college courses.</p>
      </div>

      {successMsg && (
        <div className="alert alert-success">
          <HiOutlineCheckCircle /> {successMsg}
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
        </div>
      )}

      {loadingCourses ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading course directory...</p>
        </div>
      ) : (
        <div>
          {/* Filter Bar */}
          <div className="dashboard-section" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '220px', marginBottom: 0 }}>
                <label htmlFor="adminCourse">Select Course</label>
                <select
                  id="adminCourse"
                  className="form-input"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode} — {c.courseName} ({c.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ minWidth: '180px', marginBottom: 0 }}>
                <label htmlFor="adminDate">Lecture Date</label>
                <input
                  id="adminDate"
                  type="date"
                  className="form-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <button
                type="button"
                className="btn btn-outline"
                onClick={loadAttendanceSheet}
                disabled={loadingSheet}
              >
                <HiOutlineCalendar /> Load Records
              </button>
            </div>

            {pastDates.length > 0 && (
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>Recorded Dates:</span>
                {pastDates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`btn btn-sm ${d === selectedDate ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setSelectedDate(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Records Table */}
          {loadingSheet ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading attendance records for {selectedDate}...</p>
            </div>
          ) : !sheet || sheet.records.length === 0 ? (
            <div className="dashboard-section">
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h4>No students enrolled in this course</h4>
                <p>There are no enrolled students to display for this course.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveAttendance}>
              <div className="dashboard-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h3>{sheet.courseCode} Attendance &bull; {selectedDate}</h3>
                    <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>
                      Total Enrolled: {sheet.totalEnrolled} &bull; Present: <strong style={{ color: 'var(--color-success)' }}>{sheet.presentCount}</strong> &bull; Absent: <strong style={{ color: 'var(--color-danger)' }}>{sheet.absentCount}</strong>
                    </p>
                  </div>

                  <div className="search-input-wrapper" style={{ maxWidth: '260px' }}>
                    <HiOutlineSearch className="search-icon" />
                    <input
                      type="text"
                      placeholder="Filter students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                  </div>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Roll Number</th>
                        <th>Student Name</th>
                        <th>Department</th>
                        <th style={{ textAlign: 'center' }}>Admin Status Control</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((s) => {
                        const currentStatus = attendances[s.studentId] || 'PRESENT';
                        return (
                          <tr key={s.studentId}>
                            <td><strong>{s.studentRollNumber}</strong></td>
                            <td>{s.studentName}</td>
                            <td>{s.studentDepartment}</td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'center' }}>
                                <button
                                  type="button"
                                  className={`btn btn-sm ${currentStatus === 'PRESENT' ? 'btn-success' : 'btn-outline'}`}
                                  onClick={() => handleStatusToggle(s.studentId, 'PRESENT')}
                                >
                                  <HiOutlineCheckCircle /> Present
                                </button>
                                <button
                                  type="button"
                                  className={`btn btn-sm ${currentStatus === 'ABSENT' ? 'btn-danger' : 'btn-outline'}`}
                                  onClick={() => handleStatusToggle(s.studentId, 'ABSENT')}
                                >
                                  <HiOutlineXCircle /> Absent
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    <HiOutlineSave /> {saving ? 'Saving...' : 'Save & Overwrite Attendance'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
