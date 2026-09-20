/**
 * StudentStudyMaterials — displays course study materials, lecture notes,
 * and slides available for student's enrolled courses with download & view features.
 */
import { useState, useEffect } from 'react';
import { getAllStudyMaterials, downloadStudyMaterialFile, viewStudyMaterialFile } from '../../api/studyMaterialApi';
import {
  HiOutlineSearch,
  HiOutlineDownload,
  HiOutlineEye,
  HiOutlineBookOpen,
  HiOutlineDocumentText,
  HiOutlineFolder,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineExclamation,
  HiOutlinePhotograph,
  HiOutlinePresentationChartBar,
} from 'react-icons/hi';

export default function StudentStudyMaterials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeActionId, setActiveActionId] = useState(null);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getAllStudyMaterials();
      setMaterials(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch study materials', err);
      setError('Unable to load study materials. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (material) => {
    try {
      setActiveActionId(material.id);
      await downloadStudyMaterialFile(material.id, material.fileName);
    } catch (err) {
      console.error('Download error', err);
      alert('Failed to download file. Please try again.');
    } finally {
      setActiveActionId(null);
    }
  };

  const handleView = async (material) => {
    try {
      setActiveActionId(material.id);
      await viewStudyMaterialFile(material.id, material.fileName);
    } catch (err) {
      console.error('Preview error', err);
      alert('Failed to open preview. Please download the file instead.');
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

  const getFileCategory = (type, name) => {
    const t = (type || '').toLowerCase();
    const n = (name || '').toLowerCase();
    if (t.includes('pdf') || n.endsWith('.pdf')) return 'PDF';
    if (t.includes('word') || n.endsWith('.doc') || n.endsWith('.docx')) return 'Document';
    if (t.includes('powerpoint') || t.includes('presentation') || n.endsWith('.ppt') || n.endsWith('.pptx')) return 'Presentation';
    if (t.includes('image') || n.endsWith('.png') || n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'Image';
    return 'File';
  };

  const getFileTypeBadge = (type, name) => {
    const cat = getFileCategory(type, name);
    switch (cat) {
      case 'PDF':
        return <span className="badge badge-danger">PDF</span>;
      case 'Document':
        return <span className="badge badge-primary">DOCX</span>;
      case 'Presentation':
        return <span className="badge badge-warning">PPT</span>;
      case 'Image':
        return <span className="badge badge-success">IMG</span>;
      default:
        return <span className="badge badge-secondary">FILE</span>;
    }
  };

  const courses = [...new Set(materials.map((m) => m.courseCode))].filter(Boolean).sort();

  const filtered = materials.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.fileName && m.fileName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCourse = courseFilter === 'all' || m.courseCode === courseFilter;
    const matchesType = typeFilter === 'all' || getFileCategory(m.fileType, m.fileName) === typeFilter;

    return matchesSearch && matchesCourse && matchesType;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2>📚 Study Materials & Lecture Notes</h2>
          <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            Access and download slides, readings, reference materials, and problem sets for your enrolled courses.
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HiOutlineExclamation style={{ fontSize: '1.3rem' }} />
          <span>{error}</span>
        </div>
      )}

      {/* Toolbar & Filters */}
      <div className="toolbar" style={{ marginBottom: '1.5rem' }}>
        <div className="search-filter-group" style={{ maxWidth: '750px' }}>
          <div className="search-input-wrapper">
            <HiOutlineSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by title, subject, keyword, or filename..."
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
            <option value="all">All Enrolled Courses</option>
            {courses.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="select-filter"
            aria-label="Filter by file type"
          >
            <option value="all">All File Types</option>
            <option value="PDF">PDF Documents</option>
            <option value="Document">Word Documents</option>
            <option value="Presentation">Slide Decks</option>
            <option value="Image">Images</option>
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
          <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Loading your study materials...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>No study materials found</h3>
          <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)', maxWidth: '450px', margin: '0.5rem auto 1.5rem auto' }}>
            {searchTerm || courseFilter !== 'all' || typeFilter !== 'all'
              ? 'No study materials match your search filters. Try clearing the filters.'
              : 'Your professors have not uploaded any study materials for your enrolled courses yet.'}
          </p>
          {(searchTerm || courseFilter !== 'all' || typeFilter !== 'all') && (
            <button
              className="btn btn-outline"
              onClick={() => {
                setSearchTerm('');
                setCourseFilter('all');
                setTypeFilter('all');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((mat) => {
            const category = getFileCategory(mat.fileType, mat.fileName);
            return (
              <div
                key={mat.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  padding: '1.25rem',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
                }}
              >
                <div>
                  {/* Top Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className="course-code" style={{ fontSize: '0.75rem' }}>
                        {mat.courseCode}
                      </span>
                      {getFileTypeBadge(mat.fileType, mat.fileName)}
                    </div>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      {formatFileSize(mat.fileSize)}
                    </span>
                  </div>

                  {/* Course Name */}
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    {mat.courseName}
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                    {mat.title}
                  </h3>

                  {/* Description */}
                  {mat.description && (
                    <p
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.5,
                        marginBottom: '1rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {mat.description}
                    </p>
                  )}
                </div>

                <div>
                  {/* Info Row */}
                  <div
                    style={{
                      borderTop: '1px solid var(--color-border)',
                      paddingTop: '0.75rem',
                      marginTop: '0.75rem',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <HiOutlineUser style={{ fontSize: '0.9rem' }} />
                      <span>{mat.facultyName || 'Instructor'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <HiOutlineCalendar style={{ fontSize: '0.9rem' }} />
                      <span>{formatDate(mat.createdAt)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-outline"
                      style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: 'var(--font-size-xs)' }}
                      onClick={() => handleView(mat)}
                      disabled={activeActionId === mat.id}
                      title="Open and preview file in browser"
                    >
                      <HiOutlineEye /> View
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: 'var(--font-size-xs)' }}
                      onClick={() => handleDownload(mat)}
                      disabled={activeActionId === mat.id}
                      title="Download file to device"
                    >
                      <HiOutlineDownload /> Download
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
