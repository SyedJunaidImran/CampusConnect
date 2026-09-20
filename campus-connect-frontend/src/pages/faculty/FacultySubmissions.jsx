/**
 * FacultySubmissions — View and grade student submissions for assignments.
 */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllAssignments, getAssignmentSubmissions, getAssignmentStatistics } from '../../api/assignmentApi';
import { gradeSubmission } from '../../api/submissionApi';
import {
  HiOutlineSearch,
  HiOutlineStar,
  HiOutlineX,
  HiOutlineClipboardCheck,
  HiOutlineCheck,
  HiOutlineClock,
  HiOutlineExclamation,
} from 'react-icons/hi';

export default function FacultySubmissions() {
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('assignmentId');

  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(preselectedId || '');
  const [submissions, setSubmissions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Grading modal
  const [gradingTarget, setGradingTarget] = useState(null);
  const [gradeForm, setGradeForm] = useState({ marks: '', feedback: '' });
  const [gradeError, setGradeError] = useState('');
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignmentId) {
      loadSubmissions(selectedAssignmentId);
    } else {
      setSubmissions([]);
      setStatistics(null);
    }
  }, [selectedAssignmentId]);

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

  const loadSubmissions = async (assignmentId) => {
    try {
      setLoadingSubs(true);
      const [subsRes, statsRes] = await Promise.all([
        getAssignmentSubmissions(assignmentId),
        getAssignmentStatistics(assignmentId),
      ]);
      setSubmissions(subsRes.data.data || []);
      setStatistics(statsRes.data.data);
    } catch (err) {
      setError('Failed to load submissions');
    } finally {
      setLoadingSubs(false);
    }
  };

  const openGradeModal = (sub) => {
    setGradingTarget(sub);
    setGradeForm({ marks: sub.marks ?? '', feedback: sub.feedback ?? '' });
    setGradeError('');
  };

  const handleGrade = async () => {
    if (gradeForm.marks === '' || gradeForm.marks === null) {
      setGradeError('Marks are required');
      return;
    }
    const marks = Number(gradeForm.marks);
    if (marks < 0 || marks > gradingTarget.totalMarks) {
      setGradeError(`Marks must be between 0 and ${gradingTarget.totalMarks}`);
      return;
    }
    try {
      setGrading(true);
      setGradeError('');
      await gradeSubmission(gradingTarget.id, {
        marks,
        feedback: gradeForm.feedback.trim(),
      });
      setGradingTarget(null);
      setSuccessMsg('Submission graded successfully');
      loadSubmissions(selectedAssignmentId);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setGradeError(err.response?.data?.message || 'Failed to grade submission');
    } finally {
      setGrading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    const map = {
      SUBMITTED: { class: 'badge-primary', label: 'Submitted', icon: <HiOutlineClipboardCheck /> },
      LATE: { class: 'badge-warning', label: 'Late', icon: <HiOutlineClock /> },
      GRADED: { class: 'badge-success', label: 'Graded', icon: <HiOutlineCheck /> },
    };
    const s = map[status] || { class: 'badge-secondary', label: status, icon: <HiOutlineExclamation /> };
    return (
      <span className={`badge ${s.class}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
        {s.icon} {s.label}
      </span>
    );
  };

  const filteredSubs = submissions.filter(s => {
    const matchesSearch = s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const selectedAssignment = assignments.find(a => String(a.id) === String(selectedAssignmentId));

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>📋 Student Submissions</h1>
        <p>Review and grade student submissions for your assignments.</p>
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

      {/* Assignment Selector */}
      <div className="toolbar">
        <div className="search-filter-group">
          <select
            className="select-filter"
            style={{ flex: 1, maxWidth: '500px' }}
            value={selectedAssignmentId}
            onChange={e => setSelectedAssignmentId(e.target.value)}
          >
            <option value="">— Select an assignment —</option>
            {assignments.map(a => (
              <option key={a.id} value={a.id}>{a.courseCode} — {a.title}</option>
            ))}
          </select>
          {selectedAssignmentId && (
            <div className="search-input-wrapper">
              <HiOutlineSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search by student name or roll number..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Statistics Bar */}
      {statistics && (
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-icon primary"><HiOutlineClipboardCheck /></div>
            <div className="stat-info">
              <h3>{statistics.totalEnrolledStudents || 0}</h3>
              <p>Enrolled Students</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success"><HiOutlineCheck /></div>
            <div className="stat-info">
              <h3>{(statistics.submitted || 0) + (statistics.late || 0) + (statistics.graded || 0)}</h3>
              <p>Total Submitted</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning"><HiOutlineClock /></div>
            <div className="stat-info">
              <h3>{statistics.notSubmitted || 0}</h3>
              <p>Not Submitted</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon danger"><HiOutlineStar /></div>
            <div className="stat-info">
              <h3>{statistics.graded || 0}</h3>
              <p>Graded</p>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Table */}
      {!selectedAssignmentId ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h4>Select an Assignment</h4>
          <p>Choose an assignment from the dropdown above to view student submissions.</p>
        </div>
      ) : loadingSubs ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading submissions...</p>
        </div>
      ) : filteredSubs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h4>No submissions yet</h4>
          <p>No students have submitted this assignment yet.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll Number</th>
                <th>Status</th>
                <th>Submitted At</th>
                <th>Marks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubs.map(sub => (
                <tr key={sub.id}>
                  <td style={{ fontWeight: 600 }}>{sub.studentName}</td>
                  <td><span className="badge badge-secondary">{sub.rollNumber}</span></td>
                  <td>{getStatusBadge(sub.status)}</td>
                  <td style={{ fontSize: 'var(--font-size-sm)' }}>{formatDate(sub.submittedAt)}</td>
                  <td>
                    {sub.marks != null ? (
                      <strong style={{ color: 'var(--color-success)' }}>{sub.marks}/{sub.totalMarks}</strong>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => openGradeModal(sub)}>
                      <HiOutlineStar /> {sub.status === 'GRADED' ? 'Re-Grade' : 'Grade'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grade Modal */}
      {gradingTarget && (
        <div className="modal-overlay" onClick={() => setGradingTarget(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Grade Submission</h3>
              <button className="modal-close-btn" onClick={() => setGradingTarget(null)}><HiOutlineX /></button>
            </div>
            <div className="modal-body">
              {/* Student Info */}
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 600 }}>{gradingTarget.studentName}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{gradingTarget.rollNumber}</div>
              </div>

              {/* Submission Text */}
              <div className="form-group">
                <label className="form-label">Submission</label>
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', maxHeight: '150px', overflowY: 'auto', lineHeight: 1.6 }}>
                  {gradingTarget.submissionText}
                </div>
              </div>

              {gradeError && (
                <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: 'var(--font-size-sm)' }}>
                  {gradeError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Marks * (out of {gradingTarget.totalMarks})</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  max={gradingTarget.totalMarks}
                  value={gradeForm.marks}
                  onChange={e => setGradeForm({ ...gradeForm, marks: e.target.value })}
                  placeholder={`0 - ${gradingTarget.totalMarks}`}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Feedback</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={gradeForm.feedback}
                  onChange={e => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                  placeholder="Optional feedback for the student..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setGradingTarget(null)}>Cancel</button>
              <button className="btn btn-success" onClick={handleGrade} disabled={grading}>
                <HiOutlineStar /> {grading ? 'Grading...' : 'Submit Grade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
