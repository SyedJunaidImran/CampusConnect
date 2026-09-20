/**
 * StudentEnrolledCourses — displays courses the student is currently enrolled in with drop/unenroll capabilities.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyEnrolledCourses, unenrollFromCourse } from '../../api/studentApi';
import {
  HiOutlineBookOpen,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlinePlus,
  HiOutlineCalendar,
} from 'react-icons/hi';

export default function StudentEnrolledCourses() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // courseId being unenrolled

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const res = await getMyEnrolledCourses();
      setEnrollments(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load enrolled courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const handleUnenroll = async (courseId, courseName) => {
    if (!window.confirm(`Are you sure you want to drop "${courseName}"?`)) {
      return;
    }

    try {
      setActionLoading(courseId);
      setError('');
      setSuccessMsg('');

      const res = await unenrollFromCourse(courseId);
      setSuccessMsg(res.data.message || 'Dropped course successfully.');

      setEnrollments((prev) => prev.filter((e) => e.courseId !== courseId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to drop course.');
    } finally {
      setActionLoading(null);
    }
  };

  const totalCredits = enrollments.reduce((acc, curr) => acc + (curr.credits || 0), 0);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>My Enrolled Courses</h1>
          <p>Track your registered subjects, faculty instructors, and credit load.</p>
        </div>
        <Link to="/student/courses" className="btn btn-primary">
          <HiOutlinePlus /> Browse Catalog
        </Link>
      </div>

      {/* Notifications */}
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

      {/* Academic Load Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon primary">
            <HiOutlineBookOpen />
          </div>
          <div className="stat-info">
            <h3>{enrollments.length}</h3>
            <p>Enrolled Subjects</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <HiOutlineCheckCircle />
          </div>
          <div className="stat-info">
            <h3>{totalCredits}</h3>
            <p>Total Credits</p>
          </div>
        </div>
      </div>

      {/* Enrolled Courses Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your courses...</p>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="dashboard-section">
          <div className="empty-state">
            <div className="empty-state-icon">📖</div>
            <h4>You are not enrolled in any courses yet</h4>
            <p>Visit the course catalog to register for this semester's subjects.</p>
            <Link to="/student/courses" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Browse Available Courses
            </Link>
          </div>
        </div>
      ) : (
        <div className="cards-grid">
          {enrollments.map((item) => (
            <div key={item.id} className="course-card">
              <div>
                <div className="course-card-header">
                  <span className="course-code">{item.courseCode}</span>
                  <span className="badge badge-primary">{item.credits} Credits</span>
                </div>

                <h3 className="course-title">{item.courseName}</h3>

                <div className="course-meta">
                  <div className="course-meta-row">
                    <span>Department:</span>
                    <strong>{item.department}</strong>
                  </div>
                  <div className="course-meta-row">
                    <span>Semester:</span>
                    <strong>Semester {item.semester}</strong>
                  </div>
                  <div className="course-meta-row">
                    <span>Instructor:</span>
                    <strong>{item.facultyName || 'To be assigned'}</strong>
                  </div>
                  <div className="course-meta-row">
                    <span>Enrolled On:</span>
                    <span>{item.enrolledAt ? new Date(item.enrolledAt).toLocaleDateString() : 'Active'}</span>
                  </div>
                </div>
              </div>

              <div className="course-card-footer">
                <span className="badge badge-success">
                  <HiOutlineCheckCircle style={{ marginRight: '4px' }} /> Registered
                </span>

                <button
                  className="btn btn-outline-danger btn-sm"
                  disabled={actionLoading === item.courseId}
                  onClick={() => handleUnenroll(item.courseId, item.courseName)}
                >
                  <HiOutlineTrash />
                  {actionLoading === item.courseId ? 'Dropping...' : 'Drop Course'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
