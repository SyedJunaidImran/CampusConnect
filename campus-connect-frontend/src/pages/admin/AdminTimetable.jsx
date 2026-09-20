/**
 * AdminTimetable — Master timetable management for college administrators.
 * Supports creating, editing, and deleting schedules with conflict detection.
 */
import { useState, useEffect } from 'react';
import {
  getAllSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '../../api/scheduleApi';
import { getAllCourses } from '../../api/courseApi';
import { getAllFaculty } from '../../api/facultyApi';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineClock,
  HiOutlineLocationMarker,
  HiOutlineUser,
  HiOutlineBookOpen,
  HiOutlineX,
  HiOutlineExclamation,
  HiOutlineCalendar,
  HiOutlineViewGrid,
  HiOutlineViewList,
} from 'react-icons/hi';
import '../../styles/dashboard.css';
import '../../styles/components.css';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export default function AdminTimetable() {
  const [schedules, setSchedules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dayFilter, setDayFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [facultyFilter, setFacultyFilter] = useState('ALL');
  const [roomFilter, setRoomFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  // Notifications
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [modalConflictError, setModalConflictError] = useState('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    courseId: '',
    facultyId: '',
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '10:30',
    room: '',
    semester: '1',
    department: 'Computer Science',
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [schedRes, courseRes, facRes] = await Promise.all([
        getAllSchedules().catch((err) => {
          console.error('Failed to load schedules', err);
          return { data: { data: [] } };
        }),
        getAllCourses().catch((err) => {
          console.error('Failed to load courses', err);
          return { data: { data: [] } };
        }),
        getAllFaculty().catch((err) => {
          console.error('Failed to load faculty', err);
          return { data: { data: [] } };
        }),
      ]);
      setSchedules(schedRes.data.data || []);
      setCourses(courseRes.data.data || []);
      setFacultyList(facRes.data.data || []);
    } catch (err) {
      console.error('Failed to load timetable data', err);
      setError('Failed to load master timetable records.');
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

  const openCreateModal = () => {
    setEditingSchedule(null);
    setModalConflictError('');
    const defaultCourse = courses[0];
    setFormData({
      courseId: defaultCourse ? defaultCourse.id : '',
      facultyId: defaultCourse?.facultyId || (facultyList[0]?.id || ''),
      dayOfWeek: 'MONDAY',
      startTime: '09:00',
      endTime: '10:30',
      room: 'Room A101',
      semester: defaultCourse ? defaultCourse.semester : 1,
      department: defaultCourse ? defaultCourse.department : 'Computer Science',
    });
    setShowModal(true);
  };

  const openEditModal = (s) => {
    setEditingSchedule(s);
    setModalConflictError('');
    setFormData({
      courseId: s.courseId || '',
      facultyId: s.facultyId || '',
      dayOfWeek: s.dayOfWeek || 'MONDAY',
      startTime: s.startTime ? s.startTime.slice(0, 5) : '09:00',
      endTime: s.endTime ? s.endTime.slice(0, 5) : '10:30',
      room: s.room || '',
      semester: s.semester || 1,
      department: s.department || 'Computer Science',
    });
    setShowModal(true);
  };

  const handleCourseChange = (selectedCourseId) => {
    const selectedCourse = courses.find((c) => String(c.id) === String(selectedCourseId));
    setFormData((prev) => ({
      ...prev,
      courseId: selectedCourseId,
      facultyId: selectedCourse?.facultyId || prev.facultyId,
      semester: selectedCourse ? selectedCourse.semester : prev.semester,
      department: selectedCourse ? selectedCourse.department : prev.department,
    }));
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setModalConflictError('');

    // Basic frontend time validation
    if (!formData.startTime || !formData.endTime) {
      setModalConflictError('Start time and end time are required.');
      return;
    }
    if (formData.startTime >= formData.endTime) {
      setModalConflictError('Start time must be strictly before end time.');
      return;
    }
    if (!formData.room.trim()) {
      setModalConflictError('Room assignment is required.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        courseId: Number(formData.courseId),
        facultyId: Number(formData.facultyId),
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        room: formData.room.trim(),
        semester: Number(formData.semester),
        department: formData.department.trim(),
      };

      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, payload);
        setSuccessMsg('Class schedule updated successfully.');
      } else {
        await createSchedule(payload);
        setSuccessMsg('New class schedule slot created successfully.');
      }

      setShowModal(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Save schedule error', err);
      const conflictMsg = err.response?.data?.message || 'Failed to save class schedule.';
      setModalConflictError(conflictMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteSchedule(deleteTarget.id);
      setSuccessMsg('Class schedule deleted successfully.');
      setDeleteTarget(null);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Delete schedule error', err);
      setError(err.response?.data?.message || 'Failed to delete schedule.');
    } finally {
      setDeleting(false);
    }
  };

  // Distinct rooms for filtering
  const roomsList = [...new Set(schedules.map((s) => s.room))].sort();

  const filteredSchedules = schedules.filter((s) => {
    const matchesDay = dayFilter === 'ALL' || s.dayOfWeek === dayFilter;
    const matchesCourse = courseFilter === 'ALL' || String(s.courseId) === String(courseFilter);
    const matchesFaculty = facultyFilter === 'ALL' || String(s.facultyId) === String(facultyFilter);
    const matchesRoom = roomFilter === 'ALL' || (s.room || '').toLowerCase() === roomFilter.toLowerCase();
    const matchesSearch =
      (s.courseName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.courseCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.facultyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.room || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDay && matchesCourse && matchesFaculty && matchesRoom && matchesSearch;
  });

  const getSchedulesForDay = (day) => {
    return filteredSchedules
      .filter((s) => s.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading master timetable console...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>⚙️ Master Timetable Management</h1>
        <p>Schedule curriculum lectures, assign professors, resolve room conflicts, and structure the college timetable.</p>
      </div>

      {error && (
        <div className="conflict-alert">
          <HiOutlineExclamation style={{ fontSize: '1.25rem', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-success-light)', color: '#065f46', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: 'var(--font-size-sm)' }}>
          {successMsg}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon primary"><HiOutlineCalendar /></div>
          <div className="stat-info">
            <h3>{schedules.length}</h3>
            <p>Total Weekly Slots</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><HiOutlineLocationMarker /></div>
          <div className="stat-info">
            <h3>{roomsList.length}</h3>
            <p>Active Classrooms / Labs</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><HiOutlineBookOpen /></div>
          <div className="stat-info">
            <h3>{courses.length}</h3>
            <p>Curriculum Courses</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger"><HiOutlineUser /></div>
          <div className="stat-info">
            <h3>{facultyList.length}</h3>
            <p>Assigned Professors</p>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="toolbar">
        <div className="search-filter-group" style={{ flexWrap: 'wrap', maxWidth: '100%' }}>
          <div className="search-input-wrapper" style={{ minWidth: '220px' }}>
            <HiOutlineSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search course, professor, or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select className="select-filter" value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
            <option value="ALL">All Days</option>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select className="select-filter" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="ALL">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.courseCode} — {c.courseName}
              </option>
            ))}
          </select>

          <select className="select-filter" value={facultyFilter} onChange={(e) => setFacultyFilter(e.target.value)}>
            <option value="ALL">All Faculty</option>
            {facultyList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.user?.fullName}
              </option>
            ))}
          </select>

          <select className="select-filter" value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)}>
            <option value="ALL">All Rooms</option>
            {roomsList.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <HiOutlineViewGrid /> Grid
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <HiOutlineViewList /> Table
            </button>
          </div>
        </div>

        <button className="btn btn-primary" onClick={openCreateModal}>
          <HiOutlinePlus /> Create Schedule
        </button>
      </div>

      {/* Content: Grid or Table View */}
      {filteredSchedules.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗓️</div>
          <h4>No class schedules found</h4>
          <p>Try adjusting your search criteria or click "Create Schedule" to add new lectures.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="timetable-week-grid">
          {(dayFilter === 'ALL' ? DAYS : [dayFilter]).map((day) => {
            const daySlots = getSchedulesForDay(day);
            return (
              <div key={day} className="timetable-day-column">
                <div className="timetable-day-header">
                  <div className="timetable-day-title">
                    <span>{day}</span>
                  </div>
                  <span className="badge badge-secondary">{daySlots.length}</span>
                </div>
                <div className="timetable-slot-list">
                  {daySlots.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                      No classes
                    </div>
                  ) : (
                    daySlots.map((slot) => (
                      <div key={slot.id} className="schedule-card">
                        <div className="schedule-card-top">
                          <span className="course-code">{slot.courseCode}</span>
                          <span className="schedule-time">
                            <HiOutlineClock /> {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </span>
                        </div>
                        <div className="schedule-course-name">{slot.courseName}</div>
                        <div className="schedule-meta" style={{ marginBottom: '0.5rem' }}>
                          <div className="schedule-meta-item">
                            <HiOutlineLocationMarker style={{ color: 'var(--color-primary)' }} />
                            <span>{slot.room}</span>
                          </div>
                          <div className="schedule-meta-item">
                            <HiOutlineUser />
                            <span>{slot.facultyName}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid var(--color-border)' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openEditModal(slot)}
                            title="Edit Slot"
                          >
                            <HiOutlinePencilAlt />
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => setDeleteTarget(slot)}
                            title="Delete Slot"
                          >
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Time Slot</th>
                <th>Course</th>
                <th>Faculty</th>
                <th>Room</th>
                <th>Semester / Dept</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((slot) => (
                <tr key={slot.id}>
                  <td><strong>{slot.dayOfWeek}</strong></td>
                  <td>
                    <span className="schedule-time">
                      <HiOutlineClock /> {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{slot.courseCode}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{slot.courseName}</div>
                  </td>
                  <td>{slot.facultyName}</td>
                  <td><span className="badge badge-primary">{slot.room}</span></td>
                  <td>Sem {slot.semester} • {slot.department}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => openEditModal(slot)} title="Edit">
                        <HiOutlinePencilAlt />
                      </button>
                      <button className="btn btn-outline-danger btn-sm" onClick={() => setDeleteTarget(slot)} title="Delete">
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3>{editingSchedule ? 'Edit Class Schedule' : 'Create Class Schedule'}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <HiOutlineX />
              </button>
            </div>
            <form onSubmit={handleSaveSchedule}>
              <div className="modal-body">
                {modalConflictError && (
                  <div className="conflict-alert" style={{ marginBottom: '1rem' }}>
                    <HiOutlineExclamation style={{ fontSize: '1.25rem', flexShrink: 0 }} />
                    <span>{modalConflictError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Course *</label>
                  <select
                    className="form-input"
                    value={formData.courseId}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.courseCode} — {c.courseName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Faculty Professor *</label>
                  <select
                    className="form-input"
                    value={formData.facultyId}
                    onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                    required
                  >
                    <option value="">Select Faculty</option>
                    {facultyList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.fullName || f.user?.fullName || 'Faculty Member'} ({f.department || 'General'})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Day of Week *</label>
                    <select
                      className="form-input"
                      value={formData.dayOfWeek}
                      onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                      required
                    >
                      {DAYS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Room / Classroom / Lab *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Room A101, Lab 2"
                      value={formData.room}
                      onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Start Time * (24hr)</label>
                    <input
                      type="time"
                      className="form-input"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Time * (24hr)</label>
                    <input
                      type="time"
                      className="form-input"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Semester *</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      className="form-input"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Validating & Saving...' : editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Delete Class Schedule</h3>
              <button className="modal-close-btn" onClick={() => setDeleteTarget(null)}>
                <HiOutlineX />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--color-text-primary)' }}>
                Are you sure you want to remove the <strong>{deleteTarget.courseCode}</strong> class scheduled on{' '}
                <strong>{deleteTarget.dayOfWeek}</strong> from {formatTime(deleteTarget.startTime)} to {formatTime(deleteTarget.endTime)} in{' '}
                <strong>{deleteTarget.room}</strong>?
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
