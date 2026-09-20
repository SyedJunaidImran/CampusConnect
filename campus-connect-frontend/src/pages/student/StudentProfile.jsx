/**
 * StudentProfile — student profile view and editing interface.
 */
import { useState, useEffect } from 'react';
import { getStudentProfile, updateStudentProfile } from '../../api/studentApi';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineAcademicCap,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlinePencilAlt,
  HiOutlineCheckCircle,
  HiOutlineX,
} from 'react-icons/hi';

export default function StudentProfile() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit Mode Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    semester: 1,
  });
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getStudentProfile();
      setProfile(res.data.data);
      setEditForm({
        fullName: res.data.data.fullName || '',
        phone: res.data.data.phone || '',
        semester: res.data.data.semester || 1,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch student profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccessMsg('');

      const payload = {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone?.trim() || '',
        semester: parseInt(editForm.semester, 10),
      };

      const res = await updateStudentProfile(payload);
      setProfile(res.data.data);
      setSuccessMsg('Profile updated successfully!');
      setIsEditing(false);

      // Update AuthContext so top Navbar and Sidebar reflect any name changes
      const currentToken = localStorage.getItem('token');
      login(currentToken, {
        ...user,
        fullName: res.data.data.fullName,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'ST';

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Student Profile</h1>
          <p>View and manage your personal and academic credentials.</p>
        </div>
        {profile && (
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
            <HiOutlinePencilAlt /> Edit Profile
          </button>
        )}
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

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      ) : profile ? (
        <div>
          {/* Main Profile Card */}
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar-large">{initials}</div>
              <div>
                <h2>{profile.fullName}</h2>
                <p style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '4px' }}>
                  <span className="badge badge-primary">{profile.role}</span>
                  <span className="badge badge-secondary">Roll No: {profile.rollNumber}</span>
                </p>
              </div>
            </div>

            <div className="profile-info-grid">
              <div className="info-item">
                <label><HiOutlineMail style={{ verticalAlign: 'middle' }} /> Email Address</label>
                <div className="value">{profile.email}</div>
              </div>

              <div className="info-item">
                <label><HiOutlineAcademicCap style={{ verticalAlign: 'middle' }} /> Department</label>
                <div className="value">{profile.department}</div>
              </div>

              <div className="info-item">
                <label>Current Semester</label>
                <div className="value">Semester {profile.semester}</div>
              </div>

              <div className="info-item">
                <label><HiOutlineCalendar style={{ verticalAlign: 'middle' }} /> Admission Year</label>
                <div className="value">{profile.yearOfAdmission}</div>
              </div>

              <div className="info-item">
                <label><HiOutlinePhone style={{ verticalAlign: 'middle' }} /> Contact Phone</label>
                <div className="value">{profile.phone || 'Not provided'}</div>
              </div>

              <div className="info-item">
                <label>Enrolled Courses</label>
                <div className="value">{profile.enrolledCoursesCount} Subjects</div>
              </div>
            </div>
          </div>

          {/* Academic Summary Section */}
          <div className="dashboard-section">
            <h3>🎓 Academic Details</h3>
            <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
              Registered in <strong>{profile.department}</strong> department, Year of Admission: <strong>{profile.yearOfAdmission}</strong>. Currently enrolled in <strong>{profile.enrolledCoursesCount}</strong> courses.
            </p>
          </div>
        </div>
      ) : null}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button className="modal-close-btn" onClick={() => setIsEditing(false)}>
                <HiOutlineX />
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    className="form-input"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="semester">Current Semester</label>
                  <input
                    id="semester"
                    type="number"
                    min="1"
                    max="8"
                    className="form-input"
                    value={editForm.semester}
                    onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    className="form-input"
                    placeholder="+91 9876543210"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ opacity: 0.7 }}>
                  <label>Department (Read-Only)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profile?.department || ''}
                    disabled
                  />
                </div>

                <div className="form-group" style={{ opacity: 0.7 }}>
                  <label>Roll Number (Read-Only)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profile?.rollNumber || ''}
                    disabled
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
