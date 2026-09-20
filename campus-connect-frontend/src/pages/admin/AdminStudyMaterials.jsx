/**
 * AdminStudyMaterials — Administrator management console for all college study materials.
 * Full CRUD access: view, upload for any course, edit, delete, preview, and download.
 */
import { useState, useEffect } from 'react';
import {
  getAllStudyMaterials,
  createStudyMaterial,
  updateStudyMaterial,
  deleteStudyMaterial,
  downloadStudyMaterialFile,
  viewStudyMaterialFile,
} from '../../api/studyMaterialApi';
import { getAllCourses } from '../../api/courseApi';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineDownload,
  HiOutlineX,
  HiOutlineUpload,
  HiOutlineCheck,
  HiOutlineExclamation,
  HiOutlineBookOpen,
  HiOutlineFolder,
  HiOutlineDocumentText,
  HiOutlineUserGroup,
} from 'react-icons/hi';

export default function AdminStudyMaterials() {
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Active Download/View State
  const [activeActionId, setActiveActionId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [matRes, courseRes] = await Promise.all([
        getAllStudyMaterials(),
        getAllCourses(),
      ]);
      setMaterials(matRes.data.data || []);
      setCourses(courseRes.data.data || []);
    } catch (err) {
      console.error('Failed to load admin materials data', err);
      setError('Failed to load study materials or courses.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditing(null);
    setFormData({
      courseId: courses.length > 0 ? courses[0].id : '',
      title: '',
      description: '',
    });
    setSelectedFile(null);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (material) => {
    setEditing(material);
    setFormData({
      courseId: material.courseId,
      title: material.title,
      description: material.description || '',
    });
    setSelectedFile(null);
    setFormError('');
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 50 * 1024 * 1024) {
        setFormError('File size exceeds the 50MB limit.');
        setSelectedFile(null);
        return;
      }
      setFormError('');
      setSelectedFile(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Please enter a title for the material.');
      return;
    }
    if (!formData.courseId) {
      setFormError('Please select a course.');
      return;
    }
    if (!editing && !selectedFile) {
      setFormError('Please choose a file to upload.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      const data = new FormData();
      data.append('courseId', formData.courseId);
      data.append('title', formData.title.trim());
      data.append('description', formData.description ? formData.description.trim() : '');
      if (selectedFile) {
        data.append('file', selectedFile);
      }

      if (editing) {
        await updateStudyMaterial(editing.id, data);
        setSuccessMsg('Study material updated successfully!');
      } else {
        await createStudyMaterial(data);
        setSuccessMsg('Study material uploaded successfully!');
      }

      setShowModal(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Save material error', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save study material.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteStudyMaterial(deleteTarget.id);
      setSuccessMsg(`Material "${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Delete error', err);
      setError(err.response?.data?.message || 'Failed to delete study material.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (mat) => {
    try {
      setActiveActionId(mat.id);
      await downloadStudyMaterialFile(mat.id, mat.fileName);
    } catch (err) {
      console.error('Download error', err);
      alert('Failed to download file.');
    } finally {
      setActiveActionId(null);
    }
  };

  const handleView = async (mat) => {
    try {
      setActiveActionId(mat.id);
      await viewStudyMaterialFile(mat.id, mat.fileName);
    } catch (err) {
      console.error('View error', err);
      alert('Failed to open preview.');
    } finally {
      setActiveActionId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFileTypeBadge = (type, name) => {
    const t = (type || '').toLowerCase();
    const n = (name || '').toLowerCase();
    if (t.includes('pdf') || n.endsWith('.pdf')) return <span className="badge badge-danger">PDF</span>;
    if (t.includes('word') || n.endsWith('.doc') || n.endsWith('.docx')) return <span className="badge badge-primary">DOCX</span>;
    if (t.includes('presentation') || t.includes('powerpoint') || n.endsWith('.ppt') || n.endsWith('.pptx')) return <span className="badge badge-warning">PPT</span>;
    if (t.includes('image') || n.endsWith('.png') || n.endsWith('.jpg') || n.endsWith('.jpeg')) return <span className="badge badge-success">IMG</span>;
    return <span className="badge badge-secondary">FILE</span>;
  };

  const totalStorageBytes = materials.reduce((sum, m) => sum + (m.fileSize || 0), 0);
  const coursesWithMaterials = new Set(materials.map((m) => m.courseCode)).size;

  const filtered = materials.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.facultyName && m.facultyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.fileName && m.fileName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCourse = courseFilter === 'all' || m.courseCode === courseFilter;
    return matchesSearch && matchesCourse;
  });

  const courseCodes = [...new Set(courses.map((c) => c.courseCode))].sort();

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>🛡️ Admin Study Materials Console</h2>
          <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            System-wide repository of all course syllabi, lecture notes, slide decks, and digital learning resources.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} title="Upload study material for any course">
          <HiOutlinePlus /> Upload Material
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon primary"><HiOutlineDocumentText /></div>
          <div className="stat-info">
            <h3>{loading ? '...' : materials.length}</h3>
            <p>Total Materials</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><HiOutlineBookOpen /></div>
          <div className="stat-info">
            <h3>{loading ? '...' : coursesWithMaterials}</h3>
            <p>Courses Covered</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon primary"><HiOutlineFolder /></div>
          <div className="stat-info">
            <h3>{loading ? '...' : formatFileSize(totalStorageBytes)}</h3>
            <p>Total File Storage</p>
          </div>
        </div>
      </div>

      {/* Success Alert Banner */}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HiOutlineCheck style={{ fontSize: '1.3rem' }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Alert Banner */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HiOutlineExclamation style={{ fontSize: '1.3rem' }} />
          <span>{error}</span>
        </div>
      )}

      {/* Toolbar & Filters */}
      <div className="toolbar" style={{ marginBottom: '1.5rem' }}>
        <div className="search-filter-group" style={{ maxWidth: '650px' }}>
          <div className="search-input-wrapper">
            <HiOutlineSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by title, subject, instructor, or file..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="select-filter"
            aria-label="Filter by course"
          >
            <option value="all">All Courses ({courses.length})</option>
            {courseCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          Showing <strong>{filtered.length}</strong> of <strong>{materials.length}</strong> materials
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="loading-container" style={{ padding: '3rem', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Loading materials directory...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>No study materials found</h3>
          <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)', maxWidth: '450px', margin: '0.5rem auto 1.5rem auto' }}>
            {searchTerm || courseFilter !== 'all'
              ? 'No study materials match your search filters.'
              : 'No study materials have been added to the system yet.'}
          </p>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <HiOutlinePlus /> Upload First Material
          </button>
        </div>
      ) : (
        <div className="table-responsive" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)' }}>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>COURSE</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>TITLE & DESCRIPTION</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>INSTRUCTOR</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>FILE</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>SIZE</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>DATE</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((mat) => (
                <tr key={mat.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                    <span className="course-code" style={{ fontSize: '0.75rem' }}>{mat.courseCode}</span>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {mat.courseName}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', verticalAlign: 'top', maxWidth: '280px' }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                      {mat.title}
                    </div>
                    {mat.description && (
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                        {mat.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', verticalAlign: 'top', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    {mat.facultyName || 'Admin'}
                  </td>
                  <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getFileTypeBadge(mat.fileType, mat.fileName)}
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', wordBreak: 'break-all' }}>
                        {mat.fileName}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', verticalAlign: 'top', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    {formatFileSize(mat.fileSize)}
                  </td>
                  <td style={{ padding: '1rem', verticalAlign: 'top', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    {formatDate(mat.createdAt)}
                  </td>
                  <td style={{ padding: '1rem', verticalAlign: 'top', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleView(mat)}
                        disabled={activeActionId === mat.id}
                        title="Preview file"
                      >
                        <HiOutlineEye />
                      </button>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleDownload(mat)}
                        disabled={activeActionId === mat.id}
                        title="Download file"
                      >
                        <HiOutlineDownload />
                      </button>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => openEditModal(mat)}
                        title="Edit material"
                      >
                        <HiOutlinePencilAlt />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setDeleteTarget(mat)}
                        title="Delete material"
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

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', maxWidth: '540px', width: '100%', padding: '1.75rem', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                {editing ? '✏️ Edit Study Material' : '📤 Upload Study Material'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <HiOutlineX />
              </button>
            </div>

            {formError && (
              <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: 'var(--font-size-sm)' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSave}>
              {/* Course Selection */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '6px' }}>
                  Course <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <select
                  className="search-input"
                  style={{ width: '100%', paddingLeft: '0.875rem' }}
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  required
                >
                  <option value="" disabled>Select course...</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode} — {c.courseName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '6px' }}>
                  Title <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="search-input"
                  style={{ width: '100%', paddingLeft: '0.875rem' }}
                  placeholder="e.g. CS101 Lecture 1 Notes"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  maxLength={200}
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  className="search-input"
                  style={{ width: '100%', paddingLeft: '0.875rem', minHeight: '80px', resize: 'vertical' }}
                  placeholder="Notes, reading instructions, or topics covered..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* File Upload */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '6px' }}>
                  File {editing ? '(Leave empty to keep current file)' : <span style={{ color: 'var(--color-danger)' }}>*</span>}
                </label>
                <div
                  style={{
                    border: '2px dashed var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--color-surface-hover)',
                    cursor: 'pointer',
                  }}
                  onClick={() => document.getElementById('admin-file-input').click()}
                >
                  <HiOutlineUpload style={{ fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '4px' }} />
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                    {selectedFile ? (
                      <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                        {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </span>
                    ) : editing ? (
                      <span>Current: {editing.fileName} &bull; Click to replace</span>
                    ) : (
                      <span>Click or browse to choose a file</span>
                    )}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Supported: PDF, DOCX, PPTX, TXT, Images, ZIP (Max 50MB)
                  </div>
                  <input
                    id="admin-file-input"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.zip,.xls,.xlsx"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Uploading...' : editing ? 'Save Changes' : 'Upload Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', maxWidth: '440px', width: '100%', padding: '1.75rem', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-danger)' }}>
              ⚠️ Delete Study Material?
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>"{deleteTarget.title}"</strong> ({deleteTarget.fileName})?
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn btn-outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Material'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
