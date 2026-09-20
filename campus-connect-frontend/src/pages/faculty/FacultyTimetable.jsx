/**
 * FacultyTimetable — Modern teaching schedule management for university faculty.
 * Displays weekly teaching timetable, dynamic real-time summary statistics (Today's classes,
 * Next class, Teaching hours), conflict warnings, filters, weekly grid & daily agenda views,
 * and quick integration with lecture attendance.
 */
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getMyFacultySchedules, getTodaySchedules } from '../../api/scheduleApi';
import ScheduleDetailModal from '../../components/timetable/ScheduleDetailModal';
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineLocationMarker,
  HiOutlineSearch,
  HiOutlineSparkles,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineExclamation,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineClipboardCheck,
  HiOutlineBookOpen,
  HiOutlineX,
} from 'react-icons/hi';
import '../../styles/dashboard.css';
import '../../styles/components.css';
import '../../styles/timetable.css';

const DAYS_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_LABELS = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

export default function FacultyTimetable() {
  const [schedules, setSchedules] = useState([]);
  const [todayLectures, setTodayLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Week Navigation
  const [weekOffset, setWeekOffset] = useState(0);

  // View Mode: 'grid' vs 'agenda'
  const [viewMode, setViewMode] = useState('grid');

  // Active day for Agenda / Mobile view
  const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()).toUpperCase();
  const [activeAgendaDay, setActiveAgendaDay] = useState(
    DAYS_ORDER.includes(todayName) ? todayName : 'MONDAY'
  );

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dayFilter, setDayFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [roomFilter, setRoomFilter] = useState('ALL');

  // Selected schedule for modal inspection
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  useEffect(() => {
    loadFacultyTimetable();
  }, []);

  const loadFacultyTimetable = async () => {
    try {
      setLoading(true);
      setError('');
      const [allRes, todayRes] = await Promise.all([
        getMyFacultySchedules(),
        getTodaySchedules().catch(() => ({ data: { data: [] } })),
      ]);
      setSchedules(allRes.data.data || []);
      setTodayLectures(todayRes.data.data || []);
    } catch (err) {
      console.error('Failed to load faculty timetable', err);
      setError('Could not load your teaching timetable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHours = h % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
  };

  // Week Dates Computation
  const weekInfo = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const diffToMon = (currentDay === 0 ? -6 : 1) - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMon + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);

    const datesByDay = {};
    DAYS_ORDER.forEach((dayName, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      datesByDay[dayName] = d;
    });

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const isCurrentWeek = weekOffset === 0;

    const startLabel = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endLabel = friday.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return {
      monday,
      friday,
      datesByDay,
      isCurrentWeek,
      rangeLabel: `Week of ${startLabel} – ${endLabel}`,
    };
  }, [weekOffset]);

  // Conflict Detection
  const conflictScheduleIds = useMemo(() => {
    const ids = new Set();
    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        const a = schedules[i];
        const b = schedules[j];
        if (a.dayOfWeek === b.dayOfWeek) {
          if (a.startTime < b.endTime && a.endTime > b.startTime) {
            ids.add(a.id);
            ids.add(b.id);
          }
        }
      }
    }
    return ids;
  }, [schedules]);

  // Dynamic Teaching Statistics (Actual calculated values, NO hardcoding)
  const nowStr = new Date().toTimeString().slice(0, 5);

  const currentLectureToday = todayLectures.find(
    (c) => nowStr >= c.startTime && nowStr <= c.endTime
  );

  const upcomingLecturesToday = todayLectures
    .filter((c) => nowStr < c.startTime)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const nextLectureToday = upcomingLecturesToday[0];
  const completedLecturesToday = todayLectures.filter((c) => nowStr > c.endTime);

  const teachingHoursToday = useMemo(() => {
    return todayLectures.reduce((acc, slot) => {
      if (!slot.startTime || !slot.endTime) return acc;
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      const durHours = (eh * 60 + em - (sh * 60 + sm)) / 60;
      return acc + Math.max(0, durHours);
    }, 0);
  }, [todayLectures]);

  // Live status for a class
  const getLiveStatus = (slot) => {
    if (!weekInfo.isCurrentWeek || slot.dayOfWeek !== todayName) {
      return null;
    }
    const currentNowStr = new Date().toTimeString().slice(0, 5);
    if (currentNowStr >= slot.startTime && currentNowStr <= slot.endTime) {
      return 'NOW';
    }
    if (currentNowStr < slot.startTime) {
      return 'UPCOMING';
    }
    return 'COMPLETED';
  };

  // Filter Dropdown Options
  const courseOptions = useMemo(() => {
    return [...new Set(schedules.map((s) => s.courseCode).filter(Boolean))].sort();
  }, [schedules]);

  const roomOptions = useMemo(() => {
    return [...new Set(schedules.map((s) => s.room).filter(Boolean))].sort();
  }, [schedules]);

  // Filtered Schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const matchesDay = dayFilter === 'ALL' || s.dayOfWeek === dayFilter;
      const matchesCourse = courseFilter === 'ALL' || s.courseCode === courseFilter;
      const matchesRoom = roomFilter === 'ALL' || s.room === roomFilter;
      const matchesSearch =
        !searchTerm.trim() ||
        (s.courseName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.courseCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.room || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.department || '').toLowerCase().includes(searchTerm.toLowerCase());

      return matchesDay && matchesCourse && matchesRoom && matchesSearch;
    });
  }, [schedules, dayFilter, courseFilter, roomFilter, searchTerm]);

  const hasActiveFilters =
    dayFilter !== 'ALL' ||
    courseFilter !== 'ALL' ||
    roomFilter !== 'ALL' ||
    searchTerm.trim() !== '';

  const clearFilters = () => {
    setDayFilter('ALL');
    setCourseFilter('ALL');
    setRoomFilter('ALL');
    setSearchTerm('');
  };

  // Dynamic Hour Slots for Grid
  const timeHours = useMemo(() => {
    let minH = 8;
    let maxH = 17;
    schedules.forEach((s) => {
      if (s.startTime) {
        const h = parseInt(s.startTime.split(':')[0], 10);
        if (h < minH) minH = Math.max(7, h);
        if (h > maxH) maxH = Math.min(20, h);
      }
    });
    const hours = [];
    for (let h = minH; h <= maxH; h++) {
      hours.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return hours;
  }, [schedules]);

  // Group schedules by Day and Starting Hour
  const schedulesByDayAndHour = useMemo(() => {
    const map = {};
    DAYS_ORDER.forEach((d) => {
      map[d] = {};
      timeHours.forEach((h) => {
        map[d][h] = [];
      });
    });

    filteredSchedules.forEach((s) => {
      if (map[s.dayOfWeek]) {
        const sHour = `${s.startTime.slice(0, 2)}:00`;
        if (map[s.dayOfWeek][sHour]) {
          map[s.dayOfWeek][sHour].push(s);
        } else {
          const defaultH = timeHours[0];
          if (map[s.dayOfWeek][defaultH]) {
            map[s.dayOfWeek][defaultH].push(s);
          }
        }
      }
    });

    return map;
  }, [filteredSchedules, timeHours]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your teaching timetable...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>🗓️ Teaching Timetable</h1>
            <p>Manage your weekly lecture commitments, assigned classrooms, and schedule breakdown.</p>
          </div>
          <Link to="/faculty/attendance" className="btn btn-primary btn-sm">
            <HiOutlineClipboardCheck /> Mark Lecture Attendance
          </Link>
        </div>
      </div>

      {error && (
        <div className="conflict-alert" style={{ marginBottom: '1.5rem' }}>
          <HiOutlineExclamation style={{ fontSize: '1.2rem', flexShrink: 0 }} />
          <span>{error}</span>
          <button className="btn btn-sm btn-outline" onClick={loadFacultyTimetable} style={{ marginLeft: 'auto' }}>
            <HiOutlineRefresh /> Retry
          </button>
        </div>
      )}

      {/* Dynamic Summary Cards Bar (Requirement 7: Calculated from actual data) */}
      <div className="timetable-stats-grid">
        <div className="timetable-stat-card">
          <div className="timetable-stat-icon primary">
            <HiOutlineCalendar />
          </div>
          <div className="timetable-stat-content">
            <h4>Today's Classes</h4>
            <div className="stat-val">{todayLectures.length}</div>
            <div className="stat-sub">
              {todayLectures.length === 1 ? '1 lecture assigned' : `${todayLectures.length} lectures assigned`}
            </div>
          </div>
        </div>

        <div className="timetable-stat-card">
          <div className="timetable-stat-icon success">
            <HiOutlineSparkles />
          </div>
          <div className="timetable-stat-content">
            <h4>Next Class</h4>
            <div className="stat-val" style={{ fontSize: '1.1rem' }}>
              {nextLectureToday ? (
                <span>{nextLectureToday.courseCode} &bull; {formatTime(nextLectureToday.startTime)}</span>
              ) : currentLectureToday ? (
                <span style={{ color: 'var(--color-success)' }}>In session now</span>
              ) : todayLectures.length > 0 ? (
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>All completed</span>
              ) : (
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>None scheduled</span>
              )}
            </div>
            <div className="stat-sub">
              {nextLectureToday ? `Room: ${nextLectureToday.room}` : 'Classroom schedule'}
            </div>
          </div>
        </div>

        <div className="timetable-stat-card">
          <div className="timetable-stat-icon warning">
            <HiOutlineClock />
          </div>
          <div className="timetable-stat-content">
            <h4>Teaching Hours Today</h4>
            <div className="stat-val">
              {Math.round(teachingHoursToday * 10) / 10}h
            </div>
            <div className="stat-sub">Active instructional time</div>
          </div>
        </div>
      </div>

      {/* Week Navigation Header Bar */}
      <div className="timetable-header-bar">
        <div className="timetable-week-info">
          <span className="timetable-week-label">
            {weekInfo.isCurrentWeek ? 'Current Week' : weekOffset > 0 ? `+${weekOffset} Week` : `${weekOffset} Week`}
          </span>
          <span className="timetable-week-dates">{weekInfo.rangeLabel}</span>
        </div>

        <div className="timetable-week-actions">
          <button
            className="week-nav-btn"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            title="Previous Week"
          >
            <HiOutlineChevronLeft /> Prev Week
          </button>
          <button
            className={`week-nav-btn today-btn ${weekInfo.isCurrentWeek ? 'active' : ''}`}
            onClick={() => setWeekOffset(0)}
            title="Jump to current week"
          >
            Today
          </button>
          <button
            className="week-nav-btn"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            title="Next Week"
          >
            Next Week <HiOutlineChevronRight />
          </button>

          {/* View Toggle */}
          <div className="view-toggle-group">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Weekly Grid View"
            >
              <HiOutlineViewGrid /> Grid
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'agenda' ? 'active' : ''}`}
              onClick={() => setViewMode('agenda')}
              title="Daily Agenda View"
            >
              <HiOutlineViewList /> Agenda
            </button>
          </div>
        </div>
      </div>

      {/* Overlap Conflict Alert */}
      {conflictScheduleIds.size > 0 && (
        <div className="schedule-conflict-banner">
          <div className="conflict-msg">
            <HiOutlineExclamation style={{ fontSize: '1.4rem', color: '#e11d48', flexShrink: 0 }} />
            <div>
              <strong>⚠ Teaching Conflict Detected:</strong> You have {conflictScheduleIds.size} lectures scheduled at
              overlapping times. Contact your department administrator to resolve double-booking.
            </div>
          </div>
          <span className="conflict-warning-pill">
            <HiOutlineExclamation /> Conflict
          </span>
        </div>
      )}

      {/* Today's Teaching Spotlight */}
      <div className="today-spotlight">
        <div className="today-spotlight-header">
          <div className="today-spotlight-title">
            <HiOutlineBookOpen style={{ color: 'var(--color-primary)', fontSize: '1.25rem' }} />
            <h3>Today's Teaching Schedule</h3>
            <span className="today-date-badge">
              {todayName} &bull; {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <span className="badge badge-primary">
            {todayLectures.length} {todayLectures.length === 1 ? 'lecture' : 'lectures'} scheduled
          </span>
        </div>

        {todayLectures.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.25rem 0', color: 'var(--color-text-secondary)' }}>
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
              ☕ No lectures scheduled for today. You have free time for grading, research, or course preparation.
            </p>
          </div>
        ) : (
          <div className="today-cards-grid">
            {/* 1. Current Class */}
            {currentLectureToday && (
              <div
                className="today-schedule-card status-current"
                onClick={() =>
                  setSelectedSchedule({
                    ...currentLectureToday,
                    isConflict: conflictScheduleIds.has(currentLectureToday.id),
                    liveStatus: 'NOW',
                  })
                }
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="card-status-pill now">
                      <span className="pulse-dot"></span> In Session Now
                    </span>
                    <span className="badge badge-primary">{currentLectureToday.courseCode}</span>
                  </div>
                  <h4 style={{ margin: '0.25rem 0 0.5rem', fontSize: 'var(--font-size-base)', fontWeight: 700 }}>
                    {currentLectureToday.courseName}
                  </h4>
                </div>
                <div className="card-meta-row" style={{ marginTop: '0.5rem' }}>
                  <span className="card-meta-pill">
                    <HiOutlineClock /> {formatTime(currentLectureToday.startTime)} – {formatTime(currentLectureToday.endTime)}
                  </span>
                  <span className="card-meta-pill room-pill">
                    <HiOutlineLocationMarker style={{ color: 'var(--color-success)' }} /> {currentLectureToday.room}
                  </span>
                  <span className="card-meta-pill">
                    Sem {currentLectureToday.semester} &bull; {currentLectureToday.department}
                  </span>
                </div>
              </div>
            )}

            {/* 2. Next Class */}
            {nextLectureToday && (
              <div
                className="today-schedule-card status-upcoming"
                onClick={() =>
                  setSelectedSchedule({
                    ...nextLectureToday,
                    isConflict: conflictScheduleIds.has(nextLectureToday.id),
                    liveStatus: 'NEXT',
                  })
                }
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="card-status-pill next">Next Lecture</span>
                    <span className="badge badge-primary">{nextLectureToday.courseCode}</span>
                  </div>
                  <h4 style={{ margin: '0.25rem 0 0.5rem', fontSize: 'var(--font-size-base)', fontWeight: 700 }}>
                    {nextLectureToday.courseName}
                  </h4>
                </div>
                <div className="card-meta-row" style={{ marginTop: '0.5rem' }}>
                  <span className="card-meta-pill">
                    <HiOutlineClock /> {formatTime(nextLectureToday.startTime)} – {formatTime(nextLectureToday.endTime)}
                  </span>
                  <span className="card-meta-pill room-pill">
                    <HiOutlineLocationMarker style={{ color: 'var(--color-primary)' }} /> {nextLectureToday.room}
                  </span>
                  <span className="card-meta-pill">
                    Sem {nextLectureToday.semester} &bull; {nextLectureToday.department}
                  </span>
                </div>
              </div>
            )}

            {/* If all lectures concluded */}
            {!currentLectureToday && !nextLectureToday && todayLectures.length > 0 && (
              <div className="today-schedule-card status-completed" style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <HiOutlineCheckCircle style={{ fontSize: '1.75rem', color: 'var(--color-success)' }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>
                      All lectures for today have concluded!
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      You completed {completedLecturesToday.length} lectures today. Be sure to submit all attendance sheets.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="timetable-filter-bar">
        <div className="filter-inputs-group">
          <div className="timetable-search-box">
            <HiOutlineSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search course code, title, room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Day Filter */}
          <select className="timetable-select" value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
            <option value="ALL">All Days</option>
            {DAYS_ORDER.map((d) => (
              <option key={d} value={d}>
                {DAY_LABELS[d]} ({schedules.filter((s) => s.dayOfWeek === d).length})
              </option>
            ))}
          </select>

          {/* Course Filter */}
          <select className="timetable-select" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="ALL">All Assigned Courses</option>
            {courseOptions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>

          {/* Room Filter */}
          <select className="timetable-select" value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)}>
            <option value="ALL">All Rooms</option>
            {roomOptions.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={clearFilters} title="Reset all filters">
            <HiOutlineX /> Clear Filters
          </button>
        )}
      </div>

      {/* Main Timetable Presentation */}
      {schedules.length === 0 ? (
        <div className="timetable-empty-card">
          <div className="empty-icon">📖</div>
          <h4>No Teaching Assignments Found</h4>
          <p>You have not been assigned teaching schedules for the current semester yet.</p>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="timetable-empty-card">
          <div className="empty-icon">🔍</div>
          <h4>No Matching Lectures</h4>
          <p>No lecture slots match your active filters.</p>
          <button className="btn btn-outline btn-sm" onClick={clearFilters} style={{ marginTop: '0.5rem' }}>
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ==================== 1. WEEKLY GRID VIEW ==================== */
        <div className="timetable-grid-container">
          <div className="timetable-grid-wrapper">
            <table className="timetable-grid-table">
              <thead>
                <tr>
                  <th className="time-axis-header">Time</th>
                  {DAYS_ORDER.map((day) => {
                    const isToday = weekInfo.isCurrentWeek && day === todayName;
                    const dateObj = weekInfo.datesByDay[day];
                    const dateDisplay = dateObj
                      ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : '';
                    return (
                      <th key={day} className={`day-header ${isToday ? 'is-today' : ''}`}>
                        <div className="day-header-content">
                          <span className="day-header-name">
                            {DAY_LABELS[day]}
                            {isToday && <span className="day-today-tag">Today</span>}
                          </span>
                          <span className="day-header-date">{dateDisplay}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {timeHours.map((hour) => (
                  <tr key={hour}>
                    <td className="time-axis-cell">{formatTime(hour)}</td>
                    {DAYS_ORDER.map((day) => {
                      const isToday = weekInfo.isCurrentWeek && day === todayName;
                      const slotsInHour = schedulesByDayAndHour[day]?.[hour] || [];
                      return (
                        <td key={day} className={isToday ? 'is-today' : ''}>
                          {slotsInHour.map((slot) => {
                            const isConflict = conflictScheduleIds.has(slot.id);
                            const liveStatus = getLiveStatus(slot);
                            const isActiveNow = liveStatus === 'NOW';
                            return (
                              <div
                                key={slot.id}
                                className={`grid-schedule-card ${isActiveNow ? 'is-active-now' : ''} ${
                                  isConflict ? 'has-conflict' : ''
                                }`}
                                onClick={() =>
                                  setSelectedSchedule({
                                    ...slot,
                                    isConflict,
                                    liveStatus,
                                  })
                                }
                                title={`${slot.courseCode} - ${slot.courseName}`}
                              >
                                <div className="card-top-row">
                                  <span className="card-course-code">{slot.courseCode}</span>
                                  {isConflict && (
                                    <span className="conflict-warning-pill" title="Teaching Conflict!">
                                      ⚠ Conflict
                                    </span>
                                  )}
                                  {isActiveNow && (
                                    <span className="card-status-pill now" style={{ padding: '1px 5px' }}>
                                      <span className="pulse-dot"></span> NOW
                                    </span>
                                  )}
                                </div>
                                <div className="card-course-name">{slot.courseName}</div>
                                <div className="card-top-row" style={{ marginTop: '3px' }}>
                                  <span className="card-time-badge">
                                    <HiOutlineClock /> {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                  </span>
                                </div>
                                <div className="card-meta-row" style={{ marginTop: '4px' }}>
                                  <span className="card-meta-pill room-pill">
                                    <HiOutlineLocationMarker /> {slot.room}
                                  </span>
                                  <span className="card-meta-pill">
                                    Sem {slot.semester}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ==================== 2. DAILY AGENDA VIEW ==================== */
        <div className="daily-agenda-view">
          <div className="agenda-day-tabs">
            {DAYS_ORDER.map((day) => {
              const daySlots = filteredSchedules.filter((s) => s.dayOfWeek === day);
              const isToday = weekInfo.isCurrentWeek && day === todayName;
              const dateObj = weekInfo.datesByDay[day];
              const dateStr = dateObj ? dateObj.getDate() : '';
              return (
                <button
                  key={day}
                  className={`agenda-day-tab-btn ${activeAgendaDay === day ? 'active' : ''}`}
                  onClick={() => setActiveAgendaDay(day)}
                >
                  <span className="tab-weekday">{DAY_LABELS[day]}</span>
                  <span className="tab-date">{dateStr}</span>
                  <span className="tab-count">
                    {daySlots.length} {daySlots.length === 1 ? 'lecture' : 'lectures'}
                  </span>
                  {isToday && (
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, marginTop: '2px', color: activeAgendaDay === day ? 'white' : 'var(--color-primary)' }}>
                      TODAY
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="agenda-timeline">
            {filteredSchedules.filter((s) => s.dayOfWeek === activeAgendaDay).length === 0 ? (
              <div className="timetable-empty-card" style={{ padding: '2rem 1rem' }}>
                <div className="empty-icon">☕</div>
                <h4>No Lectures on {activeAgendaDay}</h4>
                <p>No teaching commitments scheduled for this day.</p>
              </div>
            ) : (
              filteredSchedules
                .filter((s) => s.dayOfWeek === activeAgendaDay)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((slot) => {
                  const isConflict = conflictScheduleIds.has(slot.id);
                  const liveStatus = getLiveStatus(slot);
                  const isNow = liveStatus === 'NOW';
                  return (
                    <div
                      key={slot.id}
                      className={`agenda-card ${isNow ? 'is-now' : ''} ${isConflict ? 'is-conflict' : ''}`}
                      onClick={() =>
                        setSelectedSchedule({
                          ...slot,
                          isConflict,
                          liveStatus,
                        })
                      }
                    >
                      <div className="agenda-card-left">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="card-course-code">{slot.courseCode}</span>
                          {isNow && (
                            <span className="card-status-pill now">
                              <span className="pulse-dot"></span> In Session
                            </span>
                          )}
                          {isConflict && (
                            <span className="conflict-warning-pill">
                              <HiOutlineExclamation /> Teaching Conflict
                            </span>
                          )}
                        </div>
                        <h4 style={{ margin: '0.2rem 0', fontSize: 'var(--font-size-base)', fontWeight: 700 }}>
                          {slot.courseName}
                        </h4>
                        <div className="card-meta-row">
                          <span className="card-meta-pill room-pill">
                            <HiOutlineLocationMarker style={{ color: 'var(--color-primary)' }} /> {slot.room}
                          </span>
                          <span className="card-meta-pill">Semester {slot.semester}</span>
                          <span className="card-meta-pill">{slot.department}</span>
                        </div>
                      </div>

                      <div className="agenda-card-right">
                        <span className="schedule-time" style={{ fontSize: 'var(--font-size-sm)' }}>
                          <HiOutlineClock /> {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                        </span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                          Click for details ➔
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* Class Details Modal */}
      {selectedSchedule && (
        <ScheduleDetailModal
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
          isFaculty={true}
          dateStr={
            weekInfo.datesByDay[selectedSchedule.dayOfWeek]
              ? weekInfo.datesByDay[selectedSchedule.dayOfWeek].toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : ''
          }
        />
      )}
    </div>
  );
}
