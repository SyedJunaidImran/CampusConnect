/**
 * AdminAnnouncements — System-wide announcement broadcast and management console.
 */
import { useState, useEffect } from 'react';
import { getAllCourses } from '../../api/courseApi';
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
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineClock,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';
import '../../styles/dashboard.css';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetAudience: 'GLOBAL',
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
        getAllCourses(),
      ]);
      setAnnouncements(annRes.data.data || []);
      setCourses(courseRes.data.data || []);
    } catch (err) {
      console.error('Failed to load admin announcements', err);
      setError('Could not load announcements and courses.');
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
      targetAudience: 'GLOBAL',
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
    setShowDeleteModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setFormError('Please fill in both title and content.');
      return;
    }
    if (formData.targetAudience === 'COURSE' && !formData.courseId) {
      setFormError('Please select a target course for course-specific announcements.');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);
      await createAnnouncement({
        ...formData,
        courseId: formData.targetAudience === 'COURSE' ? formData.courseId : null,
      });
      setShowCreateModal(false);
      await loadData();
    } catch (err) {
      console.error('Failed to create announcement', err);
      setFormError(err.response?.data?.message || 'Failed to create announcement.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setFormError('Please fill in title and content.');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);
      await updateAnnouncement(selectedAnnouncement.id, {
        ...formData,
        courseId: formData.targetAudience === 'COURSE' ? formData.courseId : null,
      });
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
      alert('Could not toggle publication status.');
    }
  };

  // Metrics
  const totalAnnouncements = announcements.length;
  const publishedCount = announcements.filter(a => a.isPublished).length;
  const globalCount = announcements.filter(a => a.targetAudience === 'GLOBAL').length;
  const courseNoticeCount = announcements.filter(a => a.targetAudience === 'COURSE').length;

  const filteredAnnouncements = announcements.filter(a => {
    const matchesSearch =
      search === '' ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase()) ||
      a.authorName?.toLowerCase().includes(search.toLowerCase()) ||
      a.courseCode?.toLowerCase().includes(search.toLowerCase());

    const matchesAudience =
      audienceFilter === 'ALL' || a.targetAudience === audienceFilter;

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PUBLISHED' && a.isPublished) ||
      (statusFilter === 'DRAFT' && !a.isPublished);

    return matchesSearch && matchesAudience && matchesStatus;
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

  const getAudienceBadge = (target, courseCode) => {
    switch (target) {
      case 'GLOBAL':
        return <span className="badge badge-outline"><HiOutlineGlobeAlt /> All Users</span>;
      case 'STUDENT':
        return <span className="badge badge-outline"><HiOutlineAcademicCap /> Students Only</span>;
      case 'FACULTY':
        return <span className="badge badge-outline"><HiOutlineUserGroup /> Faculty Only</span>;
      case 'ADMIN':
        return <span className="badge badge-outline">🛡️ Admin Only</span>;
      case 'COURSE':
        return <span className="badge badge-success"><HiOutlineBookOpen /> Course: {courseCode}</span>;
      default:
        return <span className="badge badge-outline">{target}</span>;
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
      {/* Welcome Banner */}
      <div className="welcome-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>📢 Announcement & Notification Console</h2>
          <p>Broadcast campus notices, target notifications to specific student batches, faculty groups, or course classes.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <HiOutlinePlus /> Broadcast Announcement
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary"><HiOutlineSpeakerphone /></div>
          <div className="stat-info">
            <h3>{loading ? '...' : totalAnnouncements}</h3>
            <p>Total Announcements</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><HiOutlineCheck /></div>
          <div className="stat-info">
            <h3>{loading ? '...' : publishedCount}</h3>
            <p>Active & Published</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><HiOutlineGlobeAlt /></div>
          <div className="stat-info">
            <h3>{loading ? '...' : globalCount}</h3>
            <p>Campus Broadcasts</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon primary"><HiOutlineBookOpen /></div>
          <div className="stat-info">
            <h3>{loading ? '...' : courseNoticeCount}</h3>
            <p>Course-Specific Notices</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="dashboard-section" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="search-bar" style={{ minWidth: '280px', flex: 1 }}>
            <HiOutlineSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search announcements by title, content, or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '150px' }}
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
            >
              <option value="ALL">All Audiences</option>
              <option value="GLOBAL">Campus-Wide</option>
              <option value="STUDENT">Students Only</option>
              <option value="FACULTY">Faculty Only</option>
              <option value="ADMIN">Admins Only</option>
              <option value="COURSE">Course-Specific</option>
            </select>

            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '140px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Drafts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table View */}
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
          <p>Click "Broadcast Announcement" to create and publish a new campus notice.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Title & Preview</th>
                <th>Audience Scope</th>
                <th>Priority</th>
                <th>Author</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnnouncements.map((announcement) => (
                <tr key={announcement.id}>
                  <td style={{ maxWidth: '280px' }}>
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
                  <td>{getAudienceBadge(announcement.targetAudience, announcement.courseCode)}</td>
                  <td>{getPriorityBadge(announcement.priority)}</td>
                  <td style={{ fontSize: 'var(--font-size-xs)' }}>
                    <div><strong>{announcement.authorName}</strong></div>
                    <div className="text-muted">{announcement.authorRole}</div>
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${announcement.isPublished ? 'btn-success' : 'btn-outline'}`}
                      style={{ fontSize: 'var(--font-size-xs)', padding: '0.2rem 0.5rem' }}
                      onClick={() => handleTogglePublish(announcement)}
                      title="Toggle publication status"
                    >
                      {announcement.isPublished ? '✅ Published' : 'Draft'}
                    </button>
                  </td>
                  <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    {formatDate(announcement.publishedAt || announcement.createdAt)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => openEditModal(announcement)}
                        title="Edit announcement"
                      >
                        <HiOutlinePencil />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => openDeleteModal(announcement)}
                        title="Delete announcement"
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

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => !formSubmitting && setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>Broadcast New Announcement</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)} disabled={formSubmitting}>
                <HiOutlineX />
              </button>
            </div>

            {formError && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{formError}</div>}

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label">Notice Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Spring Term Registration Guidelines"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  maxLength={200}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Target Audience *</label>
                  <select
                    className="form-control"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  >
                    <option value="GLOBAL">Campus-Wide (All Users)</option>
                    <option value="STUDENT">Students Only</option>
                    <option value="FACULTY">Faculty Members Only</option>
                    <option value="ADMIN">Administrators Only</option>
                    <option value="COURSE">Specific Academic Course</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority Level</label>
                  <select
                    className="form-control"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="GENERAL">General Information</option>
                    <option value="IMPORTANT">Important Notice</option>
                    <option value="URGENT">Urgent Alert</option>
                  </select>
                </div>
              </div>

              {formData.targetAudience === 'COURSE' && (
                <div className="form-group">
                  <label className="form-label">Target Course *</label>
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
              )}

              <div className="form-group">
                <label className="form-label">Announcement Content / Notice Details *</label>
                <textarea
                  className="form-control"
                  rows={6}
                  placeholder="Write the full announcement text here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="adminPublishImmediately"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                />
                <label htmlFor="adminPublishImmediately" style={{ margin: 0, fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
                  Publish immediately (notifies target users)
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)} disabled={formSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? 'Publishing...' : 'Broadcast Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Announcement Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => !formSubmitting && setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>Edit Announcement</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)} disabled={formSubmitting}>
                <HiOutlineX />
              </button>
            </div>

            {formError && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{formError}</div>}

            <form onSubmit={handleEditSubmit}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Target Audience *</label>
                  <select
                    className="form-control"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  >
                    <option value="GLOBAL">Campus-Wide (All Users)</option>
                    <option value="STUDENT">Students Only</option>
                    <option value="FACULTY">Faculty Members Only</option>
                    <option value="ADMIN">Administrators Only</option>
                    <option value="COURSE">Specific Academic Course</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority Level</label>
                  <select
                    className="form-control"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="GENERAL">General Information</option>
                    <option value="IMPORTANT">Important Notice</option>
                    <option value="URGENT">Urgent Alert</option>
                  </select>
                </div>
              </div>

              {formData.targetAudience === 'COURSE' && (
                <div className="form-group">
                  <label className="form-label">Target Course *</label>
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
              )}

              <div className="form-group">
                <label className="form-label">Announcement Content *</label>
                <textarea
                  className="form-control"
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="adminEditPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                />
                <label htmlFor="adminEditPublished" style={{ margin: 0, fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
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
              <h3>Delete Announcement</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)} disabled={formSubmitting}>
                <HiOutlineX />
              </button>
            </div>
            <p style={{ margin: '1rem 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              Are you sure you want to delete "<strong>{selectedAnnouncement?.title}</strong>"? This action is permanent and removes the notice from all user feeds.
            </p>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowDeleteModal(false)} disabled={formSubmitting}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteSubmit} disabled={formSubmitting}>
                {formSubmitting ? 'Deleting...' : 'Delete Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
