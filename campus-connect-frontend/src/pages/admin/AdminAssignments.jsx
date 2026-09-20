/**
 * AdminAssignments — Admin overview of all assignments across the platform.
 */
import { useState, useEffect } from 'react';
import { getAllAssignments, deleteAssignment, getAssignmentSubmissions } from '../../api/assignmentApi';
import {
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineClock,
  HiOutlineX,
  HiOutlineDocumentText,
  HiOutlineStar,
  HiOutlineCheck,
  HiOutlineClipboardCheck,
  HiOutlineExclamation,
} from 'react-icons/hi';

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  // View submissions modal
  const [viewSubs, setViewSubs] = useState(null);
  const [subsData, setSubsData] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  useEffect(() => { loadAssignments(); }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const res = await getAllAssignments();
      setAssignments(res.data.data || []);
    } catch {
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAssignment(id);
      setDeleteTarget(null);
      setSuccessMsg('Assignment deleted');
      loadAssignments();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const viewSubmissions = async (assignment) => {
    setViewSubs(assignment);
    setLoadingSubs(true);
    try {
      const res = await getAssignmentSubmissions(assignment.id);
      setSubsData(res.data.data || []);
    } catch {
      setSubsData([]);
    } finally {
      setLoadingSubs(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    const map = {
      SUBMITTED: { class: 'badge-primary', label: 'Submitted' },
      LATE: { class: 'badge-warning', label: 'Late' },
      GRADED: { class: 'badge-success', label: 'Graded' },
    };
    const s = map[status] || { class: 'badge-secondary', label: status };
    return <span className={`badge ${s.class}`}>{s.label}</span>;
  };

  const courses = [...new Set(assignments.map(a => a.courseCode))].sort();
  const faculties = [...new Set(assignments.map(a => a.facultyName))].sort();

  const filtered = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.facultyName.toLowerCase().includes(searchTerm.toLowerCase());
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
        <h1>📋 Assignment Management</h1>
        <p>Overview of all assignments across the platform.</p>
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

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon primary"><HiOutlineDocumentText /></div>
          <div className="stat-info">
            <h3>{assignments.length}</h3>
            <p>Total Assignments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><HiOutlineClipboardCheck /></div>
          <div className="stat-info">
            <h3>{assignments.reduce((sum, a) => sum + (a.submissionCount || 0), 0)}</h3>
            <p>Total Submissions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><HiOutlineClock /></div>
          <div className="stat-info">
            <h3>{assignments.filter(a => a.isOverdue).length}</h3>
            <p>Past Due</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger"><HiOutlineExclamation /></div>
          <div className="stat-info">
            <h3>{courses.length}</h3>
            <p>Courses with Assignments</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-filter-group">
          <div className="search-input-wrapper">
            <HiOutlineSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by title or faculty..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="select-filter" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
            <option value="all">All Courses</option>
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <h4>No assignments found</h4>
          <p>No assignments match your search criteria.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Course</th>
                <th>Faculty</th>
                <th>Due Date</th>
                <th>Marks</th>
                <th>Submissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.title}</td>
                  <td><span className="course-code" style={{ fontSize: '0.7rem' }}>{a.courseCode}</span></td>
                  <td style={{ fontSize: 'var(--font-size-sm)' }}>{a.facultyName}</td>
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
                    <button className="btn btn-outline btn-sm" onClick={() => viewSubmissions(a)}>
                      <HiOutlineEye /> {a.submissionCount || 0}
                    </button>
                  </td>
                  <td>
                    <div className="table-actions">
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

      {/* View Submissions Modal */}
      {viewSubs && (
        <div className="modal-overlay" onClick={() => setViewSubs(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>Submissions — {viewSubs.title}</h3>
              <button className="modal-close-btn" onClick={() => setViewSubs(null)}><HiOutlineX /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {loadingSubs ? (
                <div className="loading-container"><div className="spinner"></div><p>Loading...</p></div>
              ) : subsData.length === 0 ? (
                <p className="text-muted">No submissions yet.</p>
              ) : (
                <table className="data-table" style={{ fontSize: 'var(--font-size-sm)' }}>
                  <thead>
                    <tr><th>Student</th><th>Roll No</th><th>Status</th><th>Marks</th></tr>
                  </thead>
                  <tbody>
                    {subsData.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.studentName}</td>
                        <td>{s.rollNumber}</td>
                        <td>{getStatusBadge(s.status)}</td>
                        <td>{s.marks != null ? <strong>{s.marks}/{s.totalMarks}</strong> : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setViewSubs(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>Delete Assignment</h3>
              <button className="modal-close-btn" onClick={() => setDeleteTarget(null)}><HiOutlineX /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--color-text-primary)' }}>
                Delete <strong>"{deleteTarget.title}"</strong> by {deleteTarget.facultyName}? This will also delete all submissions.
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
