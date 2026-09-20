/**
 * StudentAssignments — displays assignments for enrolled courses with submission capability.
 */
import { useState, useEffect } from 'react';
import { getAllAssignments } from '../../api/assignmentApi';
import { submitAssignment, getMySubmissionForAssignment } from '../../api/submissionApi';
import {
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineCheck,
  HiOutlineExclamation,
  HiOutlineSearch,
  HiOutlinePaperAirplane,
  HiOutlinePencil,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineStar,
} from 'react-icons/hi';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionMsg, setSubmissionMsg] = useState('');
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [loadingSubmission, setLoadingSubmission] = useState(false);

  useEffect(() => { loadAssignments(); }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const res = await getAllAssignments();
      setAssignments(res.data.data || []);
    } catch (err) {
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (assignment) => {
    if (expandedId === assignment.id) {
      setExpandedId(null);
      setExistingSubmission(null);
      setSubmissionText('');
      setSubmissionMsg('');
      return;
    }
    setExpandedId(assignment.id);
    setSubmissionMsg('');
    setSubmissionText('');
    setExistingSubmission(null);

    if (assignment.submissionStatus !== 'NOT_SUBMITTED') {
      setLoadingSubmission(true);
      try {
        const res = await getMySubmissionForAssignment(assignment.id);
        setExistingSubmission(res.data.data);
        setSubmissionText(res.data.data?.submissionText || '');
      } catch {
        // No submission found, that's fine
      } finally {
        setLoadingSubmission(false);
      }
    }
  };

  const handleSubmit = async (assignmentId) => {
    if (!submissionText.trim()) return;
    try {
      setSubmitting(true);
      setSubmissionMsg('');
      await submitAssignment(assignmentId, { submissionText: submissionText.trim() });
      setSubmissionMsg('✅ Submitted successfully!');
      setExpandedId(null);
      setSubmissionText('');
      setExistingSubmission(null);
      loadAssignments();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit assignment';
      setSubmissionMsg(`❌ ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const courses = [...new Set(assignments.map(a => a.courseCode))].sort();

  const filtered = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.courseName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = courseFilter === 'all' || a.courseCode === courseFilter;
    const matchesStatus = statusFilter === 'all' || a.submissionStatus === statusFilter;
    return matchesSearch && matchesCourse && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const map = {
      NOT_SUBMITTED: { class: 'badge-secondary', label: 'Not Submitted' },
      SUBMITTED: { class: 'badge-primary', label: 'Submitted' },
      LATE: { class: 'badge-warning', label: 'Late' },
      GRADED: { class: 'badge-success', label: 'Graded' },
    };
    const s = map[status] || map.NOT_SUBMITTED;
    return <span className={`badge ${s.class}`}>{s.label}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

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
        <h1>📝 My Assignments</h1>
        <p>View assignments for your enrolled courses, submit work, and track grades.</p>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: 'var(--font-size-sm)' }}>
          {error}
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
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="select-filter" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
            <option value="all">All Courses</option>
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="select-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="NOT_SUBMITTED">Not Submitted</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="LATE">Late</option>
            <option value="GRADED">Graded</option>
          </select>
        </div>
      </div>

      {/* Assignment List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h4>No assignments found</h4>
          <p>{searchTerm || courseFilter !== 'all' || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'No assignments have been posted for your courses yet.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(assignment => (
            <div key={assignment.id} className="assignment-card">
              {/* Card Header */}
              <div
                className="assignment-card-header"
                onClick={() => toggleExpand(assignment)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <span className="course-code" style={{ fontSize: '0.7rem' }}>{assignment.courseCode}</span>
                    {getStatusBadge(assignment.submissionStatus)}
                    {assignment.isOverdue && assignment.submissionStatus === 'NOT_SUBMITTED' && (
                      <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        <HiOutlineExclamation /> Overdue
                      </span>
                    )}
                  </div>
                  <h4 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: '0.25rem' }}>{assignment.title}</h4>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    <span>📅 Due: {formatDate(assignment.dueDate)}</span>
                    <span>📊 Marks: {assignment.obtainedMarks != null ? `${assignment.obtainedMarks}/` : ''}{assignment.totalMarks}</span>
                    <span>👤 {assignment.facultyName}</span>
                  </div>
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>
                  {expandedId === assignment.id ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                </div>
              </div>

              {/* Expanded Detail */}
              {expandedId === assignment.id && (
                <div className="assignment-card-body">
                  {/* Description */}
                  {assignment.description && (
                    <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                      <div style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>Description</div>
                      <p style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.6, color: 'var(--color-text-primary)' }}>{assignment.description}</p>
                    </div>
                  )}

                  {/* Graded Feedback */}
                  {existingSubmission?.status === 'GRADED' && (
                    <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: 'var(--radius-md)', border: '1px solid #a7f3d0', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <HiOutlineStar style={{ color: '#059669', fontSize: '1.1rem' }} />
                        <strong style={{ color: '#065f46' }}>Grade: {existingSubmission.marks}/{existingSubmission.totalMarks}</strong>
                      </div>
                      {existingSubmission.feedback && (
                        <p style={{ fontSize: 'var(--font-size-sm)', color: '#047857' }}>
                          <strong>Feedback:</strong> {existingSubmission.feedback}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Existing Submission (non-graded) */}
                  {loadingSubmission ? (
                    <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>Loading submission...</p>
                  ) : existingSubmission && existingSubmission.status !== 'GRADED' ? (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Your Submission (submitted {formatDate(existingSubmission.submittedAt)})
                      </div>
                      <textarea
                        className="assignment-textarea"
                        value={submissionText}
                        onChange={e => setSubmissionText(e.target.value)}
                        rows="5"
                        placeholder="Edit your submission..."
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSubmit(assignment.id)}
                          disabled={submitting || !submissionText.trim()}
                        >
                          <HiOutlinePencil /> {submitting ? 'Updating...' : 'Update Submission'}
                        </button>
                      </div>
                    </div>
                  ) : !existingSubmission && assignment.submissionStatus === 'NOT_SUBMITTED' ? (
                    <div>
                      <div style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Submit Your Work
                      </div>
                      <textarea
                        className="assignment-textarea"
                        value={submissionText}
                        onChange={e => setSubmissionText(e.target.value)}
                        rows="5"
                        placeholder="Type your submission here..."
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSubmit(assignment.id)}
                          disabled={submitting || !submissionText.trim()}
                        >
                          <HiOutlinePaperAirplane /> {submitting ? 'Submitting...' : 'Submit'}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {submissionMsg && (
                    <p style={{ fontSize: 'var(--font-size-sm)', marginTop: '0.5rem' }}>{submissionMsg}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
