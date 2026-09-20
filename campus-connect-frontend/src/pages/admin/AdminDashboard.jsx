/**
 * AdminDashboard — Administrator console overview with system metrics and management links.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllCourses } from '../../api/courseApi';
import { getAllStudents } from '../../api/studentApi';
import { getAllFaculty } from '../../api/facultyApi';
import { getAllAssignments } from '../../api/assignmentApi';
import { getAllSchedules } from '../../api/scheduleApi';
import { getAllStudyMaterials } from '../../api/studyMaterialApi';
import { getAllAnnouncements } from '../../api/announcementApi';
import {
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineBookOpen,
  HiOutlineClipboardCheck,
  HiOutlineDocumentText,
  HiOutlineCalendar,
  HiOutlineArrowRight,
  HiOutlinePlus,
  HiOutlineFolder,
  HiOutlineSpeakerphone,
  HiOutlineChartBar,
} from 'react-icons/hi';
import '../../styles/dashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [coursesCount, setCoursesCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [facultyCount, setFacultyCount] = useState(0);
  const [assignmentsCount, setAssignmentsCount] = useState(0);
  const [schedulesCount, setSchedulesCount] = useState(0);
  const [materialsCount, setMaterialsCount] = useState(0);
  const [announcementsCount, setAnnouncementsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminMetrics = async () => {
      try {
        setLoading(true);
        const [cRes, sRes, fRes, aRes, schedRes, matRes, annRes] = await Promise.all([
          getAllCourses(),
          getAllStudents(),
          getAllFaculty(),
          getAllAssignments().catch(() => ({ data: { data: [] } })),
          getAllSchedules().catch(() => ({ data: { data: [] } })),
          getAllStudyMaterials().catch(() => ({ data: { data: [] } })),
          getAllAnnouncements().catch(() => ({ data: { data: [] } })),
        ]);
        setCoursesCount(cRes.data.data?.length || 0);
        setStudentsCount(sRes.data.data?.length || 0);
        setFacultyCount(fRes.data.data?.length || 0);
        setAssignmentsCount(aRes.data.data?.length || 0);
        setSchedulesCount(schedRes.data.data?.length || 0);
        setMaterialsCount(matRes.data.data?.length || 0);
        setAnnouncementsCount(annRes.data.data?.length || 0);
      } catch (err) {
        console.error('Failed to load admin metrics', err);
      } finally {
        setLoading(false);
      }
    };
    loadAdminMetrics();
  }, []);


  return (
    <div>
      <div className="welcome-banner">
        <h2>Administrator Console — Welcome, {user?.fullName?.split(' ')[0]}! 🛡️</h2>
        <p>Oversee college operations, manage curriculum courses, student directory, faculty records, and timetable scheduling.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary"><HiOutlineAcademicCap /></div>
          <div className="stat-info">
            <h3>{loading ? '...' : studentsCount}</h3>
            <p>Total Registered Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><HiOutlineUserGroup /></div>
          <div className="stat-info">
            <h3>{loading ? '...' : facultyCount}</h3>
            <p>Total Faculty Members</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><HiOutlineBookOpen /></div>
          <div className="stat-info">
            <h3>{loading ? '...' : coursesCount}</h3>
            <p>Active Curriculum Courses</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon primary"><HiOutlineFolder /></div>
          <div className="stat-info">
            <h3>{loading ? '...' : materialsCount}</h3>
            <p>Study Materials</p>
          </div>
        </div>
      </div>

      {/* Quick Access Management Grid */}
      <div className="dashboard-section">
        <h3>⚡ Administration Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
            <h4>📚 Manage Courses</h4>
            <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>Create new courses, edit syllabus, and assign faculty.</p>
            <Link to="/admin/courses" className="btn btn-primary btn-sm">
              <HiOutlinePlus /> Course Manager
            </Link>
          </div>

          <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
            <h4>🗓️ Master Timetable</h4>
            <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>Configure lecture timings, allocate classrooms, and resolve conflicts.</p>
            <Link to="/admin/timetable" className="btn btn-primary btn-sm">
              <HiOutlinePlus /> Timetable Console
            </Link>
          </div>

          <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
            <h4>📂 Study Materials</h4>
            <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>Upload, organize, and manage course notes, slide decks, and syllabi.</p>
            <Link to="/admin/study-materials" className="btn btn-primary btn-sm">
              <HiOutlinePlus /> Materials Console
            </Link>
          </div>

          <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
            <h4>🎓 Student Directory</h4>
            <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>Browse student admissions, semesters, and enrollment counts.</p>
            <Link to="/admin/students" className="btn btn-outline btn-sm">
              View Students <HiOutlineArrowRight />
            </Link>
          </div>

          <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
            <h4>📊 Analytics & Reports</h4>
            <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>System-wide performance, course enrollments, attendance, and printable reports.</p>
            <Link to="/admin/analytics" className="btn btn-primary btn-sm">
              <HiOutlineChartBar /> Institutional Analytics
            </Link>
          </div>

          <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
            <h4>📢 Announcements</h4>
            <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>Inspect and verify attendance sheets across all courses and dates.</p>
            <Link to="/admin/attendance" className="btn btn-outline btn-sm">
              View Attendance <HiOutlineArrowRight />
            </Link>
          </div>

          <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
            <h4>📢 Campus Notices</h4>
            <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>Broadcast announcements to students, faculty, or all college members.</p>
            <Link to="/admin/announcements" className="btn btn-primary btn-sm">
              <HiOutlinePlus /> Broadcast Console
            </Link>
          </div>

          <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
            <h4>📝 Assignments Oversight</h4>
            <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>Audit assignments, view submission metrics, and track progress.</p>
            <Link to="/admin/assignments" className="btn btn-outline btn-sm">
              Manage Assignments <HiOutlineArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </div>

  );
}

