/**
 * StudentDashboard — displays student academic summary with live attendance metrics.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyEnrolledCourses } from '../../api/studentApi';
import { getMyAttendance } from '../../api/attendanceApi';
import { getAllAssignments } from '../../api/assignmentApi';
import { getTodaySchedules } from '../../api/scheduleApi';
import { getAllStudyMaterials } from '../../api/studyMaterialApi';
import { getAllAnnouncements } from '../../api/announcementApi';
import { getUnreadMessageCount } from '../../api/messageApi';
import {
  HiOutlineBookOpen,
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlineArrowRight,
  HiOutlineAcademicCap,
  HiOutlineExclamation,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineLocationMarker,
  HiOutlineFolder,
  HiOutlineSpeakerphone,
  HiOutlineChatAlt2,
  HiOutlineChartBar,
} from 'react-icons/hi';
import '../../styles/dashboard.css';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [studyMaterials, setStudyMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [coursesRes, attendanceRes, assignRes, todaySchedRes, materialsRes, annRes, msgRes] = await Promise.all([
          getMyEnrolledCourses(),
          getMyAttendance().catch(() => ({ data: { data: null } })),
          getAllAssignments().catch(() => ({ data: { data: [] } })),
          getTodaySchedules().catch(() => ({ data: { data: [] } })),
          getAllStudyMaterials().catch(() => ({ data: { data: [] } })),
          getAllAnnouncements().catch(() => ({ data: { data: [] } })),
          getUnreadMessageCount().catch(() => ({ data: { data: { unreadCount: 0 } } })),
        ]);
        setEnrolledCourses(coursesRes.data.data || []);
        setAttendanceData(attendanceRes.data.data);
        setAssignments(assignRes.data.data || []);
        setTodayClasses(todaySchedRes.data.data || []);
        setStudyMaterials(materialsRes.data.data || []);
        setAnnouncements(annRes.data.data || []);
        setUnreadMessages(msgRes.data.data?.unreadCount || 0);
      } catch (err) {
        console.error('Failed to load student dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);




  const totalCredits = enrolledCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
  const attendancePct = attendanceData?.overallAttendancePercentage;
  const isSafeAttendance = attendanceData?.totalClassesAllCourses === 0 || (attendancePct && attendancePct >= 75);
  const pendingAssignments = assignments.filter(a => a.submissionStatus === 'NOT_SUBMITTED');
  const upcomingAssignments = pendingAssignments
    .filter(a => !a.isOverdue)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 3);

  return (
    <div>
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <h2>Welcome back, {user?.fullName?.split(' ')[0]}! 👋</h2>
        <p>Here is a summary of your academic progress, enrolled courses, and attendance standing.</p>
      </div>

      {/* Attendance Shortage Warning Alert */}
      {attendanceData?.hasLowAttendanceWarning && (
        <div
          className="alert alert-error"
          style={{
            backgroundColor: '#fef2f2',
            borderColor: '#f87171',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <HiOutlineExclamation style={{ fontSize: '1.4rem', color: '#dc2626' }} />
            <span style={{ color: '#991b1b', fontSize: 'var(--font-size-sm)' }}>
              <strong>Attendance Shortage Alert:</strong> You have low attendance in one or more subjects (&lt; 75%).
            </span>
          </div>
          <Link to="/student/attendance" className="btn btn-sm btn-outline-danger">
            View Details
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <HiOutlineBookOpen />
          </div>
          <div className="stat-info">
            <h3>{loading ? '...' : enrolledCourses.length}</h3>
            <p>Enrolled Courses</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <HiOutlineAcademicCap />
          </div>
          <div className="stat-info">
            <h3>{loading ? '...' : totalCredits}</h3>
            <p>Total Credits</p>
          </div>
        </div>

        <div className="stat-card">
          <div className={`stat-icon ${isSafeAttendance ? 'success' : 'danger'}`}>
            <HiOutlineClipboardList />
          </div>
          <div className="stat-info">
            <h3 style={{ color: isSafeAttendance ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {loading ? '...' : attendanceData?.totalClassesAllCourses > 0 ? `${attendancePct}%` : 'N/A'}
            </h3>
            <p>Overall Attendance</p>
          </div>
        </div>

        <div className="stat-card">
          <div className={`stat-icon ${pendingAssignments.length > 0 ? 'warning' : 'success'}`}>
            <HiOutlineDocumentText />
          </div>
          <div className="stat-info">
            <h3>{loading ? '...' : pendingAssignments.length}</h3>
            <p>Pending Assignments</p>
          </div>
        </div>

        <div className="stat-card">
          <div className={`stat-icon ${unreadMessages > 0 ? 'warning' : 'primary'}`}>
            <HiOutlineChatAlt2 />
          </div>
          <div className="stat-info">
            <h3 style={{ color: unreadMessages > 0 ? 'var(--color-primary)' : 'inherit' }}>
              {loading ? '...' : unreadMessages}
            </h3>
            <p>Unread Messages</p>
          </div>
        </div>

        <Link to="/student/analytics" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-icon purple">
            <HiOutlineChartBar />
          </div>
          <div className="stat-info">
            <h3 style={{ color: 'var(--color-primary)' }}>Reports</h3>
            <p>Academic Analytics ➔</p>
          </div>
        </Link>
      </div>

      {/* Quick Action / Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Attendance Quick Card */}
        <div className="dashboard-section" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3>📊 Attendance Overview</h3>
            <Link to="/student/attendance" className="btn btn-outline btn-sm">
              Full Report <HiOutlineArrowRight />
            </Link>
          </div>

          {attendanceData?.courseSummaries && attendanceData.courseSummaries.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {attendanceData.courseSummaries.slice(0, 3).map((cs) => (
                <div key={cs.courseId} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginBottom: '4px' }}>
                    <span><strong>{cs.courseCode}</strong> &bull; {cs.courseName}</span>
                    <strong style={{ color: cs.attendancePercentage >= 75 || cs.totalClasses === 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {cs.totalClasses > 0 ? `${cs.attendancePercentage}%` : '—'}
                    </strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(cs.attendancePercentage, 100)}%`,
                        height: '100%',
                        backgroundColor: cs.attendancePercentage >= 75 || cs.totalClasses === 0 ? '#10b981' : '#ef4444',
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
              No attendance records recorded yet.
            </p>
          )}
        </div>

        {/* Recent Enrolled Courses Section */}
        <div className="dashboard-section" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3>📚 Enrolled Subjects</h3>
            <Link to="/student/my-courses" className="btn btn-outline btn-sm">
              View All <HiOutlineArrowRight />
            </Link>
          </div>

          {enrolledCourses.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
              No enrolled courses. <Link to="/student/courses">Browse Catalog</Link>
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {enrolledCourses.slice(0, 3).map((course) => (
                <div key={course.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <span className="course-code" style={{ fontSize: '0.7rem' }}>{course.courseCode}</span>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginTop: '2px' }}>{course.courseName}</div>
                  </div>
                  <span className="badge badge-primary">{course.credits} Cr</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Assignments Section */}
        <div className="dashboard-section" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3>📝 Upcoming Assignments</h3>
            <Link to="/student/assignments" className="btn btn-outline btn-sm">
              View All <HiOutlineArrowRight />
            </Link>
          </div>

          {upcomingAssignments.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
              No pending assignments. You're all caught up!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {upcomingAssignments.map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <span className="course-code" style={{ fontSize: '0.7rem' }}>{a.courseCode}</span>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginTop: '2px' }}>{a.title}</div>
                  </div>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-warning)' }}>
                    Due {new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Timetable Section */}
        <div className="dashboard-section" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3>🗓️ Today's Classes</h3>
            <Link to="/student/timetable" className="btn btn-outline btn-sm">
              Timetable <HiOutlineArrowRight />
            </Link>
          </div>

          {todayClasses.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
              No lectures scheduled for today.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {todayClasses.map((c) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <span className="course-code" style={{ fontSize: '0.7rem' }}>{c.courseCode}</span>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginTop: '2px' }}>{c.courseName}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      <HiOutlineLocationMarker style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                      {c.room} &bull; {c.facultyName}
                    </div>
                  </div>
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                    {c.startTime?.slice(0, 5)} - {c.endTime?.slice(0, 5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Study Materials Section */}
        <div className="dashboard-section" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3>📂 Course Materials</h3>
            <Link to="/student/study-materials" className="btn btn-outline btn-sm">
              View All <HiOutlineArrowRight />
            </Link>
          </div>

          {studyMaterials.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
              No study materials uploaded yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {studyMaterials.slice(0, 3).map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ overflow: 'hidden', paddingRight: '0.5rem' }}>
                    <span className="course-code" style={{ fontSize: '0.7rem' }}>{m.courseCode}</span>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.title}
                    </div>
                  </div>
                  <Link to="/student/study-materials" className="btn btn-sm btn-outline" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                    Access
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Announcements Feed Widget */}
        <div className="dashboard-section" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3>📢 Campus Notices</h3>
            <Link to="/student/announcements" className="btn btn-outline btn-sm">
              Notice Board <HiOutlineArrowRight />
            </Link>
          </div>

          {announcements.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
              No notices published right now.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {announcements.slice(0, 3).map((a) => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ overflow: 'hidden', paddingRight: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                      <span className={`badge ${a.priority === 'URGENT' ? 'badge-danger' : a.priority === 'IMPORTANT' ? 'badge-warning' : 'badge-primary'}`} style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                        {a.priority}
                      </span>
                      {!a.isRead && (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-block' }}></span>
                      )}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.title}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {a.authorName} &bull; {a.targetAudience === 'COURSE' ? a.courseCode : a.targetAudience}
                    </div>
                  </div>
                  <Link to="/student/announcements" className="btn btn-sm btn-outline" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                    Read
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


