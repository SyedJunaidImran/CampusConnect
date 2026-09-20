/**
 * ScheduleDetailModal — Clean details modal for a selected class schedule slot.
 */
import { Link } from 'react-router-dom';
import {
  HiOutlineClock,
  HiOutlineLocationMarker,
  HiOutlineUser,
  HiOutlineBookOpen,
  HiOutlineAcademicCap,
  HiOutlineX,
  HiOutlineExclamation,
  HiOutlineClipboardCheck,
  HiOutlineFolder,
} from 'react-icons/hi';

export default function ScheduleDetailModal({
  schedule,
  onClose,
  isFaculty = false,
  dateStr = '',
}) {
  if (!schedule) return null;

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHours = h % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return '';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
    if (totalMinutes <= 0) return '';
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${mins} mins`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content schedule-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div className="modal-detail-banner">
          <button className="modal-detail-close-btn" onClick={onClose} aria-label="Close modal">
            <HiOutlineX />
          </button>
          <span className="banner-code">{schedule.courseCode}</span>
          <h3>{schedule.courseName}</h3>
        </div>

        {/* Body */}
        <div className="modal-detail-body">
          {schedule.isConflict && (
            <div className="conflict-alert" style={{ margin: 0 }}>
              <HiOutlineExclamation style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>⚠ Schedule Conflict:</strong> This class overlaps with another scheduled class on your timetable.
              </div>
            </div>
          )}

          {/* Time & Duration */}
          <div className="detail-info-row">
            <div className="detail-info-icon">
              <HiOutlineClock />
            </div>
            <div className="detail-info-meta">
              <label>Schedule Timing</label>
              <div className="value">
                {formatTime(schedule.startTime)} – {formatTime(schedule.endTime)}
                {calculateDuration(schedule.startTime, schedule.endTime) && (
                  <span style={{ marginLeft: '6px', fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 600 }}>
                    ({calculateDuration(schedule.startTime, schedule.endTime)})
                  </span>
                )}
              </div>
              {dateStr && (
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {dateStr}
                </div>
              )}
            </div>
          </div>

          {/* Room / Location */}
          <div className="detail-info-row">
            <div className="detail-info-icon">
              <HiOutlineLocationMarker />
            </div>
            <div className="detail-info-meta">
              <label>Classroom Location</label>
              <div className="value">{schedule.room}</div>
            </div>
          </div>

          {/* Instructor / Context */}
          {!isFaculty && schedule.facultyName && (
            <div className="detail-info-row">
              <div className="detail-info-icon">
                <HiOutlineUser />
              </div>
              <div className="detail-info-meta">
                <label>Instructor</label>
                <div className="value">{schedule.facultyName}</div>
                {schedule.facultyEmail && (
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    {schedule.facultyEmail}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Academic Dept & Semester */}
          <div className="detail-info-row">
            <div className="detail-info-icon">
              <HiOutlineAcademicCap />
            </div>
            <div className="detail-info-meta">
              <label>Department & Semester</label>
              <div className="value">
                {schedule.department || 'Academic Department'} &bull; Semester {schedule.semester}
              </div>
            </div>
          </div>

          {/* Current Status Badge */}
          {schedule.liveStatus && (
            <div className="detail-info-row">
              <div className="detail-info-icon" style={{ backgroundColor: schedule.liveStatus === 'NOW' ? 'var(--color-success-light)' : '#f1f5f9' }}>
                <HiOutlineBookOpen style={{ color: schedule.liveStatus === 'NOW' ? 'var(--color-success)' : 'inherit' }} />
              </div>
              <div className="detail-info-meta">
                <label>Session Status</label>
                <div>
                  {schedule.liveStatus === 'NOW' && (
                    <span className="card-status-pill now">
                      <span className="pulse-dot"></span> In Session Now
                    </span>
                  )}
                  {schedule.liveStatus === 'NEXT' && (
                    <span className="card-status-pill next">Next Upcoming Class</span>
                  )}
                  {schedule.liveStatus === 'UPCOMING' && (
                    <span className="card-status-pill next">Upcoming Today</span>
                  )}
                  {schedule.liveStatus === 'COMPLETED' && (
                    <span className="card-status-pill completed">Completed Today</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-detail-footer">
          {isFaculty ? (
            <Link to="/faculty/attendance" className="btn btn-primary btn-sm" onClick={onClose}>
              <HiOutlineClipboardCheck /> Take Attendance
            </Link>
          ) : (
            <Link to="/student/study-materials" className="btn btn-outline btn-sm" onClick={onClose}>
              <HiOutlineFolder /> Course Materials
            </Link>
          )}
          <button className="btn btn-outline btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
