/**
 * FacultyAnnouncements — Course notice authoring, broadcast management, and faculty feed.
 */
import { useState, useEffect } from 'react';
import { getMyFacultyCourses } from '../../api/courseApi';
import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  togglePublishAnnouncement,
} from '../../api/announcementApi';
import {
  HiOutlineSpeakerphone,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineBookOpen,
  HiOutlineGlobeAlt,
  HiOutlineClock,
  HiOutlineCheck,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';
import '../../styles/dashboard.css';

export default function FacultyAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetAudience: 'COURSE',
    priority: 'GENERAL',
    courseId: '',
    isPublished: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [annRes, courseRes] = await Promise.all([
        getAllAnnouncements(),
        getMyFacultyCourses(),
      ]);
      setAnnouncements(annRes.data.data || []);
      setCourses(courseRes.data.data || []);
    } catch (err) {
      console.error('Failed to load faculty announcements', err);
      setError('Could not load announcements or assigned courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setFormData({
      title: '',
      content: '',
      targetAudience: 'COURSE',
      priority: 'GENERAL',
      courseId: courses.length > 0 ? courses[0].id : '',
      isPublished: true,
    });
    setFormError(null);
    setShowCreateModal(true);
  };

  const openEditModal = (announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      targetAudience: announcement.targetAudience,
      priority: announcement.priority,
      courseId: announcement.courseId || (courses.length > 0 ? courses[0].id : ''),
      isPublished: announcement.isPublished,
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const openDeleteModal = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDeleteModal(false);
    setTimeout(() => setShowDeleteModal(true), 10);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.courseId) {
      setFormError('Please fill in title, content, and select an assigned course.');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);
      await createAnnouncement(formData);
      setShowCreateModal(false);
      await loadData();
    } catch (err) {
      console.error('Failed to create announcement', err);
      setFormError(err.response?.data?.message || 'Failed to create announcement. Ensure you are assigned to this course.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.courseId) {
      setFormError('Please fill in title, content, and course.');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);
      await updateAnnouncement(selectedAnnouncement.id, formData);
      setShowEditModal(false);
      await loadData();
    } catch (err) {
      console.error('Failed to update announcement', err);
      setFormError(err.response?.data?.message || 'Failed to update announcement.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    try {
      setFormSubmitting(true);
      await deleteAnnouncement(selectedAnnouncement.id);
      setShowDeleteModal(false);
      await loadData();
    } catch (err) {
      console.error('Failed to delete announcement', err);
      alert(err.response?.data?.message || 'Failed to delete announcement.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleTogglePublish = async (announcement) => {
    try {
      await togglePublishAnnouncement(announcement.id, !announcement.isPublished);
      setAnnouncements(prev =>
        prev.map(a =>
          a.id === announcement.id ? { ...a, isPublished: !announcement.isPublished } : a
        )
      );
    } catch (err) {
      console.error('Failed to toggle publication', err);
      alert('Could not change publication status.');
    }
  };

  const filteredAnnouncements = announcements.filter(a => {
    const matchesSearch =
      search === '' ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase()) ||
      a.authorName?.toLowerCase().includes(search.toLowerCase()) ||
      a.courseCode?.toLowerCase().includes(search.toLowerCase());

    const matchesCourse =
      selectedCourseFilter === 'ALL' ||
      (a.courseId && a.courseId.toString() === selectedCourseFilter);

    return matchesSearch && matchesCourse;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="badge badge-danger">🚨 Urgent</span>;
      case 'IMPORTANT':
        return <span className="badge badge-warning">⚠️ Important</span>;
      default:
        return <span className="badge badge-primary">📌 General</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="welcome-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>📢 Faculty Notice Management</h2>
          <p>Publish course-specific notices, reminders, and alerts for students enrolled in your assigned classes.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} disabled={courses.length === 0}>
          <HiOutlinePlus /> Create Course Announcement
        </button>
      </div>

      {courses.length === 0 && !loading && (
        <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
          ⚠️ You currently do not have any assigned courses. Once courses are assigned to your profile by the administrator, you can publish course-specific announcements.
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="dashboard-section" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="search-bar" style={{ minWidth: '280px', flex: 1 }}>
            <HiOutlineSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search notices by title, content, or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Course:
            </label>
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '180px' }}
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
            >
              <option value="ALL">All Classes & General</option>
              {courses.map(c => (
                <option key={c.id} value={c.id.toString()}>
                  {c.courseCode} - {c.courseName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Announcements Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading announcements...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📢</div>
          <h4>No announcements found</h4>
          <p>Click "Create Course Announcement" above to post an update for your enrolled students.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Title & Content</th>
                <th>Target / Course</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnnouncements.map((announcement) => {
                const isAuthor = announcement.authorRole === 'FACULTY';
                return (
                  <tr key={announcement.id}>
                    <td style={{ maxWidth: '300px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {announcement.title}
                      </div>
                      <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-secondary)',
                        marginTop: '4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {announcement.content}
                      </div>
                    </td>
                    <td>
                      {announcement.targetAudience === 'COURSE' ? (
                        <span className="badge badge-success">
                          <HiOutlineBookOpen /> {announcement.courseCode}
                        </span>
                      ) : (
                        <span className="badge badge-outline">
                          <HiOutlineGlobeAlt /> {announcement.targetAudience}
                        </span>
                      )}
                    </td>
                    <td>{getPriorityBadge(announcement.priority)}</td>
                    <td>
                      {isAuthor ? (
                        <button
                          className={`btn btn-sm ${announcement.isPublished ? 'btn-success' : 'btn-outline'}`}
                          style={{ fontSize: 'var(--font-size-xs)', padding: '0.2rem 0.5rem' }}
                          onClick={() => handleTogglePublish(announcement)}
                          title="Click to toggle publish status"
                        >
                          {announcement.isPublished ? '✅ Published' : 'Draft'}
                        </button>
                      ) : (
                        <span className="badge badge-primary">Published</span>
                      )}
                    </td>
                    <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      {formatDate(announcement.publishedAt || announcement.createdAt)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        {isAuthor && (
                          <>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => openEditModal(announcement)}
                              title="Edit notice"
                            >
                              <HiOutlinePencil />
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => openDeleteModal(announcement)}
                              title="Delete notice"
                            >
                              <HiOutlineTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => !formSubmitting && setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Create Course Announcement</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)} disabled={formSubmitting}>
                <HiOutlineX />
              </button>
            </div>

            {formError && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{formError}</div>}

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label">Target Assigned Course *</label>
                <select
                  className="form-control"
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  required
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode} - {c.courseName} (Sem {c.semester})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notice Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Lab Session 4 Guidelines & Submission Details"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  maxLength={200}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Priority Level</label>
                <select
                  className="form-control"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="GENERAL">General Notice</option>
                  <option value="IMPORTANT">Important Notice</option>
                  <option value="URGENT">Urgent Alert</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notice Content / Instructions *</label>
                <textarea
                  className="form-control"
                  rows={5}
                  placeholder="Write the detailed announcement message here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="publishImmediately"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                />
                <label htmlFor="publishImmediately" style={{ margin: 0, fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
                  Publish immediately to enrolled students
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)} disabled={formSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Announcement Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => !formSubmitting && setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Edit Course Announcement</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)} disabled={formSubmitting}>
                <HiOutlineX />
              </button>
            </div>

            {formError && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{formError}</div>}

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Target Assigned Course *</label>
                <select
                  className="form-control"
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  required
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode} - {c.courseName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notice Title *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  maxLength={200}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Priority Level</label>
                <select
                  className="form-control"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="GENERAL">General Notice</option>
                  <option value="IMPORTANT">Important Notice</option>
                  <option value="URGENT">Urgent Alert</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notice Content *</label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="editPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                />
                <label htmlFor="editPublished" style={{ margin: 0, fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
                  Active & Published
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)} disabled={formSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => !formSubmitting && setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Delete Notice</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)} disabled={formSubmitting}>
                <HiOutlineX />
              </button>
            </div>
            <p style={{ margin: '1rem 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              Are you sure you want to permanently delete "<strong>{selectedAnnouncement?.title}</strong>"? Students will no longer see this notification.
            </p>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowDeleteModal(false)} disabled={formSubmitting}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteSubmit} disabled={formSubmitting}>
                {formSubmitting ? 'Deleting...' : 'Delete Notice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
