/**
 * AdminCourses — Course management interface for Administrators (Create, Read, Update, Delete).
 */
import { useState, useEffect } from 'react';
import { getAllCourses, createCourse, updateCourse, deleteCourse } from '../../api/courseApi';
import { getAllFaculty } from '../../api/facultyApi';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineCheckCircle,
  HiOutlineX,
  HiOutlineBookOpen,
} from 'react-icons/hi';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Modal State (Create & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null); // null = create mode
  const [formData, setFormData] = useState({
    courseCode: '',
    courseName: '',
    description: '',
    department: 'Computer Science',
    semester: 1,
    credits: 4,
    facultyId: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, facultyRes] = await Promise.all([
        getAllCourses(),
        getAllFaculty(),
      ]);
      setCourses(coursesRes.data.data || []);
      setFacultyList(facultyRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course management data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingCourseId(null);
    setFormData({
      courseCode: '',
      courseName: '',
      description: '',
      department: 'Computer Science',
      semester: 1,
      credits: 4,
      facultyId: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (course) => {
    setEditingCourseId(course.id);
    setFormData({
      courseCode: course.courseCode,
      courseName: course.courseName,
      description: course.description || '',
      department: course.department,
      semester: course.semester,
      credits: course.credits,
      facultyId: course.facultyId || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccessMsg('');

      const payload = {
        courseCode: formData.courseCode.trim().toUpperCase(),
        courseName: formData.courseName.trim(),
        description: formData.description?.trim() || '',
        department: formData.department.trim(),
        semester: parseInt(formData.semester, 10),
        credits: parseInt(formData.credits, 10),
        facultyId: formData.facultyId ? parseInt(formData.facultyId, 10) : null,
      };

      if (editingCourseId) {
        await updateCourse(editingCourseId, payload);
        setSuccessMsg(`Course "${payload.courseCode}" updated successfully.`);
      } else {
        await createCourse(payload);
        setSuccessMsg(`Course "${payload.courseCode}" created successfully.`);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save course.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId, courseCode) => {
    if (!window.confirm(`Are you sure you want to delete course "${courseCode}"? This will also remove any student enrollments.`)) {
      return;
    }

    try {
      setError('');
      setSuccessMsg('');
      await deleteCourse(courseId);
      setSuccessMsg(`Course "${courseCode}" deleted successfully.`);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete course.');
    }
  };

  const departments = ['ALL', ...new Set(courses.map((c) => c.department).filter(Boolean))];

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.facultyName && c.facultyName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = deptFilter === 'ALL' || c.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Course Management</h1>
          <p>Create, update, and assign faculty instructors to academic courses.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <HiOutlinePlus /> Create Course
        </button>
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
          Showing <strong>{filteredCourses.length}</strong> of <strong>{courses.length}</strong> courses
        </div>
      </div>

      {/* Data Table */}
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
            <p>Click "Create Course" to add the first course to the system.</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Course Title</th>
                <th>Department</th>
                <th>Semester</th>
                <th>Credits</th>
                <th>Assigned Instructor</th>
                <th>Enrolled</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <span className="course-code">{course.courseCode}</span>
                  </td>
                  <td>
                    <strong>{course.courseName}</strong>
                  </td>
                  <td>{course.department}</td>
                  <td>Semester {course.semester}</td>
                  <td>
                    <span className="badge badge-primary">{course.credits} Credits</span>
                  </td>
                  <td>{course.facultyName ? `${course.facultyName}` : <span className="text-muted">Unassigned</span>}</td>
                  <td>
                    <span className="badge badge-secondary">{course.enrolledStudentsCount || 0}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => openEditModal(course)}
                        title="Edit Course"
                      >
                        <HiOutlinePencil /> Edit
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDeleteCourse(course.id, course.courseCode)}
                        title="Delete Course"
                      >
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
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCourseId ? 'Edit Course' : 'Create New Course'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <HiOutlineX />
              </button>
            </div>

            <form onSubmit={handleSaveCourse}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="courseCode">Course Code</label>
                    <input
                      id="courseCode"
                      type="text"
                      className="form-input"
                      placeholder="e.g. CS101"
                      value={formData.courseCode}
                      onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="credits">Credits</label>
                    <input
                      id="credits"
                      type="number"
                      min="1"
                      max="10"
                      className="form-input"
                      value={formData.credits}
                      onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="courseName">Course Title</label>
                  <input
                    id="courseName"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Introduction to Programming"
                    value={formData.courseName}
                    onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="department">Department</label>
                    <input
                      id="department"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Computer Science"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="semester">Semester</label>
                    <input
                      id="semester"
                      type="number"
                      min="1"
                      max="8"
                      className="form-input"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="facultyId">Assigned Instructor (Optional)</label>
                  <select
                    id="facultyId"
                    className="form-input"
                    value={formData.facultyId}
                    onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                  >
                    <option value="">-- Select Faculty (None) --</option>
                    {facultyList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.fullName} ({f.department} - {f.designation || 'Faculty'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Course Description</label>
                  <textarea
                    id="description"
                    className="form-input"
                    rows="3"
                    placeholder="Brief summary of course topics and learning objectives..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editingCourseId ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
