/**
 * FacultyAttendance — Task-oriented attendance marking and management for university faculty.
 *
 * WORKFLOW:
 * 1. Default View: "Today's Classes" with compact summary (Today's Classes, Completed, Pending, Upcoming)
 *    and clear visual class cards (NOW, UP NEXT, COMPLETED, PENDING).
 * 2. One-Click Marking: Clicking "Mark Attendance" on any class card opens the sheet with course
 *    and date pre-selected — zero manual searching needed!
 * 3. Live Metrics: Dynamic Present/Absent counters and percentage in the sheet.
 * 4. Secondary Views: "Attendance History" (custom dates) and "All Courses" (for edge cases).
 */
import { useState, useEffect, useMemo } from 'react';
import { getMyFacultyCourses } from '../../api/courseApi';
import { getTodaySchedules } from '../../api/scheduleApi';
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
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineArrowLeft,
  HiOutlineSearch,
  HiOutlineLocationMarker,
  HiOutlineBookOpen,
  HiOutlineViewGrid,
  HiOutlineRefresh,
  HiOutlineExclamation,
} from 'react-icons/hi';
import '../../styles/dashboard.css';
import '../../styles/components.css';
import '../../styles/attendance.css';

export default function FacultyAttendance() {
  // Navigation tabs: 'today' | 'sheet' | 'history' | 'courses'
  const [activeTab, setActiveTab] = useState('today');

  // Core Data
  const [courses, setCourses] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [todayCompletedMap, setTodayCompletedMap] = useState({}); // { [courseId]: boolean }

  // Attendance Sheet state
  const [selectedSlot, setSelectedSlot] = useState(null); // specific schedule slot if clicked from Today's classes
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0] // default to today YYYY-MM-DD
  );

  const [sheet, setSheet] = useState(null);
  const [attendances, setAttendances] = useState({}); // { [studentId]: 'PRESENT' | 'ABSENT' }
  const [pastDates, setPastDates] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Loading & Feedback
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 1. Initial Load: Fetch Courses, Today's Schedules, and check today's attendance status
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingInitial(true);
      setError('');

      const [coursesRes, todayRes] = await Promise.all([
        getMyFacultyCourses().catch(() => ({ data: { data: [] } })),
        getTodaySchedules().catch(() => ({ data: { data: [] } })),
      ]);

      const courseList = coursesRes.data.data || [];
      const scheduleList = todayRes.data.data || [];

      setCourses(courseList);
      setTodaySchedules(scheduleList);

      if (courseList.length > 0 && !selectedCourseId) {
        setSelectedCourseId(courseList[0].id.toString());
      }

      // Check attendance completion status for assigned courses on today's date
      const completedMap = {};
      await Promise.all(
        courseList.map(async (c) => {
          try {
            const datesRes = await getCourseAttendanceDates(c.id);
            const recordedDates = datesRes.data.data || [];
            if (recordedDates.includes(todayStr)) {
              completedMap[c.id] = true;
            }
          } catch {
            // Ignore error for individual course date check
          }
        })
      );
      setTodayCompletedMap(completedMap);
    } catch (err) {
      console.error('Failed to load initial faculty attendance data', err);
      setError('Could not load course schedules. Please refresh the page.');
    } finally {
      setLoadingInitial(false);
    }
  };

  // Map of courseId -> course object for quick lookup of enrolled count etc.
  const courseMap = useMemo(() => {
    const map = {};
    courses.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [courses]);

  // Format HH:mm time to 12-hour AM/PM
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHours = h % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
  };

  // 2. Class Cards & Live Status Computation
  const nowStr = new Date().toTimeString().slice(0, 5);

  const classesWithStatus = useMemo(() => {
    // Sort schedules by start time
    const sorted = [...todaySchedules].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    // Find the next upcoming lecture
    const upcomingList = sorted.filter(
      (s) => !todayCompletedMap[s.courseId] && nowStr < s.startTime
    );
    const nextSlotId = upcomingList.length > 0 ? upcomingList[0].id : null;

    return sorted.map((slot) => {
      const isCompleted = !!todayCompletedMap[slot.courseId];
      let status = 'UPCOMING';

      if (isCompleted) {
        status = 'COMPLETED';
      } else if (nowStr >= slot.startTime && nowStr <= slot.endTime) {
        status = 'NOW';
      } else if (slot.id === nextSlotId) {
        status = 'UP_NEXT';
      } else if (nowStr > slot.endTime) {
        status = 'PENDING';
      }

      return {
        ...slot,
        calculatedStatus: status,
        enrolledCount: courseMap[slot.courseId]?.enrolledStudentsCount || 0,
      };
    });
  }, [todaySchedules, todayCompletedMap, nowStr, courseMap]);

  // Summary Metrics calculation
  const summaryCounts = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let upcoming = 0;

    classesWithStatus.forEach((s) => {
      if (s.calculatedStatus === 'COMPLETED') {
        completed++;
      } else if (s.calculatedStatus === 'NOW' || s.calculatedStatus === 'PENDING') {
        pending++;
      } else {
        upcoming++;
      }
    });

    return {
      total: classesWithStatus.length,
      completed,
      pending,
      upcoming,
    };
  }, [classesWithStatus]);

  // 3. Load Attendance Sheet for a Course and Date
  const loadSheet = async (courseId, date) => {
    if (!courseId || !date) return;

    try {
      setLoadingSheet(true);
      setError('');
      setSuccessMsg('');

      const res = await getCourseAttendanceOnDate(parseInt(courseId, 10), date);
      const data = res.data.data;
      setSheet(data);

      // Initialize status mapping (default unmarked records to PRESENT for speed)
      const initialMap = {};
      (data.records || []).forEach((record) => {
        initialMap[record.studentId] = record.status || 'PRESENT';
      });
      setAttendances(initialMap);

      // Also fetch past dates for this course
      const datesRes = await getCourseAttendanceDates(parseInt(courseId, 10)).catch(() => ({ data: { data: [] } }));
      setPastDates(datesRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance sheet for this class.');
      setSheet(null);
    } finally {
      setLoadingSheet(false);
    }
  };

  // 4. One-Click "Mark Attendance" Action from a Class Card
  const handleOpenSheetForSlot = (slot) => {
    setSelectedSlot(slot);
    setSelectedCourseId(slot.courseId.toString());
    setSelectedDate(todayStr);
    setActiveTab('sheet');
    loadSheet(slot.courseId, todayStr);
  };

  // Open sheet manually (e.g. from All Courses or History)
  const handleOpenSheetManual = (courseId, date) => {
    setSelectedSlot(null);
    setSelectedCourseId(courseId.toString());
    setSelectedDate(date || todayStr);
    setActiveTab('sheet');
    loadSheet(courseId, date || todayStr);
  };

  // 5. Attendance Sheet Controls
  const handleMarkAll = (status) => {
    if (!sheet || !sheet.records) return;
    const updated = {};
    sheet.records.forEach((r) => {
      updated[r.studentId] = status;
    });
    setAttendances(updated);
  };

  const handleStatusChange = (studentId, status) => {
    setAttendances((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // 6. Submit Attendance
  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    if (!sheet || !sheet.records || sheet.records.length === 0) return;

    try {
      setSaving(true);
      setError('');
      setSuccessMsg('');

      const recordsPayload = sheet.records.map((r) => ({
        studentId: r.studentId,
        status: attendances[r.studentId] || 'PRESENT',
      }));

      const payload = {
        courseId: parseInt(selectedCourseId, 10),
        attendanceDate: selectedDate,
        records: recordsPayload,
      };

      const res = await submitBatchAttendance(payload);
      setSuccessMsg(res.data.message || 'Attendance saved successfully!');
      setSheet(res.data.data);

      // If saved for today, mark course as completed in today's map
      if (selectedDate === todayStr) {
        setTodayCompletedMap((prev) => ({
          ...prev,
          [parseInt(selectedCourseId, 10)]: true,
        }));
      }

      // Refresh past dates
      const datesRes = await getCourseAttendanceDates(parseInt(selectedCourseId, 10)).catch(() => ({ data: { data: [] } }));
      setPastDates(datesRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Filter students in sheet by search term
  const filteredRecords = useMemo(() => {
    if (!sheet || !sheet.records) return [];
    if (!studentSearch.trim()) return sheet.records;
    const query = studentSearch.toLowerCase();
    return sheet.records.filter(
      (r) =>
        (r.studentName && r.studentName.toLowerCase().includes(query)) ||
        (r.studentRollNumber && r.studentRollNumber.toLowerCase().includes(query)) ||
        (r.studentDepartment && r.studentDepartment.toLowerCase().includes(query))
    );
  }, [sheet, studentSearch]);

  // Dynamic Live Sheet Stats
  const liveStats = useMemo(() => {
    if (!sheet || !sheet.records) {
      return { total: 0, present: 0, absent: 0, pct: 0 };
    }
    const total = sheet.records.length;
    let present = 0;
    let absent = 0;

    sheet.records.forEach((r) => {
      const st = attendances[r.studentId] || 'PRESENT';
      if (st === 'PRESENT') present++;
      else if (st === 'ABSENT') absent++;
    });

    const pct = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
    return { total, present, absent, pct };
  }, [sheet, attendances]);

  const selectedCourseObj = courseMap[selectedCourseId];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <h1>Attendance</h1>
        <p>Mark and manage attendance for your classes.</p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          <HiOutlineCheckCircle /> {successMsg}
        </div>
      )}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
          <HiOutlineExclamation /> {error}
        </div>
      )}

      {/* Top Tab Navigation */}
      <div className="attendance-nav-tabs">
        <button
          type="button"
          className={`attendance-nav-tab ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('today');
            setError('');
            setSuccessMsg('');
          }}
        >
          <HiOutlineClock /> Today's Classes
        </button>

        {activeTab === 'sheet' && (
          <button
            type="button"
            className="attendance-nav-tab active"
            onClick={() => setActiveTab('sheet')}
          >
            <HiOutlineClipboardCheck /> Attendance Sheet
          </button>
        )}

        <button
          type="button"
          className={`attendance-nav-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('history');
            setError('');
            setSuccessMsg('');
          }}
        >
          <HiOutlineCalendar /> Attendance History
        </button>

        <button
          type="button"
          className={`attendance-nav-tab ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('courses');
            setError('');
            setSuccessMsg('');
          }}
        >
          <HiOutlineBookOpen /> All Courses
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: TODAY'S CLASSES DASHBOARD (PRIMARY & DEFAULT)                     */}
      {/* ========================================================================= */}
      {activeTab === 'today' && (
        <div>
          {/* Compact Summary Strip */}
          <div className="attendance-summary-grid">
            <div className="attendance-summary-card">
              <div>
                <div className="attendance-summary-label">Today's Classes</div>
                <div className="attendance-summary-value">{summaryCounts.total}</div>
              </div>
              <div className="attendance-summary-icon total">
                <HiOutlineCalendar />
              </div>
            </div>

            <div className="attendance-summary-card">
              <div>
                <div className="attendance-summary-label">Completed</div>
                <div className="attendance-summary-value" style={{ color: 'var(--color-success)' }}>
                  {summaryCounts.completed}
                </div>
              </div>
              <div className="attendance-summary-icon completed">
                <HiOutlineCheckCircle />
              </div>
            </div>

            <div className="attendance-summary-card">
              <div>
                <div className="attendance-summary-label">Pending</div>
                <div className="attendance-summary-value" style={{ color: 'var(--color-warning)' }}>
                  {summaryCounts.pending}
                </div>
              </div>
              <div className="attendance-summary-icon pending">
                <HiOutlineClock />
              </div>
            </div>

            <div className="attendance-summary-card">
              <div>
                <div className="attendance-summary-label">Upcoming</div>
                <div className="attendance-summary-value">{summaryCounts.upcoming}</div>
              </div>
              <div className="attendance-summary-icon upcoming">
                <HiOutlineClipboardCheck />
              </div>
            </div>
          </div>

          {/* Class Cards Section */}
          {loadingInitial ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading today's teaching schedule...</p>
            </div>
          ) : classesWithStatus.length === 0 ? (
            <div className="dashboard-section" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
              <div className="empty-state-icon" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                ☕
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>No Classes Scheduled Today</h3>
              <p className="text-muted" style={{ maxWidth: '440px', margin: '0 auto 1.5rem' }}>
                You don't have any lectures scheduled in today's timetable. Need to record attendance for a makeup session or previous date?
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveTab('history')}
                >
                  <HiOutlineCalendar /> Choose Another Date
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveTab('courses')}
                >
                  <HiOutlineBookOpen /> View All Assigned Courses
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                  Today's Schedule &bull; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
                <span className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>
                  {classesWithStatus.length} class{classesWithStatus.length > 1 ? 'es' : ''} assigned
                </span>
              </div>

              <div className="class-cards-grid">
                {classesWithStatus.map((slot) => {
                  const isCompleted = slot.calculatedStatus === 'COMPLETED';
                  const isNow = slot.calculatedStatus === 'NOW';
                  const isUpNext = slot.calculatedStatus === 'UP_NEXT';
                  const isPending = slot.calculatedStatus === 'PENDING';

                  return (
                    <div
                      key={slot.id}
                      className={`class-card ${
                        isNow
                          ? 'class-card--now'
                          : isCompleted
                          ? 'class-card--completed'
                          : isPending
                          ? 'class-card--pending'
                          : ''
                      }`}
                    >
                      <div>
                        {/* Card Header with Badges */}
                        <div className="class-card-header">
                          <span className="class-card-code">{slot.courseCode}</span>

                          {isNow && (
                            <span className="class-card-badge class-card-badge--now">
                              <span className="class-card-pulse-dot" /> NOW
                            </span>
                          )}
                          {isUpNext && (
                            <span className="class-card-badge class-card-badge--upnext">
                              UP NEXT
                            </span>
                          )}
                          {isCompleted && (
                            <span className="class-card-badge class-card-badge--completed">
                              ✓ COMPLETED
                            </span>
                          )}
                          {isPending && (
                            <span className="class-card-badge class-card-badge--pending">
                              PENDING
                            </span>
                          )}
                          {!isNow && !isUpNext && !isCompleted && !isPending && (
                            <span className="class-card-badge" style={{ background: '#f1f5f9', color: '#64748b' }}>
                              UPCOMING
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="class-card-title">{slot.courseName}</h4>

                        {/* Metadata items */}
                        <div className="class-card-meta-list">
                          <div className="class-card-meta-item">
                            <HiOutlineClock className="class-card-meta-icon" />
                            <span>
                              <strong>{formatTime(slot.startTime)}</strong> – {formatTime(slot.endTime)}
                            </span>
                          </div>

                          <div className="class-card-meta-item">
                            <HiOutlineLocationMarker className="class-card-meta-icon" />
                            <span>Room: <strong>{slot.room || 'TBA'}</strong></span>
                          </div>

                          <div className="class-card-meta-item">
                            <HiOutlineUserGroup className="class-card-meta-icon" />
                            <span>{slot.enrolledCount} enrolled student{slot.enrolledCount !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom Action Row */}
                      <div className="class-card-actions">
                        <div>
                          {isCompleted ? (
                            <span className="class-card-status-text completed">
                              <HiOutlineCheckCircle /> Attendance Completed
                            </span>
                          ) : isNow ? (
                            <span className="class-card-status-text" style={{ color: 'var(--color-primary)' }}>
                              Active Lecture
                            </span>
                          ) : isPending ? (
                            <span className="class-card-status-text pending">
                              Attendance Required
                            </span>
                          ) : (
                            <span className="class-card-status-text upcoming">
                              Scheduled Later
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          className={`class-card-btn ${isCompleted ? 'class-card-btn--secondary' : 'class-card-btn--primary'}`}
                          onClick={() => handleOpenSheetForSlot(slot)}
                        >
                          {isCompleted ? (
                            <>Review / Edit</>
                          ) : (
                            <>
                              Mark Attendance <span>→</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: ATTENDANCE MARKING SHEET (ACTIVATED VIA CARD OR MANUAL SELECTION) */}
      {/* ========================================================================= */}
      {activeTab === 'sheet' && (
        <div>
          {/* Header Banner */}
          <div className="attendance-sheet-header-banner">
            <div>
              <button
                type="button"
                className="sheet-back-btn"
                onClick={() => setActiveTab('today')}
              >
                <HiOutlineArrowLeft /> Back to Today's Classes
              </button>

              <div className="sheet-title-row">
                <h2 className="sheet-course-title">
                  {selectedCourseObj
                    ? `${selectedCourseObj.courseCode} — ${selectedCourseObj.courseName}`
                    : sheet
                    ? `${sheet.courseCode} — ${sheet.courseName}`
                    : 'Class Attendance'}
                </h2>
              </div>

              <div className="sheet-course-meta">
                {selectedSlot && (
                  <>
                    <span>
                      <HiOutlineClock /> {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}
                    </span>
                    <span>
                      <HiOutlineLocationMarker /> Room {selectedSlot.room || 'TBA'}
                    </span>
                  </>
                )}
                <span>
                  <HiOutlineCalendar />{' '}
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                {todayCompletedMap[selectedCourseId] && selectedDate === todayStr && (
                  <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                    <HiOutlineCheckCircle /> Saved Today
                  </span>
                )}
              </div>
            </div>

            {/* Live Stats Pill */}
            <div className="sheet-live-stats">
              <div className="sheet-stat-item">
                <span className="sheet-stat-item-label">Total</span>
                <span className="sheet-stat-item-val">{liveStats.total}</span>
              </div>
              <div className="sheet-stat-item">
                <span className="sheet-stat-item-label">Present</span>
                <span className="sheet-stat-item-val present">{liveStats.present}</span>
              </div>
              <div className="sheet-stat-item">
                <span className="sheet-stat-item-label">Absent</span>
                <span className="sheet-stat-item-val absent">{liveStats.absent}</span>
              </div>
              <div className="sheet-stat-item">
                <span className="sheet-stat-item-label">Attendance</span>
                <span className="sheet-stat-item-val pct">{liveStats.pct}%</span>
              </div>
            </div>
          </div>

          {/* Sheet Body */}
          {loadingSheet ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading attendance roster for {selectedDate}...</p>
            </div>
          ) : !sheet || !sheet.records || sheet.records.length === 0 ? (
            <div className="dashboard-section">
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <h4>No students enrolled in this course</h4>
                <p>Students must be enrolled in this course before attendance can be recorded.</p>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveTab('today')}
                  style={{ marginTop: '1rem' }}
                >
                  <HiOutlineArrowLeft /> Return to Classes
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitAttendance}>
              <div className="dashboard-section">
                {/* Controls & Search Toolbar */}
                <div className="sheet-controls-bar">
                  <div className="search-input-wrapper" style={{ maxWidth: '340px' }}>
                    <HiOutlineSearch className="search-icon" />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search student by name or roll no..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                    />
                  </div>

                  <div className="sheet-bulk-actions">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleMarkAll('PRESENT')}
                    >
                      <HiOutlineCheckCircle style={{ color: 'var(--color-success)' }} /> Mark All Present
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleMarkAll('ABSENT')}
                    >
                      <HiOutlineXCircle style={{ color: 'var(--color-danger)' }} /> Mark All Absent
                    </button>
                  </div>
                </div>

                {/* Students Attendance Table */}
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '180px' }}>Roll Number</th>
                        <th>Student Name</th>
                        <th>Department</th>
                        <th style={{ textAlign: 'center', width: '220px' }}>Attendance Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                            No students match "{studentSearch}".
                          </td>
                        </tr>
                      ) : (
                        filteredRecords.map((student) => {
                          const currentStatus = attendances[student.studentId] || 'PRESENT';
                          return (
                            <tr key={student.studentId}>
                              <td>
                                <strong style={{ letterSpacing: '0.02em' }}>
                                  {student.studentRollNumber}
                                </strong>
                              </td>
                              <td style={{ fontWeight: 600 }}>{student.studentName}</td>
                              <td className="text-muted">{student.studentDepartment}</td>
                              <td style={{ textAlign: 'center' }}>
                                <div className="attendance-toggle-group">
                                  <button
                                    type="button"
                                    className={`attendance-toggle-btn ${
                                      currentStatus === 'PRESENT' ? 'active-present' : ''
                                    }`}
                                    onClick={() => handleStatusChange(student.studentId, 'PRESENT')}
                                  >
                                    <HiOutlineCheckCircle /> Present
                                  </button>
                                  <button
                                    type="button"
                                    className={`attendance-toggle-btn ${
                                      currentStatus === 'ABSENT' ? 'active-absent' : ''
                                    }`}
                                    onClick={() => handleStatusChange(student.studentId, 'ABSENT')}
                                  >
                                    <HiOutlineXCircle /> Absent
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Save Footer Bar */}
                <div className="sheet-save-footer">
                  <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
                    Showing {filteredRecords.length} of {sheet.records.length} students &bull; Changes will overwrite previous records for {selectedDate}.
                  </span>

                  <button
                    type="submit"
                    className="sheet-save-btn"
                    disabled={saving}
                  >
                    <HiOutlineSave /> {saving ? 'Saving Attendance...' : 'Save Attendance'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: ATTENDANCE HISTORY (SECONDARY VIEW)                               */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="dashboard-section">
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.35rem' }}>Attendance History</h3>
            <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
              Review or adjust attendance records for past lecture dates.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '240px', marginBottom: 0 }}>
              <label htmlFor="historyCourseSelect">Select Course</label>
              <select
                id="historyCourseSelect"
                className="form-input"
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  loadSheet(e.target.value, selectedDate);
                }}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.courseCode} — {c.courseName} ({c.enrolledStudentsCount || 0} enrolled)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ minWidth: '200px', marginBottom: 0 }}>
              <label htmlFor="historyDateInput">Select Date</label>
              <input
                id="historyDateInput"
                type="date"
                className="form-input"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  loadSheet(selectedCourseId, e.target.value);
                }}
                max={todayStr}
              />
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleOpenSheetManual(selectedCourseId, selectedDate)}
              disabled={loadingSheet || !selectedCourseId}
            >
              <HiOutlineClipboardCheck /> Open Sheet
            </button>
          </div>

          {/* Quick past dates chips */}
          {pastDates.length > 0 && (
            <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <span className="text-muted" style={{ fontSize: 'var(--font-size-xs)', display: 'block', marginBottom: '0.5rem' }}>
                <HiOutlineClock style={{ verticalAlign: 'middle' }} /> Previously Recorded Dates for this course:
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {pastDates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`btn btn-sm ${d === selectedDate ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => {
                      setSelectedDate(d);
                      handleOpenSheetManual(selectedCourseId, d);
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: ALL ASSIGNED COURSES (SECONDARY VIEW)                              */}
      {/* ========================================================================= */}
      {activeTab === 'courses' && (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.35rem' }}>All Assigned Courses</h3>
            <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
              Directly access attendance for any of your courses outside the timetable schedule.
            </p>
          </div>

          {courses.length === 0 ? (
            <div className="dashboard-section">
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h4>No courses assigned</h4>
                <p>You must be assigned to at least one course to mark attendance.</p>
              </div>
            </div>
          ) : (
            <div className="class-cards-grid">
              {courses.map((course) => {
                const isMarkedToday = !!todayCompletedMap[course.id];
                return (
                  <div key={course.id} className="class-card">
                    <div>
                      <div className="class-card-header">
                        <span className="class-card-code">{course.courseCode}</span>
                        {isMarkedToday && (
                          <span className="class-card-badge class-card-badge--completed">
                            ✓ MARKED TODAY
                          </span>
                        )}
                      </div>

                      <h4 className="class-card-title">{course.courseName}</h4>

                      <div className="class-card-meta-list">
                        <div className="class-card-meta-item">
                          <HiOutlineUserGroup className="class-card-meta-icon" />
                          <span>{course.enrolledStudentsCount || 0} enrolled students</span>
                        </div>
                        <div className="class-card-meta-item">
                          <HiOutlineBookOpen className="class-card-meta-icon" />
                          <span>Dept: {course.department} &bull; Semester {course.semester}</span>
                        </div>
                      </div>
                    </div>

                    <div className="class-card-actions">
                      <span className="class-card-status-text" style={{ color: 'var(--color-text-secondary)' }}>
                        {course.credits} Credits
                      </span>

                      <button
                        type="button"
                        className="class-card-btn class-card-btn--primary"
                        onClick={() => handleOpenSheetManual(course.id, todayStr)}
                      >
                        {isMarkedToday ? 'Review Sheet' : 'Mark Attendance →'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
