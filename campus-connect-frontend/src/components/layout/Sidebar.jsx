/**
 * Sidebar — navigation panel with role-based routing for CampusConnect.
 */
import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUnreadMessageCount } from '../../api/messageApi';
import {
  HiOutlineHome,
  HiOutlineBookOpen,
  HiOutlineClipboardList,
  HiOutlineCalendar,
  HiOutlineSpeakerphone,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineLogout,
  HiOutlineUser,
  HiOutlineDocumentText,
  HiOutlineCollection,
  HiOutlineClipboardCheck,
  HiOutlineFolder,
  HiOutlineChatAlt2,
  HiOutlineChartBar,
} from 'react-icons/hi';

const navConfig = {
  STUDENT: [
    { label: 'Dashboard', path: '/student/dashboard', icon: HiOutlineHome },
    { label: 'Course Catalog', path: '/student/courses', icon: HiOutlineBookOpen },
    { label: 'My Enrolled Courses', path: '/student/my-courses', icon: HiOutlineCollection },
    { label: 'Attendance Tracker', path: '/student/attendance', icon: HiOutlineClipboardList },
    { label: 'Class Timetable', path: '/student/timetable', icon: HiOutlineCalendar },
    { label: 'Assignments', path: '/student/assignments', icon: HiOutlineDocumentText },
    { label: 'Study Materials', path: '/student/study-materials', icon: HiOutlineFolder },
    { label: 'Announcements', path: '/student/announcements', icon: HiOutlineSpeakerphone },
    { label: 'Messages', path: '/student/messages', icon: HiOutlineChatAlt2, badgeKey: 'messages' },
    { label: 'Analytics & Reports', path: '/student/analytics', icon: HiOutlineChartBar },
    { label: 'Events', path: '/student/events', icon: HiOutlineCalendar },
    { label: 'My Profile', path: '/student/profile', icon: HiOutlineUser },
  ],
  FACULTY: [
    { label: 'Dashboard', path: '/faculty/dashboard', icon: HiOutlineHome },
    { label: 'My Assigned Courses', path: '/faculty/courses', icon: HiOutlineBookOpen },
    { label: 'Mark Attendance', path: '/faculty/attendance', icon: HiOutlineClipboardCheck },
    { label: 'Teaching Timetable', path: '/faculty/timetable', icon: HiOutlineCalendar },
    { label: 'Assignments', path: '/faculty/assignments', icon: HiOutlineDocumentText },
    { label: 'Submissions', path: '/faculty/submissions', icon: HiOutlineClipboardCheck },
    { label: 'Study Materials', path: '/faculty/study-materials', icon: HiOutlineFolder },
    { label: 'Announcements', path: '/faculty/announcements', icon: HiOutlineSpeakerphone },
    { label: 'Messages', path: '/faculty/messages', icon: HiOutlineChatAlt2, badgeKey: 'messages' },
    { label: 'Analytics & Reports', path: '/faculty/analytics', icon: HiOutlineChartBar },
    { label: 'Events', path: '/faculty/events', icon: HiOutlineCalendar },
  ],
  ADMIN: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: HiOutlineHome },
    { label: 'Manage Courses', path: '/admin/courses', icon: HiOutlineBookOpen },
    { label: 'Student Directory', path: '/admin/students', icon: HiOutlineAcademicCap },
    { label: 'Faculty Directory', path: '/admin/faculty', icon: HiOutlineUserGroup },
    { label: 'Attendance Oversight', path: '/admin/attendance', icon: HiOutlineClipboardCheck },
    { label: 'Timetable Management', path: '/admin/timetable', icon: HiOutlineCalendar },
    { label: 'Assignments', path: '/admin/assignments', icon: HiOutlineDocumentText },
    { label: 'Study Materials', path: '/admin/study-materials', icon: HiOutlineFolder },
    { label: 'Announcements', path: '/admin/announcements', icon: HiOutlineSpeakerphone },
    { label: 'Analytics & Reports', path: '/admin/analytics', icon: HiOutlineChartBar },
    { label: 'Events', path: '/admin/events', icon: HiOutlineCalendar },
  ],
};


export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (user?.role === 'STUDENT' || user?.role === 'FACULTY') {
      const fetchUnread = async () => {
        try {
          const res = await getUnreadMessageCount();
          setUnreadMessages(res.data.data?.unreadCount || 0);
        } catch {
          // ignore silent polling errors
        }
      };
      fetchUnread();
      const interval = setInterval(fetchUnread, 15000); // 15s poll
      return () => clearInterval(interval);
    }
  }, [user?.role]);

  const navItems = navConfig[user?.role] || [];

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <span className="sidebar-logo">🎓</span>
        <span className="sidebar-title">CampusConnect</span>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-subtitle">Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-item-icon">
              <item.icon />
            </span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badgeKey === 'messages' && unreadMessages > 0 && (
              <span
                className="badge badge-danger"
                style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  marginLeft: 'auto',
                }}
              >
                {unreadMessages}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.fullName}</div>
            <div className="sidebar-user-role">{user?.role?.toLowerCase()}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>
          <HiOutlineLogout />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
