/**
 * StudentAttendance — attendance metrics, course-wise breakdowns, low attendance warnings, and history.
 */
import { useState, useEffect } from 'react';
import { getMyAttendance, getMyCourseAttendanceHistory } from '../../api/attendanceApi';
import {
  HiOutlineClipboardList,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamation,
  HiOutlineCalendar,
  HiOutlineEye,
  HiOutlineX,
} from 'react-icons/hi';

export default function StudentAttendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Course History Modal State
  const [historyCourse, setHistoryCourse] = useState(null);
  const [courseHistoryRecords, setCourseHistoryRecords] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await getMyAttendance();
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleOpenCourseHistory = async (courseSummary) => {
    try {
      setHistoryCourse(courseSummary);
      setLoadingHistory(true);
      const res = await getMyCourseAttendanceHistory(courseSummary.courseId);
      setCourseHistoryRecords(res.data.data || []);
    } catch (err) {
      console.error('Failed to load course history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Attendance Tracker</h1>
        <p>Monitor your subject-wise presence, attendance percentages, and eligibility status.</p>
      </div>

      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Calculating attendance statistics...</p>
        </div>
      ) : !data ? (
        <div className="dashboard-section">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h4>No attendance records available</h4>
            <p>Attendance records will be displayed once your instructors mark daily lectures.</p>
          </div>
        </div>
      ) : (
        <div>
          {/* Low Attendance Warning Alert */}
          {data.hasLowAttendanceWarning && (
            <div
              className="alert alert-error"
              style={{
                backgroundColor: '#fef2f2',
                borderColor: '#f87171',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <HiOutlineExclamation style={{ fontSize: '1.6rem', color: '#dc2626', flexShrink: 0 }} />
                <div>
                  <strong style={{ display: 'block', fontSize: 'var(--font-size-base)', color: '#991b1b' }}>
                    Low Attendance Warning (Below 75% Minimum Required)
                  </strong>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: '#7f1d1d', marginTop: '2px' }}>
                    Your attendance in one or more courses is below the 75% threshold required for examination eligibility. Please attend upcoming lectures to raise your percentage.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Overall Attendance Summary Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className={`stat-icon ${data.overallAttendancePercentage >= 75 ? 'success' : 'danger'}`}>
                <HiOutlineClipboardList />
              </div>
              <div className="stat-info">
                <h3 style={{ color: data.overallAttendancePercentage >= 75 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {data.totalClassesAllCourses > 0 ? `${data.overallAttendancePercentage}%` : 'N/A'}
                </h3>
                <p>Overall Attendance</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon primary">
                <HiOutlineCalendar />
              </div>
              <div className="stat-info">
                <h3>{data.totalClassesAllCourses}</h3>
                <p>Total Lectures Held</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon success">
                <HiOutlineCheckCircle />
              </div>
              <div className="stat-info">
                <h3 style={{ color: 'var(--color-success)' }}>{data.totalAttendedAllCourses}</h3>
                <p>Classes Attended</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon danger">
                <HiOutlineXCircle />
              </div>
              <div className="stat-info">
                <h3 style={{ color: 'var(--color-danger)' }}>{data.totalMissedAllCourses}</h3>
                <p>Classes Missed</p>
              </div>
            </div>
          </div>

          {/* Course-Wise Attendance Breakdown Cards */}
          <div className="dashboard-section">
            <h3>📊 Course-Wise Attendance Breakdown</h3>
            {data.courseSummaries.length === 0 ? (
              <p className="text-muted" style={{ padding: '1rem 0' }}>
                You are not enrolled in any courses yet.
              </p>
            ) : (
              <div className="cards-grid" style={{ marginTop: '1rem' }}>
                {data.courseSummaries.map((course) => {
                  const isSafe = course.totalClasses === 0 || course.attendancePercentage >= 75;
                  const percentColor = isSafe ? 'var(--color-success)' : 'var(--color-danger)';
                  const barColor = isSafe ? '#10b981' : '#ef4444';

                  return (
                    <div key={course.courseId} className="course-card">
                      <div>
                        <div className="course-card-header">
                          <span className="course-code">{course.courseCode}</span>
                          <span className={`badge ${isSafe ? 'badge-success' : 'badge-danger'}`}>
                            {course.totalClasses > 0 ? `${course.attendancePercentage}%` : 'No Classes Yet'}
                          </span>
                        </div>

                        <h3 className="course-title">{course.courseName}</h3>
                        <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)', marginBottom: '0.75rem' }}>
                          Instructor: <strong>{course.facultyName}</strong>
                        </p>

                        {/* Visual Progress Bar */}
                        <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                          <div
                            style={{
                              width: `${Math.min(course.attendancePercentage, 100)}%`,
                              height: '100%',
                              backgroundColor: barColor,
                              transition: 'width 0.5s ease-in-out',
                            }}
                          ></div>
                        </div>

                        <div className="course-meta">
                          <div className="course-meta-row">
                            <span>Attended:</span>
                            <strong style={{ color: 'var(--color-success)' }}>{course.attendedClasses} classes</strong>
                          </div>
                          <div className="course-meta-row">
                            <span>Missed:</span>
                            <strong style={{ color: 'var(--color-danger)' }}>{course.missedClasses} classes</strong>
                          </div>
                          <div className="course-meta-row">
                            <span>Total Conducted:</span>
                            <strong>{course.totalClasses} classes</strong>
                          </div>
                        </div>
                      </div>

                      <div className="course-card-footer">
                        {course.lowAttendanceWarning && (
                          <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
                            ⚠️ Shortage Warning
                          </span>
                        )}
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ marginLeft: 'auto' }}
                          onClick={() => handleOpenCourseHistory(course)}
                        >
                          <HiOutlineEye /> View Dates
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Attendance Logs Table */}
          {data.recentAttendanceRecords && data.recentAttendanceRecords.length > 0 && (
            <div className="dashboard-section">
              <h3>🗓️ Recent Attendance Records</h3>
              <div className="table-container" style={{ marginTop: '0.75rem' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentAttendanceRecords.map((record) => (
                      <tr key={record.id}>
                        <td><strong>{record.attendanceDate}</strong></td>
                        <td><span className="course-code">{record.courseCode}</span></td>
                        <td>{record.courseName}</td>
                        <td>
                          <span className={`badge ${record.status === 'PRESENT' ? 'badge-success' : 'badge-danger'}`}>
                            {record.status === 'PRESENT' ? '✓ Present' : '✗ Absent'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Course Attendance Dates Modal */}
          {historyCourse && (
            <div className="modal-overlay" onClick={() => setHistoryCourse(null)}>
              <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div>
                    <span className="course-code">{historyCourse.courseCode}</span>
                    <h3 style={{ marginTop: '0.25rem' }}>{historyCourse.courseName}</h3>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      Attendance History ({historyCourse.attendedClasses} / {historyCourse.totalClasses} classes attended &bull; {historyCourse.attendancePercentage}%)
                    </p>
                  </div>
                  <button className="modal-close-btn" onClick={() => setHistoryCourse(null)}>
                    <HiOutlineX />
                  </button>
                </div>

                <div className="modal-body">
                  {loadingHistory ? (
                    <div className="loading-container">
                      <div className="spinner"></div>
                      <p>Loading course history...</p>
                    </div>
                  ) : courseHistoryRecords.length === 0 ? (
                    <div className="empty-state" style={{ padding: '2rem' }}>
                      <p>No lecture dates recorded yet for this course.</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Lecture Date</th>
                            <th>Status</th>
                            <th>Recorded On</th>
                          </tr>
                        </thead>
                        <tbody>
                          {courseHistoryRecords.map((r) => (
                            <tr key={r.id}>
                              <td><strong>{r.attendanceDate}</strong></td>
                              <td>
                                <span className={`badge ${r.status === 'PRESENT' ? 'badge-success' : 'badge-danger'}`}>
                                  {r.status === 'PRESENT' ? '✓ Present' : '✗ Absent'}
                                </span>
                              </td>
                              <td>{r.markedAt ? new Date(r.markedAt).toLocaleDateString() : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button className="btn btn-outline" onClick={() => setHistoryCourse(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
