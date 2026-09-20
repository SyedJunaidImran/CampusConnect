/**
 * ProtectedRoute — route guard for authenticated and role-based access.
 *
 * HOW ROUTE PROTECTION WORKS:
 * 1. Checks if the user is authenticated (via useAuth hook)
 *    - While auth status is loading (initial check): shows a loading spinner
 *    - If NOT authenticated: redirects to /login
 * 2. Checks if the user's role is in the allowedRoles array (if specified)
 *    - If role matches: renders the protected child component (via Outlet or children)
 *    - If role does NOT match: redirects to their own appropriate dashboard
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  // 1. While AuthContext is checking localStorage / /api/auth/me, display loading spinner
  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p>Verifying session...</p>
      </div>
    );
  }

  // 2. If not logged in, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. If specific roles are required, verify the user has one of those roles
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to user's authorized dashboard
    const roleDashboardMap = {
      STUDENT: '/student/dashboard',
      FACULTY: '/faculty/dashboard',
      ADMIN: '/admin/dashboard',
    };
    const targetDashboard = roleDashboardMap[user?.role] || '/login';
    return <Navigate to={targetDashboard} replace />;
  }

  // 4. Authorized — render the route children
  return <Outlet />;
}
