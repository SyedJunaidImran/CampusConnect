/**
 * Navbar — top bar of the dashboard.
 * Shows the current page title, a greeting with the user's name,
 * and a hamburger menu button on mobile.
 */
import { useAuth } from '../../context/AuthContext';
import { HiOutlineMenu } from 'react-icons/hi';

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();

  // Get a time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        {/* Mobile hamburger menu button */}
        <button className="mobile-menu-btn" onClick={onMenuClick}>
          <HiOutlineMenu />
        </button>
        <div className="navbar-page-title">
          {/* This could be dynamic based on the current route */}
        </div>
      </div>

      <div className="navbar-right">
        <span className="navbar-greeting">
          {getGreeting()}, <strong>{user?.fullName?.split(' ')[0]}</strong>
        </span>
      </div>
    </header>
  );
}
