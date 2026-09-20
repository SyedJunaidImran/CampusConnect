import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loginUser } from '../../api/authApi';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineArrowLeft } from 'react-icons/hi';
import AuthLeftPanel from './components/AuthLeftPanel';
import '../../styles/auth.css';

/**
 * LoginPage — Sophisticated Split-Layout Authentication Experience.
 *
 * LEFT:
 * - Subtle CampusConnect branding
 * - Short narrative message
 * - Ambient 3D connection node visual
 *
 * RIGHT:
 * - Clean login form (Institutional Email, Password, Sign In)
 * - Show/hide password toggle
 * - Error message alert
 * - "Don't have an account? Create one"
 *
 * Preserves 100% of existing authentication logic, API calls, and role redirection.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    setLoading(true);

    try {
      const response = await loginUser(formData);
      const { accessToken, role, fullName, email } = response.data.data;

      // Save credentials to AuthContext (and localStorage)
      login(accessToken, { fullName, email, role });

      // Navigate to respective role dashboard
      const dashboardPaths = {
        STUDENT: '/student/dashboard',
        FACULTY: '/faculty/dashboard',
        ADMIN: '/admin/dashboard',
      };
      navigate(dashboardPaths[role] || '/');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.join(', ') ||
        'Invalid email or password. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split">
      {/* LEFT PANEL: Subtle branding + ambient 3D visual */}
      <AuthLeftPanel
        eyebrow="AUTHENTICATION"
        title="Welcome back to your campus."
        description="Sign in to access your course schedules, real-time attendance, and collaborative academic tools."
      />

      {/* RIGHT PANEL: Clean minimal form */}
      <main className="auth-split-right">
        <div className="auth-form-wrap">
          <Link to="/" className="auth-back-link">
            <HiOutlineArrowLeft />
            <span>Back to overview</span>
          </Link>

          <h1 className="auth-form-title">Sign In</h1>
          <p className="auth-form-sub">
            Enter your institutional credentials to continue.
          </p>

          {error && (
            <div className="auth-error-banner" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">
                Institutional Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                className="auth-input"
                placeholder="name@university.edu"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Password */}
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
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
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

            {/* Submit */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In →'}
            </button>
          </form>

          <div className="auth-form-footer">
            Don't have an account? <Link to="/register">Create one</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
