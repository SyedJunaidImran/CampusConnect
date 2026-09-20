/**
 * StudentTimetable — Modern university timetable interface for enrolled students.
 * Includes week navigation, prominent today's classes spotlight, live status tracking,
 * conflict detection, multi-criteria filtering, weekly grid & daily agenda views, and details modal.
 */
import { useState, useEffect, useMemo } from 'react';
import { getMyStudentSchedules, getTodaySchedules } from '../../api/scheduleApi';
import ScheduleDetailModal from '../../components/timetable/ScheduleDetailModal';
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineLocationMarker,
  HiOutlineUser,
  HiOutlineSearch,
  HiOutlineSparkles,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineExclamation,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
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

export default function StudentTimetable() {
  const [schedules, setSchedules] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Week Navigation State (0 is current week, -1 previous, +1 next)
  const [weekOffset, setWeekOffset] = useState(0);

  // View Mode: 'grid' (weekly desktop grid) vs 'agenda' (daily stacked list)
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
  const [facultyFilter, setFacultyFilter] = useState('ALL');
  const [roomFilter, setRoomFilter] = useState('ALL');

  // Selected schedule for modal inspection
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  useEffect(() => {
    loadTimetable();
  }, []);

  const loadTimetable = async () => {
    try {
      setLoading(true);
      setError('');
      const [allRes, todayRes] = await Promise.all([
        getMyStudentSchedules(),
        getTodaySchedules().catch(() => ({ data: { data: [] } })),
      ]);
      setSchedules(allRes.data.data || []);
      setTodayClasses(todayRes.data.data || []);
    } catch (err) {
      console.error('Failed to load student timetable', err);
      setError('Could not load your class schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format HH:mm into 12-hour AM/PM string
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
    const currentDay = now.getDay(); // 0 Sun, 1 Mon, ...
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

  // Conflict Detection: identify schedules with overlapping times on same day
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

  // Live status for a class
  const getLiveStatus = (slot) => {
    if (!weekInfo.isCurrentWeek || slot.dayOfWeek !== todayName) {
      return null;
    }
    const nowStr = new Date().toTimeString().slice(0, 5);
    if (nowStr >= slot.startTime && nowStr <= slot.endTime) {
      return 'NOW';
    }
    if (nowStr < slot.startTime) {
      return 'UPCOMING';
    }
    return 'COMPLETED';
  };

  // Filter Dropdown Options
  const courseOptions = useMemo(() => {
    return [...new Set(schedules.map((s) => s.courseCode).filter(Boolean))].sort();
  }, [schedules]);

  const facultyOptions = useMemo(() => {
    return [...new Set(schedules.map((s) => s.facultyName).filter(Boolean))].sort();
  }, [schedules]);

  const roomOptions = useMemo(() => {
    return [...new Set(schedules.map((s) => s.room).filter(Boolean))].sort();
  }, [schedules]);

  // Filtered Schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const matchesDay = dayFilter === 'ALL' || s.dayOfWeek === dayFilter;
      const matchesCourse = courseFilter === 'ALL' || s.courseCode === courseFilter;
      const matchesFaculty = facultyFilter === 'ALL' || s.facultyName === facultyFilter;
      const matchesRoom = roomFilter === 'ALL' || s.room === roomFilter;
      const matchesSearch =
        !searchTerm.trim() ||
        (s.courseName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.courseCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.facultyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.room || '').toLowerCase().includes(searchTerm.toLowerCase());

      return matchesDay && matchesCourse && matchesFaculty && matchesRoom && matchesSearch;
    });
  }, [schedules, dayFilter, courseFilter, facultyFilter, roomFilter, searchTerm]);

  const hasActiveFilters =
    dayFilter !== 'ALL' ||
    courseFilter !== 'ALL' ||
    facultyFilter !== 'ALL' ||
    roomFilter !== 'ALL' ||
    searchTerm.trim() !== '';

  const clearFilters = () => {
    setDayFilter('ALL');
    setCourseFilter('ALL');
    setFacultyFilter('ALL');
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
          // If starting outside standard bounds, place in closest hour
          const defaultH = timeHours[0];
          if (map[s.dayOfWeek][defaultH]) {
            map[s.dayOfWeek][defaultH].push(s);
          }
        }
      }
    });

    return map;
  }, [filteredSchedules, timeHours]);

  // Today's Spotlight Breakdown
  const nowStr = new Date().toTimeString().slice(0, 5);
  const currentClassToday = todayClasses.find(
    (c) => nowStr >= c.startTime && nowStr <= c.endTime
  );
  const upcomingClassesToday = todayClasses
    .filter((c) => nowStr < c.startTime)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const nextClassToday = upcomingClassesToday[0];
  const completedClassesToday = todayClasses.filter((c) => nowStr > c.endTime);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your weekly schedule...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1>🗓️ Class Timetable</h1>
        <p>View your weekly class schedule, room locations, and lecture timings for enrolled courses.</p>
      </div>

      {error && (
        <div className="conflict-alert" style={{ marginBottom: '1.5rem' }}>
          <HiOutlineExclamation style={{ fontSize: '1.2rem', flexShrink: 0 }} />
          <span>{error}</span>
          <button className="btn btn-sm btn-outline" onClick={loadTimetable} style={{ marginLeft: 'auto' }}>
            <HiOutlineRefresh /> Retry
          </button>
        </div>
      )}

      {/* Timetable Week Header Bar & Navigation */}
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

      {/* Conflict Alert Banner */}
      {conflictScheduleIds.size > 0 && (
        <div className="schedule-conflict-banner">
          <div className="conflict-msg">
            <HiOutlineExclamation style={{ fontSize: '1.4rem', color: '#e11d48', flexShrink: 0 }} />
            <div>
              <strong>⚠ Schedule Overlap Detected:</strong> You have {conflictScheduleIds.size} classes scheduled at
              overlapping times. Review your enrolled courses to avoid schedule conflicts.
            </div>
          </div>
          <span className="conflict-warning-pill">
            <HiOutlineExclamation /> Conflict
          </span>
        </div>
      )}

      {/* Today's Classes Spotlight Section */}
      <div className="today-spotlight">
        <div className="today-spotlight-header">
          <div className="today-spotlight-title">
            <HiOutlineSparkles style={{ color: 'var(--color-primary)', fontSize: '1.25rem' }} />
            <h3>Today's Classes</h3>
            <span className="today-date-badge">
              {todayName} &bull; {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <span className="badge badge-primary">
            {todayClasses.length} {todayClasses.length === 1 ? 'class' : 'classes'} scheduled
          </span>
        </div>

        {todayClasses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.25rem 0', color: 'var(--color-text-secondary)' }}>
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
              🎉 No classes scheduled for today! Enjoy your free time or prepare for upcoming assignments.
            </p>
          </div>
        ) : (
          <div className="today-cards-grid">
            {/* 1. Current Class if any */}
            {currentClassToday && (
              <div
                className="today-schedule-card status-current"
                onClick={() =>
                  setSelectedSchedule({
                    ...currentClassToday,
                    isConflict: conflictScheduleIds.has(currentClassToday.id),
                    liveStatus: 'NOW',
                  })
                }
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="card-status-pill now">
                      <span className="pulse-dot"></span> In Session Now
                    </span>
                    <span className="badge badge-primary">{currentClassToday.courseCode}</span>
                  </div>
                  <h4 style={{ margin: '0.25rem 0 0.5rem', fontSize: 'var(--font-size-base)', fontWeight: 700 }}>
                    {currentClassToday.courseName}
                  </h4>
                </div>
                <div className="card-meta-row" style={{ marginTop: '0.5rem' }}>
                  <span className="card-meta-pill">
                    <HiOutlineClock /> {formatTime(currentClassToday.startTime)} – {formatTime(currentClassToday.endTime)}
                  </span>
                  <span className="card-meta-pill room-pill">
                    <HiOutlineLocationMarker style={{ color: 'var(--color-success)' }} /> {currentClassToday.room}
                  </span>
                  <span className="card-meta-pill faculty-pill">
                    <HiOutlineUser /> {currentClassToday.facultyName}
                  </span>
                </div>
              </div>
            )}

            {/* 2. Next Class Today */}
            {nextClassToday && (
              <div
                className="today-schedule-card status-upcoming"
                onClick={() =>
                  setSelectedSchedule({
                    ...nextClassToday,
                    isConflict: conflictScheduleIds.has(nextClassToday.id),
                    liveStatus: 'NEXT',
                  })
                }
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="card-status-pill next">Next Class</span>
                    <span className="badge badge-primary">{nextClassToday.courseCode}</span>
                  </div>
                  <h4 style={{ margin: '0.25rem 0 0.5rem', fontSize: 'var(--font-size-base)', fontWeight: 700 }}>
                    {nextClassToday.courseName}
                  </h4>
                </div>
                <div className="card-meta-row" style={{ marginTop: '0.5rem' }}>
                  <span className="card-meta-pill">
                    <HiOutlineClock /> {formatTime(nextClassToday.startTime)} – {formatTime(nextClassToday.endTime)}
                  </span>
                  <span className="card-meta-pill room-pill">
                    <HiOutlineLocationMarker style={{ color: 'var(--color-primary)' }} /> {nextClassToday.room}
                  </span>
                  <span className="card-meta-pill faculty-pill">
                    <HiOutlineUser /> {nextClassToday.facultyName}
                  </span>
                </div>
              </div>
            )}

            {/* If all classes concluded */}
            {!currentClassToday && !nextClassToday && todayClasses.length > 0 && (
              <div className="today-schedule-card status-completed" style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <HiOutlineCheckCircle style={{ fontSize: '1.75rem', color: 'var(--color-success)' }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>
                      All lectures for today have concluded!
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      You have completed {completedClassesToday.length} classes today. See you tomorrow!
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
              placeholder="Search course, room, professor..."
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
            <option value="ALL">All Courses</option>
            {courseOptions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>

          {/* Faculty Filter */}
          <select className="timetable-select" value={facultyFilter} onChange={(e) => setFacultyFilter(e.target.value)}>
            <option value="ALL">All Instructors</option>
            {facultyOptions.map((name) => (
              <option key={name} value={name}>
                {name}
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
          <div className="empty-icon">📚</div>
          <h4>No Timetable Schedules Found</h4>
          <p>You are not currently enrolled in any courses with scheduled lecture slots.</p>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="timetable-empty-card">
          <div className="empty-icon">🔍</div>
          <h4>No Matching Schedules</h4>
          <p>No class slots matched your active filters and search query.</p>
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
                                    <span className="conflict-warning-pill" title="Schedule Conflict!">
                                      ⚠ Overlap
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
                                  {slot.facultyName && (
                                    <span className="card-meta-pill faculty-pill" title={slot.facultyName}>
                                      <HiOutlineUser /> {slot.facultyName.split(' ')[0]}
                                    </span>
                                  )}
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
        /* ==================== 2. DAILY AGENDA VIEW (MOBILE/STACKED) ==================== */
        <div className="daily-agenda-view">
          {/* Day Selector Pills */}
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
                    {daySlots.length} {daySlots.length === 1 ? 'class' : 'classes'}
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

          {/* Chronological List for Active Day */}
          <div className="agenda-timeline">
            {filteredSchedules.filter((s) => s.dayOfWeek === activeAgendaDay).length === 0 ? (
              <div className="timetable-empty-card" style={{ padding: '2rem 1rem' }}>
                <div className="empty-icon">☕</div>
                <h4>No Classes on {activeAgendaDay}</h4>
                <p>No classes scheduled for this day. Enjoy your free time!</p>
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
                              <HiOutlineExclamation /> Schedule Conflict
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
                          {slot.facultyName && (
                            <span className="card-meta-pill faculty-pill">
                              <HiOutlineUser /> {slot.facultyName}
                            </span>
                          )}
                          <span className="card-meta-pill">Sem {slot.semester}</span>
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
          isFaculty={false}
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
