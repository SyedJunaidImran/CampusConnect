/**
 * AdminStudents — Student directory and profile inspection interface for Administrators.
 */
import { useState, useEffect } from 'react';
import { getAllStudents } from '../../api/studentApi';
import {
  HiOutlineSearch,
  HiOutlineAcademicCap,
  HiOutlineX,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineEye,
} from 'react-icons/hi';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Selected Student for Detail Modal
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await getAllStudents();
      setStudents(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const departments = ['ALL', ...new Set(students.map((s) => s.department).filter(Boolean))];

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || s.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div>
      <div className="page-header">
        <h1>Student Directory</h1>
        <p>Browse and review student academic records and enrolled courses.</p>
      </div>

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
              placeholder="Search by name, roll number, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="select-filter"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'ALL' ? 'All Departments' : dept}
              </option>
            ))}
          </select>
        </div>

        <div className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
          Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading student directory...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="dashboard-section">
          <div className="empty-state">
            <div className="empty-state-icon">🎓</div>
            <h4>No students found</h4>
            <p>No student records match the search criteria.</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Semester</th>
                <th>Admission Year</th>
                <th>Enrolled Courses</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>
                    <strong>{student.rollNumber}</strong>
                  </td>
                  <td>{student.fullName}</td>
                  <td>{student.email}</td>
                  <td>{student.department}</td>
                  <td>Semester {student.semester}</td>
                  <td>{student.yearOfAdmission}</td>
                  <td>
                    <span className="badge badge-primary">{student.enrolledCoursesCount || 0} Subjects</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <HiOutlineEye /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="badge badge-primary">Roll No: {selectedStudent.rollNumber}</span>
                <h3 style={{ marginTop: '0.25rem' }}>{selectedStudent.fullName}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedStudent(null)}>
                <HiOutlineX />
              </button>
            </div>

            <div className="modal-body">
              <div className="profile-info-grid">
                <div className="info-item">
                  <label><HiOutlineMail style={{ verticalAlign: 'middle' }} /> Email</label>
                  <div className="value">{selectedStudent.email}</div>
                </div>

                <div className="info-item">
                  <label><HiOutlineAcademicCap style={{ verticalAlign: 'middle' }} /> Department</label>
                  <div className="value">{selectedStudent.department}</div>
                </div>

                <div className="info-item">
                  <label>Semester</label>
                  <div className="value">Semester {selectedStudent.semester}</div>
                </div>

                <div className="info-item">
                  <label>Year of Admission</label>
                  <div className="value">{selectedStudent.yearOfAdmission}</div>
                </div>

                <div className="info-item">
                  <label><HiOutlinePhone style={{ verticalAlign: 'middle' }} /> Phone</label>
                  <div className="value">{selectedStudent.phone || 'Not provided'}</div>
                </div>

                <div className="info-item">
                  <label>Active Enrollments</label>
                  <div className="value">{selectedStudent.enrolledCoursesCount || 0} Courses</div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedStudent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
