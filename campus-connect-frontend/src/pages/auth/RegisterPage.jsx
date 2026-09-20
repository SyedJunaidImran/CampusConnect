import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { registerStudent } from '../../api/authApi';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineArrowLeft } from 'react-icons/hi';
import AuthLeftPanel from './components/AuthLeftPanel';
import '../../styles/auth.css';

/**
 * RegisterPage — Sophisticated Split-Layout Student Enrollment.
 *
 * Uses the exact same visual system as Login:
 * - LEFT: Subtle CampusConnect branding, enrollment message, and ambient 3D visual
 * - RIGHT: Clean, spacious form with compact 2-column rows for academic fields
 *
 * Preserves 100% of the existing registration API, integer conversions,
 * validation, auto-login, and navigation logic.
 */
export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    rollNumber: '',
    department: '',
    semester: '',
    yearOfAdmission: '',
    phone: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Field validations
    if (!formData.fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Institutional email is required.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!formData.rollNumber.trim()) {
      setError('Roll number / Student ID is required.');
      return;
    }
    if (!formData.department.trim()) {
      setError('Department is required.');
      return;
    }
    const sem = parseInt(formData.semester, 10);
    if (!sem || sem < 1 || sem > 8) {
      setError('Please enter a valid semester (1 to 8).');
      return;
    }
    const yr = parseInt(formData.yearOfAdmission, 10);
    if (!yr || yr < 2000 || yr > 2030) {
      setError('Please enter a valid admission year (e.g. 2024).');
      return;
    }

    setLoading(true);

    try {
      // Backend expects semester and yearOfAdmission as integers
      const payload = {
        ...formData,
        semester: sem,
        yearOfAdmission: yr,
      };

      const response = await registerStudent(payload);
      const { accessToken, role, fullName, email } = response.data.data;

      // Auto-login upon successful registration
      login(accessToken, { fullName, email, role });
      navigate('/student/dashboard');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.join(', ') ||
        'Registration failed. Please review your details and try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split">
      {/* LEFT PANEL: Matching visual system */}
      <AuthLeftPanel
        eyebrow="STUDENT ONBOARDING"
        title="Begin your connected academic journey."
        description="Join your university network to synchronize your lectures, verify attendance, and manage assignments in real time."
      />

      {/* RIGHT PANEL: Clean form with compact 2-column groupings */}
      <main className="auth-split-right">
        <div className="auth-form-wrap auth-form-wrap--wide">
          <Link to="/" className="auth-back-link">
            <HiOutlineArrowLeft />
            <span>Back to overview</span>
          </Link>

          <h1 className="auth-form-title">Create Account</h1>
          <p className="auth-form-sub">
            Enroll as a student on the CampusConnect academic network.
          </p>

          {error && (
            <div className="auth-error-banner" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="fullName">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                className="auth-input"
                placeholder="e.g. Alex Morgan"
                value={formData.fullName}
                onChange={handleChange}
                required
                autoComplete="name"
                autoFocus
              />
            </div>

            {/* Email & Password */}
            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label" htmlFor="email">
                  Institutional Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="auth-input"
                  placeholder="alex@university.edu"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="password">
                  Password
                </label>
                <div className="auth-input-wrap">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="auth-input"
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                  </button>
                </div>
              </div>
            </div>

            {/* Student ID & Department */}
            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label" htmlFor="rollNumber">
                  Student ID / Roll No.
                </label>
                <input
                  id="rollNumber"
                  type="text"
                  name="rollNumber"
                  className="auth-input"
                  placeholder="e.g. CS2024089"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="department">
                  Department
                </label>
                <input
                  id="department"
                  type="text"
                  name="department"
                  className="auth-input"
                  placeholder="e.g. Computer Science"
                  value={formData.department}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Semester & Admission Year */}
            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label" htmlFor="semester">
                  Current Semester (1–8)
                </label>
                <input
                  id="semester"
                  type="number"
                  min="1"
                  max="8"
                  name="semester"
                  className="auth-input"
                  placeholder="e.g. 4"
                  value={formData.semester}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="yearOfAdmission">
                  Admission Year
                </label>
                <input
                  id="yearOfAdmission"
                  type="number"
                  min="2000"
                  max="2030"
                  name="yearOfAdmission"
                  className="auth-input"
                  placeholder="e.g. 2024"
                  value={formData.yearOfAdmission}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Phone (Optional) */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="phone">
                Contact Phone <span style={{ opacity: 0.45 }}>(Optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                className="auth-input"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account →'}
            </button>
          </form>

          <div className="auth-form-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
