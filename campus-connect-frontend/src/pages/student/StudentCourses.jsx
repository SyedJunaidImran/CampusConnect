/**
 * StudentCourses — Course catalog for students to browse and enroll in courses.
 */
import { useState, useEffect } from 'react';
import { getAllCourses } from '../../api/courseApi';
import { enrollInCourse } from '../../api/studentApi';
import {
  HiOutlineSearch,
  HiOutlineBookOpen,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle,
  HiOutlineX,
} from 'react-icons/hi';

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // courseId currently enrolling

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Course Details Modal
  const [selectedCourse, setSelectedCourse] = useState(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await getAllCourses();
      setCourses(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEnroll = async (courseId) => {
    try {
      setActionLoading(courseId);
      setError('');
      setSuccessMsg('');

      const res = await enrollInCourse(courseId);
      setSuccessMsg(res.data.message || 'Successfully enrolled in course!');

      // Update state locally so the button immediately reflects "Enrolled"
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, isEnrolled: true, enrolledStudentsCount: (c.enrolledStudentsCount || 0) + 1 } : c))
      );

      if (selectedCourse?.id === courseId) {
        setSelectedCourse((prev) => ({ ...prev, isEnrolled: true }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Enrollment failed.');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter courses based on search text and department dropdown
  const departments = ['ALL', ...new Set(courses.map((c) => c.department).filter(Boolean))];

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.facultyName && c.facultyName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept = departmentFilter === 'ALL' || c.department === departmentFilter;

    return matchesSearch && matchesDept;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1>Course Catalog</h1>
        <p>Explore and enroll in academic courses for your semester and major.</p>
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

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-filter-group">
          <div className="search-input-wrapper">
            <HiOutlineSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by code, title, or instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="select-filter"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'ALL' ? 'All Departments' : dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Course List */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading course catalog...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="dashboard-section">
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <h4>No courses found</h4>
            <p>Try adjusting your search criteria or filter.</p>
          </div>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredCourses.map((course) => (
            <div key={course.id} className="course-card">
              <div>
                <div className="course-card-header">
                  <span className="course-code">{course.courseCode}</span>
                  <span className="badge badge-primary">{course.credits} Credits</span>
                </div>

                <h3 className="course-title">{course.courseName}</h3>
                <p className="course-desc">{course.description || 'No course description available.'}</p>

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
                    <span>Instructor:</span>
                    <strong>{course.facultyName || 'TBA'}</strong>
                  </div>
                </div>
              </div>

              <div className="course-card-footer">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setSelectedCourse(course)}
                >
                  <HiOutlineInformationCircle /> Details
                </button>

                {course.isEnrolled ? (
                  <span className="badge badge-success" style={{ padding: '0.5rem 0.8rem' }}>
                    <HiOutlineCheckCircle style={{ marginRight: '4px' }} /> Enrolled
                  </span>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={actionLoading === course.id}
                    onClick={() => handleEnroll(course.id)}
                  >
                    {actionLoading === course.id ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Details Modal */}
      {selectedCourse && (
        <div className="modal-overlay" onClick={() => setSelectedCourse(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="course-code">{selectedCourse.courseCode}</span>
                <h3 style={{ marginTop: '0.25rem' }}>{selectedCourse.courseName}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedCourse(null)}>
                <HiOutlineX />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                {selectedCourse.description || 'No description provided for this course.'}
              </p>

              <div className="dashboard-section" style={{ padding: '1rem', background: '#f8fafc' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: 'var(--font-size-sm)' }}>
                  <div><strong>Department:</strong> {selectedCourse.department}</div>
                  <div><strong>Semester:</strong> Semester {selectedCourse.semester}</div>
                  <div><strong>Credits:</strong> {selectedCourse.credits}</div>
                  <div><strong>Enrolled Students:</strong> {selectedCourse.enrolledStudentsCount || 0}</div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong>Instructor:</strong> {selectedCourse.facultyName ? `${selectedCourse.facultyName} (${selectedCourse.facultyDesignation || 'Faculty'})` : 'To be announced'}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedCourse(null)}>
                Close
              </button>
              {selectedCourse.isEnrolled ? (
                <span className="badge badge-success" style={{ padding: '0.6rem 1rem' }}>
                  <HiOutlineCheckCircle /> Enrolled
                </span>
              ) : (
                <button
                  className="btn btn-primary"
                  disabled={actionLoading === selectedCourse.id}
                  onClick={() => handleEnroll(selectedCourse.id)}
                >
                  {actionLoading === selectedCourse.id ? 'Enrolling...' : 'Enroll in Course'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
