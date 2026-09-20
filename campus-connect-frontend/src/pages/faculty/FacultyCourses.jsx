/**
 * FacultyCourses — lists courses assigned to the faculty with student roster viewing.
 */
import { useState, useEffect } from 'react';
import { getMyFacultyCourses, getCourseStudents } from '../../api/courseApi';
import {
  HiOutlineBookOpen,
  HiOutlineUserGroup,
  HiOutlineX,
  HiOutlineAcademicCap,
} from 'react-icons/hi';

export default function FacultyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Enrolled Students Roster Modal State
  const [rosterCourse, setRosterCourse] = useState(null);
  const [rosterStudents, setRosterStudents] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  const fetchFacultyCourses = async () => {
    try {
      setLoading(true);
      const res = await getMyFacultyCourses();
      setCourses(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assigned courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyCourses();
  }, []);

  const handleViewRoster = async (course) => {
    try {
      setRosterCourse(course);
      setRosterLoading(true);
      const res = await getCourseStudents(course.id);
      setRosterStudents(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load enrolled students.');
    } finally {
      setRosterLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>My Assigned Courses</h1>
        <p>Manage curriculum, track student enrollment, and view class rosters.</p>
      </div>

      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading assigned courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="dashboard-section">
          <div className="empty-state">
            <div className="empty-state-icon">📖</div>
            <h4>No courses assigned yet</h4>
            <p>You have not been assigned to instruct any courses. Contact your administrator.</p>
          </div>
        </div>
      ) : (
        <div className="cards-grid">
          {courses.map((course) => (
            <div key={course.id} className="course-card">
              <div>
                <div className="course-card-header">
                  <span className="course-code">{course.courseCode}</span>
                  <span className="badge badge-primary">{course.credits} Credits</span>
                </div>

                <h3 className="course-title">{course.courseName}</h3>
                <p className="course-desc">{course.description || 'No description available.'}</p>

                <div className="course-meta">
                  <div className="course-meta-row">
                    <span>Department:</span>
                    <strong>{course.department}</strong>
                  </div>
                  <div className="course-meta-row">
                    <span>Semester:</span>
                    <strong>Semester {course.semester}</strong>
                  </div>
                  <div className="course-meta-row">
                    <span>Enrolled Students:</span>
                    <span className="badge badge-success">{course.enrolledStudentsCount || 0} Students</span>
                  </div>
                </div>
              </div>

              <div className="course-card-footer">
                <button
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => handleViewRoster(course)}
                >
                  <HiOutlineUserGroup /> View Enrolled Students ({course.enrolledStudentsCount || 0})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enrolled Students Roster Modal */}
      {rosterCourse && (
        <div className="modal-overlay" onClick={() => setRosterCourse(null)}>
          <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="course-code">{rosterCourse.courseCode}</span>
                <h3 style={{ marginTop: '0.25rem' }}>Enrolled Students Roster</h3>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                  {rosterCourse.courseName} ({rosterStudents.length} Students)
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setRosterCourse(null)}>
                <HiOutlineX />
              </button>
            </div>

            <div className="modal-body">
              {rosterLoading ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>Loading roster...</p>
                </div>
              ) : rosterStudents.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <HiOutlineAcademicCap style={{ fontSize: '2.5rem', opacity: 0.5 }} />
                  <h4>No students enrolled</h4>
                  <p>No students have registered for this course yet.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Roll Number</th>
                        <th>Student Name</th>
                        <th>Department</th>
                        <th>Enrolled Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rosterStudents.map((enrollment) => (
                        <tr key={enrollment.id}>
                          <td><strong>{enrollment.studentRollNumber}</strong></td>
                          <td>{enrollment.studentName}</td>
                          <td>{enrollment.studentDepartment}</td>
                          <td>{enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : 'Active'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setRosterCourse(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
