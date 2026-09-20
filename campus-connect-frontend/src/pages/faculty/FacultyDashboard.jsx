/**
 * FacultyDashboard — displays faculty assigned courses, total students, and quick attendance access.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyFacultyCourses } from '../../api/courseApi';
import { getAllAssignments } from '../../api/assignmentApi';
import { getTodaySchedules } from '../../api/scheduleApi';
import { getAllStudyMaterials } from '../../api/studyMaterialApi';
import { getAllAnnouncements } from '../../api/announcementApi';
import { getUnreadMessageCount } from '../../api/messageApi';
import {
  HiOutlineBookOpen,
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineClipboardCheck,
  HiOutlineArrowRight,
  HiOutlinePlus,
  HiOutlineCalendar,
  HiOutlineLocationMarker,
  HiOutlineFolder,
  HiOutlineSpeakerphone,
  HiOutlineChatAlt2,
  HiOutlineChartBar,
} from 'react-icons/hi';
import '../../styles/dashboard.css';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [todayLectures, setTodayLectures] = useState([]);
  const [studyMaterials, setStudyMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [coursesRes, assignmentsRes, todaySchedRes, matRes, annRes, msgRes] = await Promise.all([
          getMyFacultyCourses(),
          getAllAssignments().catch(() => ({ data: { data: [] } })),
          getTodaySchedules().catch(() => ({ data: { data: [] } })),
          getAllStudyMaterials().catch(() => ({ data: { data: [] } })),
          getAllAnnouncements().catch(() => ({ data: { data: [] } })),
          getUnreadMessageCount().catch(() => ({ data: { data: { unreadCount: 0 } } })),
        ]);
        setCourses(coursesRes.data.data || []);
        setAssignments(assignmentsRes.data.data || []);
        setTodayLectures(todaySchedRes.data.data || []);
        setStudyMaterials(matRes.data.data || []);
        setAnnouncements(annRes.data.data || []);
        setUnreadMessages(msgRes.data.data?.unreadCount || 0);
      } catch (err) {
        console.error('Failed to load faculty dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);



  const totalStudents = courses.reduce((sum, c) => sum + (c.enrolledStudentsCount || 0), 0);
  const totalSubmissions = assignments.reduce((sum, a) => sum + (a.submissionCount || 0), 0);

  return (
    <div>
      <div className="welcome-banner">
        <h2>Welcome, {user?.fullName?.split(' ')[0]}! 👋</h2>
        <p>Manage your assigned classes, take daily attendance, and publish course assignments.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary"><HiOutlineBookOpen /></div>
          <div className="stat-info">
            <h3>{loading ? '...' : courses.length}</h3>
            <p>Assigned Courses</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><HiOutlineUserGroup /></div>
          <div className="stat-info">
            <h3>{loading ? '...' : totalStudents}</h3>
            <p>Total Enrolled Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon primary"><HiOutlineClipboardCheck /></div>
          <div className="stat-info">
            <h3>Active</h3>
            <p>Attendance Tracker</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><HiOutlineDocumentText /></div>
          <div className="stat-info">
            <h3>{loading ? '...' : assignments.length}</h3>
            <p>Active Assignments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon primary"><HiOutlineFolder /></div>
          <div className="stat-info">
            <h3>{loading ? '...' : studyMaterials.length}</h3>
            <p>Course Materials</p>
          </div>
        </div>
        <div className="stat-card">
          <div className={`stat-icon ${unreadMessages > 0 ? 'warning' : 'primary'}`}><HiOutlineChatAlt2 /></div>
          <div className="stat-info">
            <h3 style={{ color: unreadMessages > 0 ? 'var(--color-primary)' : 'inherit' }}>
              {loading ? '...' : unreadMessages}
            </h3>
            <p>Unread Messages</p>
          </div>
        </div>
        <Link to="/faculty/analytics" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-icon purple"><HiOutlineChartBar /></div>
          <div className="stat-info">
            <h3 style={{ color: 'var(--color-primary)' }}>Reports</h3>
            <p>Course Analytics ➔</p>
          </div>
        </Link>
      </div>


      {/* Quick Action Banner for Attendance */}
      <div className="dashboard-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'linear-gradient(to right, #f8fafc, #eef2ff)', borderLeft: '4px solid var(--color-primary)' }}>
        <div>
          <h3 style={{ margin: 0, border: 'none', padding: 0 }}>📋 Daily Lecture Attendance</h3>
          <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            Record or update attendance sheets for today's lectures.
          </p>
        </div>
        <Link to="/faculty/attendance" className="btn btn-primary">
          <HiOutlineClipboardCheck /> Mark Attendance
        </Link>
      </div>

      <div className="dashboard-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>📚 My Assigned Courses</h3>
          <Link to="/faculty/courses" className="btn btn-outline btn-sm">
            View All <HiOutlineArrowRight />
          </Link>
        </div>

        {loading ? (
          <div className="loading-container" style={{ padding: '1rem' }}>
            <div className="spinner"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📖</div>
            <h4>No courses assigned yet</h4>
            <p>Your department administrator will assign courses to your schedule.</p>
          </div>
        ) : (
          <div className="cards-grid">
            {courses.slice(0, 3).map((course) => (
              <div key={course.id} className="course-card" style={{ padding: '1rem' }}>
                <div className="course-card-header">
                  <span className="course-code">{course.courseCode}</span>
                  <span className="badge badge-success">{course.enrolledStudentsCount || 0} Students</span>
                </div>
                <h4 style={{ margin: '0.25rem 0 0.5rem', fontSize: 'var(--font-size-base)' }}>{course.courseName}</h4>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                  Semester {course.semester} &bull; {course.credits} Credits
                </div>
                <Link to="/faculty/attendance" className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                  <HiOutlineClipboardCheck /> Take Attendance
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Scheduled Lectures */}
      <div className="dashboard-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>🗓️ Today's Scheduled Lectures</h3>
          <Link to="/faculty/timetable" className="btn btn-outline btn-sm">
            Full Timetable <HiOutlineArrowRight />
          </Link>
        </div>

        {todayLectures.length === 0 ? (
          <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
            No lectures scheduled for today.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {todayLectures.map((slot) => (
              <div key={slot.id} className="schedule-card" style={{ padding: '1rem' }}>
                <div className="schedule-card-top">
                  <span className="course-code">{slot.courseCode}</span>
                  <span className="schedule-time">
                    {slot.startTime?.slice(0, 5)} - {slot.endTime?.slice(0, 5)}
                  </span>
                </div>
                <div className="schedule-course-name">{slot.courseName}</div>
                <div className="schedule-meta" style={{ marginTop: '0.5rem' }}>
                  <div className="schedule-meta-item">
                    <HiOutlineLocationMarker style={{ color: 'var(--color-primary)' }} />
                    <strong>{slot.room}</strong>
                  </div>
                  <div className="schedule-meta-item">
                    <span>Sem {slot.semester}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Notices Feed */}
      <div className="dashboard-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>📢 Department & Course Notices</h3>
          <Link to="/faculty/announcements" className="btn btn-outline btn-sm">
            Manage Notices <HiOutlineArrowRight />
          </Link>
        </div>


        {announcements.length === 0 ? (
          <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
            No notices published right now.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {announcements.slice(0, 3).map((a) => (
              <div key={a.id} className="card" style={{ padding: '1rem', borderLeft: '3px solid var(--color-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span className={`badge ${a.priority === 'URGENT' ? 'badge-danger' : a.priority === 'IMPORTANT' ? 'badge-warning' : 'badge-primary'}`} style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                    {a.priority}
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    {a.targetAudience === 'COURSE' ? a.courseCode : a.targetAudience}
                  </span>
                </div>
                <h4 style={{ margin: '0.25rem 0', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{a.title}</h4>
                <p style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  margin: '0.25rem 0 0.5rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {a.content}
                </p>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                  By: {a.authorName} ({a.authorRole})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

