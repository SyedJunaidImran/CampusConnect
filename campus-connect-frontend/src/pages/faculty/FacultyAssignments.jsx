/**
 * FacultyAssignments — Faculty assignment management page.
 * Create, edit, delete assignments for assigned courses.
 */
import { useState, useEffect } from 'react';
import { getAllAssignments, createAssignment, updateAssignment, deleteAssignment } from '../../api/assignmentApi';
import { getMyFacultyCourses } from '../../api/courseApi';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineClock,
  HiOutlineX,
} from 'react-icons/hi';
import { Link } from 'react-router-dom';

export default function FacultyAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    courseId: '', title: '', description: '', dueDate: '', totalMarks: '',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignRes, courseRes] = await Promise.all([
        getAllAssignments(),
        getMyFacultyCourses(),
      ]);
      setAssignments(assignRes.data.data || []);
      setCourses(courseRes.data.data || []);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditing(null);
    setFormData({
      courseId: courses.length > 0 ? courses[0].id : '',
      title: '', description: '',
      dueDate: '', totalMarks: '100',
    });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (a) => {
    setEditing(a);
    // Format date for datetime-local input
    const due = a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 16) : '';
    setFormData({
      courseId: a.courseId,
      title: a.title,
      description: a.description || '',
      dueDate: due,
      totalMarks: a.totalMarks,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.courseId || !formData.dueDate || !formData.totalMarks) {
      setFormError('Please fill in all required fields');
      return;
    }
    try {
      setSaving(true);
      setFormError('');
      const payload = {
        courseId: Number(formData.courseId),
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDate: formData.dueDate + ':00',
        totalMarks: Number(formData.totalMarks),
      };
      if (editing) {
        await updateAssignment(editing.id, payload);
        setSuccessMsg('Assignment updated successfully');
      } else {
        await createAssignment(payload);
        setSuccessMsg('Assignment created successfully');
      }
      setShowModal(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAssignment(id);
      setDeleteTarget(null);
      setSuccessMsg('Assignment deleted');
      loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete assignment');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filtered = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = courseFilter === 'all' || a.courseCode === courseFilter;
    return matchesSearch && matchesCourse;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading assignments...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>📄 My Assignments</h1>
        <p>Create and manage assignments for your courses.</p>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: 'var(--font-size-sm)' }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-success-light)', color: '#065f46', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: 'var(--font-size-sm)' }}>
          {successMsg}
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-filter-group">
          <div className="search-input-wrapper">
            <HiOutlineSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by title..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="select-filter" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
            <option value="all">All Courses</option>
            {[...new Set(assignments.map(a => a.courseCode))].sort().map(c =>
              <option key={c} value={c}>{c}</option>
            )}
          </select>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <HiOutlinePlus /> Create Assignment
        </button>
      </div>

      {/* Assignment Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <h4>No assignments yet</h4>
          <p>Create your first assignment to get started.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Course</th>
                <th>Due Date</th>
                <th>Marks</th>
                <th>Submissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{a.title}</div>
                    {a.description && (
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '2px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.description}
                      </div>
                    )}
                  </td>
                  <td><span className="course-code" style={{ fontSize: '0.7rem' }}>{a.courseCode}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <HiOutlineClock style={{ color: a.isOverdue ? 'var(--color-danger)' : 'var(--color-text-muted)' }} />
                      <span style={{ color: a.isOverdue ? 'var(--color-danger)' : 'inherit', fontSize: 'var(--font-size-sm)' }}>
                        {formatDate(a.dueDate)}
                      </span>
                    </div>
                  </td>
                  <td>{a.totalMarks}</td>
                  <td>
                    <Link
                      to={`/faculty/submissions?assignmentId=${a.id}`}
                      className="btn btn-outline btn-sm"
                    >
                      <HiOutlineEye /> {a.submissionCount || 0}
                    </Link>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => openEditModal(a)} title="Edit">
                        <HiOutlinePencilAlt />
                      </button>
                      <button className="btn btn-outline-danger btn-sm" onClick={() => setDeleteTarget(a)} title="Delete">
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Assignment' : 'Create Assignment'}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}><HiOutlineX /></button>
            </div>
            <div className="modal-body">
              {formError && (
                <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: 'var(--font-size-sm)' }}>
                  {formError}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Course *</label>
                <select className="form-input" value={formData.courseId} onChange={e => setFormData({ ...formData, courseId: e.target.value })}>
                  <option value="">Select a course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.courseCode} — {c.courseName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" type="text" placeholder="Assignment title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows="3" placeholder="Assignment description..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Due Date *</label>
                  <input className="form-input" type="datetime-local" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Marks *</label>
                  <input className="form-input" type="number" min="1" max="1000" value={formData.totalMarks} onChange={e => setFormData({ ...formData, totalMarks: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>Delete Assignment</h3>
              <button className="modal-close-btn" onClick={() => setDeleteTarget(null)}><HiOutlineX /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--color-text-primary)' }}>
                Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>? This will also delete all student submissions.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteTarget.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
