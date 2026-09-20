/**
 * AdminAnalytics — System-wide academic and institutional intelligence dashboard.
 */
import { useState, useEffect } from 'react';
import { getAdminAnalytics } from '../../api/analyticsApi';
import BarChart from '../../components/charts/BarChart';
import DonutChart from '../../components/charts/DonutChart';
import ProgressGauge from '../../components/charts/ProgressGauge';
import {
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineBookOpen,
  HiOutlineClipboardCheck,
  HiOutlineDocumentText,
  HiOutlineFolder,
  HiOutlineSpeakerphone,
  HiOutlinePrinter,
  HiOutlineDownload,
  HiOutlineRefresh,
} from 'react-icons/hi';
import '../../styles/analytics.css';

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminAnalytics();
      setAnalytics(res.data.data);
    } catch (err) {
      console.error('Failed to load admin analytics', err);
      setError(err.response?.data?.message || 'Failed to load system analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!analytics || !analytics.courseEnrollments) return;

    const headers = ['Course Code', 'Course Title', 'Department', 'Semester', 'Enrolled Students', 'Faculty', 'Attendance %', 'Assignments'];
    const rows = analytics.courseEnrollments.map((c) => [
      `"${c.courseCode}"`,
      `"${c.courseName}"`,
      `"${c.department}"`,
      c.semester,
      c.enrolledCount,
      `"${c.facultyName}"`,
      `${c.attendancePercentage}%`,
      c.assignmentCount,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `campusconnect_course_enrollments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="analytics-loading" style={{ textAlign: 'center', padding: '60px 0' }}>
        <div className="spinner" />
        <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>Loading system analytics & reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error" style={{ padding: '40px', textAlign: 'center' }}>
        <div className="alert alert-danger" style={{ maxWidth: '600px', margin: '0 auto' }}>
          {error}
        </div>
        <button onClick={fetchAnalytics} className="btn btn-primary" style={{ marginTop: '16px' }}>
          Retry
        </button>
      </div>
    );
  }

  // Chart datasets
  const courseEnrollmentData = (analytics.courseEnrollments || []).map((c) => ({
    label: c.courseCode,
    value: c.enrolledCount,
    unit: 'students',
  }));

  const attendanceChartData = [
    { label: 'Present', value: analytics.totalPresentRecords || 0, color: 'var(--color-success)' },
    { label: 'Absent', value: analytics.totalAbsentRecords || 0, color: 'var(--color-danger)' },
  ];

  const assignmentStats = analytics.assignmentStats || {};
  const submissionChartData = [
    { label: 'Graded', value: assignmentStats.gradedCount || 0, color: '#10b981' },
    { label: 'Pending Review', value: assignmentStats.submittedCount || 0, color: '#3b82f6' },
    { label: 'Late', value: assignmentStats.lateCount || 0, color: '#f59e0b' },
  ];

  const departmentChartData = (analytics.departmentStats || []).map((d) => ({
    label: d.department,
    value: d.studentCount,
    unit: 'students',
  }));

  return (
    <div className="analytics-page">
      {/* Printable Report Header */}
      <div className="print-header">
        <h1>CAMPUSCONNECT ACADEMIC & INSTITUTIONAL REPORT</h1>
        <p>Overall Institutional Analytics • Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* Screen Page Header & Actions */}
      <div className="analytics-header">
        <div className="analytics-title">
          <h1>
            <HiOutlineAcademicCap /> Institutional Analytics & Reports
          </h1>
          <p>Real-time cross-department academic intelligence and system metrics</p>
        </div>

        <div className="analytics-actions">
          <button className="btn-report" onClick={fetchAnalytics} title="Refresh Metrics">
            <HiOutlineRefresh /> Refresh
          </button>
          <button className="btn-report" onClick={handleExportCSV}>
            <HiOutlineDownload /> Export CSV
          </button>
          <button className="btn-report primary" onClick={handlePrint}>
            <HiOutlinePrinter /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon primary"><HiOutlineAcademicCap /></div>
          <div className="kpi-content">
            <span className="kpi-value">{analytics.totalStudents}</span>
            <span className="kpi-label">Total Students</span>
            <span className="kpi-subtitle">Across all programs</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon purple"><HiOutlineUserGroup /></div>
          <div className="kpi-content">
            <span className="kpi-value">{analytics.totalFaculty}</span>
            <span className="kpi-label">Total Faculty</span>
            <span className="kpi-subtitle">Teaching personnel</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon success"><HiOutlineBookOpen /></div>
          <div className="kpi-content">
            <span className="kpi-value">{analytics.totalCourses}</span>
            <span className="kpi-label">Total Courses</span>
            <span className="kpi-subtitle">{analytics.totalEnrollments} enrollments</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon warning"><HiOutlineClipboardCheck /></div>
          <div className="kpi-content">
            <span className="kpi-value">{analytics.overallAttendancePercentage}%</span>
            <span className="kpi-label">Avg Attendance</span>
            <span className="kpi-subtitle">{analytics.totalAttendanceRecords} classes marked</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon primary"><HiOutlineDocumentText /></div>
          <div className="kpi-content">
            <span className="kpi-value">{analytics.totalAssignments}</span>
            <span className="kpi-label">Assignments</span>
            <span className="kpi-subtitle">{assignmentStats.totalSubmissions || 0} submissions</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon success"><HiOutlineFolder /></div>
          <div className="kpi-content">
            <span className="kpi-value">{analytics.totalStudyMaterials}</span>
            <span className="kpi-label">Study Materials</span>
            <span className="kpi-subtitle">Active course notes</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon danger"><HiOutlineSpeakerphone /></div>
          <div className="kpi-content">
            <span className="kpi-value">{analytics.totalAnnouncements}</span>
            <span className="kpi-label">Announcements</span>
            <span className="kpi-subtitle">Campus circulars</span>
          </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="charts-grid">
        <BarChart
          title="Students Enrolled per Course"
          data={courseEnrollmentData}
          height={260}
          emptyMessage="No course enrollments found."
        />

        <DonutChart
          title="Attendance Distribution (Present vs Absent)"
          data={attendanceChartData}
          size={210}
          emptyMessage="No attendance records recorded yet."
        />

        <DonutChart
          title="Assignment Submissions & Grading Status"
          data={submissionChartData}
          size={210}
          emptyMessage="No submissions recorded yet."
        />

        <BarChart
          title="Students by Department"
          data={departmentChartData}
          height={260}
          emptyMessage="No departments found."
        />
      </div>

      {/* Detailed Course Enrollment & Performance Table */}
      <div className="analytics-section">
        <div className="section-header">
          <h2 className="section-title">
            <HiOutlineBookOpen /> Course Enrollment & Academic Performance Summary
          </h2>
          <span className="badge badge-info">{analytics.courseEnrollments?.length || 0} Courses Active</span>
        </div>

        <div className="table-responsive">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Course Name</th>
                <th>Department</th>
                <th>Semester</th>
                <th>Instructor</th>
                <th>Enrolled</th>
                <th>Attendance</th>
                <th>Assignments</th>
              </tr>
            </thead>
            <tbody>
              {analytics.courseEnrollments && analytics.courseEnrollments.length > 0 ? (
                analytics.courseEnrollments.map((c) => (
                  <tr key={c.courseId}>
                    <td><strong>{c.courseCode}</strong></td>
                    <td>{c.courseName}</td>
                    <td>{c.department}</td>
                    <td>Semester {c.semester}</td>
                    <td>{c.facultyName}</td>
                    <td>
                      <span className="badge badge-primary">{c.enrolledCount} Students</span>
                    </td>
                    <td>
                      <span className={`badge ${c.attendancePercentage < 75 ? 'badge-danger' : 'badge-success'}`}>
                        {c.attendancePercentage}%
                      </span>
                    </td>
                    <td>{c.assignmentCount} created</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)' }}>
                    No courses available in catalog.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent System Activity */}
      <div className="analytics-section">
        <div className="section-header">
          <h2 className="section-title">
            <HiOutlineClipboardCheck /> Recent Institutional Activity
          </h2>
        </div>

        {analytics.recentActivities && analytics.recentActivities.length > 0 ? (
          <div className="activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {analytics.recentActivities.map((act, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: 'var(--color-background)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div>
                  <span
                    className={`badge ${act.type === 'ANNOUNCEMENT' ? 'badge-danger' : 'badge-primary'}`}
                    style={{ marginRight: '10px' }}
                  >
                    {act.type}
                  </span>
                  <strong>{act.title}</strong>
                  <span style={{ marginLeft: '12px', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    {act.description}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  {act.timestamp ? new Date(act.timestamp).toLocaleDateString() : ''}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '20px 0' }}>
            No recent activity logged.
          </p>
        )}
      </div>
    </div>
  );
}
