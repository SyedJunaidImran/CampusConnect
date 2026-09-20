/**
 * DashboardLayout — the shell that wraps all authenticated pages.
 *
 * STRUCTURE:
 * ┌──────────────────────────────────┐
 * │ SIDEBAR │ NAVBAR                 │
 * │         │────────────────────────│
 * │         │                        │
 * │         │ PAGE CONTENT           │
 * │         │ (rendered via Outlet)  │
 * │         │                        │
 * └──────────────────────────────────┘
 *
 * <Outlet /> is a React Router concept — it renders the child route's component.
 * For example, if the URL is /student/dashboard, <Outlet /> renders <StudentDashboard />.
 * This means the sidebar and navbar stay constant while the content changes.
 */
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function DashboardLayout() {
  // Controls sidebar visibility on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="dashboard-main">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="dashboard-content">
          {/* Child route components render here */}
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay — clicking it closes the sidebar */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99,
            display: 'none',
          }}
        />
      )}
    </div>
  );
}
