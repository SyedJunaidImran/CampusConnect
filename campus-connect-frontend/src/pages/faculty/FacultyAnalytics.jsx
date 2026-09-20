/**
 * FacultyAnalytics — Course-level and cohort performance analytics for instructors.
 */
import { useState, useEffect } from 'react';
import { getFacultyAnalytics, getFacultyCourseAnalytics } from '../../api/analyticsApi';
import BarChart from '../../components/charts/BarChart';
import DonutChart from '../../components/charts/DonutChart';
import ProgressGauge from '../../components/charts/ProgressGauge';
import {
  HiOutlineBookOpen,
  HiOutlineUserGroup,
  HiOutlineClipboardCheck,
  HiOutlineDocumentText,
  HiOutlineExclamation,
  HiOutlinePrinter,
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineFilter,
} from 'react-icons/hi';
import '../../styles/analytics.css';

export default function FacultyAnalytics() {
  const [facultyData, setFacultyData] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseDetail, setCourseDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFacultyOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getFacultyAnalytics();
      const data = res.data.data;
      setFacultyData(data);

      // Default to first course if available and none selected
      if (data.courses && data.courses.length > 0) {
        const initialCourseId = data.courses[0].courseId;
        setSelectedCourseId(initialCourseId);
        loadCourseDetail(initialCourseId);
      }
    } catch (err) {
      console.error('Failed to load faculty analytics', err);
      setError(err.response?.data?.message || 'Failed to load faculty analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadCourseDetail = async (courseId) => {
    if (!courseId) {
      setCourseDetail(null);
      return;
    }
    try {
      setDetailLoading(true);
      const res = await getFacultyCourseAnalytics(courseId);
      setCourseDetail(res.data.data);
    } catch (err) {
      console.error('Failed to load course details', err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyOverview();
  }, []);

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setSelectedCourseId(courseId);
    if (courseId) {
      loadCourseDetail(courseId);
    } else {
      setCourseDetail(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportAttendanceCSV = () => {
    if (!courseDetail || !courseDetail.studentAttendanceReport) return;

    const headers = ['Roll Number', 'Student Name', 'Department', 'Classes Held', 'Attended', 'Missed', 'Attendance %', 'Status'];
    const rows = courseDetail.studentAttendanceReport.map((s) => [
      `"${s.rollNumber}"`,
      `"${s.studentName}"`,
      `"${s.department}"`,
      s.totalClasses,
      s.attendedClasses,
      s.missedClasses,
      `${s.attendancePercentage}%`,
      s.isBelowThreshold ? 'SHORTAGE WARNING (<75%)' : 'Good Standing',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${courseDetail.courseCode}_attendance_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="analytics-loading" style={{ textAlign: 'center', padding: '60px 0' }}>
        <div className="spinner" />
        <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>Loading teaching analytics & reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error" style={{ padding: '40px', textAlign: 'center' }}>
        <div className="alert alert-danger" style={{ maxWidth: '600px', margin: '0 auto' }}>
          {error}
        </div>
        <button onClick={fetchFacultyOverview} className="btn btn-primary" style={{ marginTop: '16px' }}>
          Retry
        </button>
      </div>
    );
  }

  // Course enrollment comparison data
  const courseEnrollmentData = (facultyData?.courses || []).map((c) => ({
    label: c.courseCode,
    value: c.enrolledCount,
    unit: 'students',
  }));

  const selectedCourseAttendanceData = courseDetail
    ? [
        { label: 'Present Marks', value: courseDetail.totalPresentMarks || 0, color: 'var(--color-success)' },
        { label: 'Absent Marks', value: courseDetail.totalAbsentMarks || 0, color: 'var(--color-danger)' },
      ]
    : [];

  const courseAssignmentStats = courseDetail?.assignmentStats || {};
  const selectedCourseSubmissionData = [
    { label: 'Graded', value: courseAssignmentStats.gradedCount || 0, color: '#10b981' },
    { label: 'Pending Review', value: courseAssignmentStats.pendingGradingCount || 0, color: '#3b82f6' },
    { label: 'Late', value: courseAssignmentStats.lateCount || 0, color: '#f59e0b' },
  ];

  return (
    <div className="analytics-page">
      {/* Printable Report Header */}
      <div className="print-header">
        <h1>CAMPUSCONNECT FACULTY COURSE REPORT</h1>
        <p>
          Instructor: {facultyData.facultyName} ({facultyData.employeeId}) • Department of {facultyData.department}
          {courseDetail ? ` • Course: [${courseDetail.courseCode}] ${courseDetail.courseTitle}` : ''}
          • Generated on {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Header & Actions */}
      <div className="analytics-header">
        <div className="analytics-title">
          <h1>
            <HiOutlineBookOpen /> Teaching Analytics & Course Performance
          </h1>
          <p>Instructor cohort attendance, submission rates, and at-risk student monitoring</p>
        </div>

        <div className="analytics-actions">
          <button className="btn-report" onClick={fetchFacultyOverview} title="Refresh Metrics">
            <HiOutlineRefresh /> Refresh
          </button>
          {courseDetail && (
            <button className="btn-report" onClick={handleExportAttendanceCSV}>
              <HiOutlineDownload /> Export Course CSV
            </button>
          )}
          <button className="btn-report primary" onClick={handlePrint}>
            <HiOutlinePrinter /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* Global Faculty KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon primary"><HiOutlineBookOpen /></div>
          <div className="kpi-content">
            <span className="kpi-value">{facultyData.assignedCoursesCount}</span>
            <span className="kpi-label">Assigned Courses</span>
            <span className="kpi-subtitle">Active this term</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon purple"><HiOutlineUserGroup /></div>
          <div className="kpi-content">
            <span className="kpi-value">{facultyData.totalEnrolledStudents}</span>
            <span className="kpi-label">Total Students</span>
            <span className="kpi-subtitle">Distinct enrolled</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon success"><HiOutlineClipboardCheck /></div>
          <div className="kpi-content">
            <span className="kpi-value">{facultyData.overallAttendancePercentage}%</span>
            <span className="kpi-label">Overall Attendance</span>
            <span className="kpi-subtitle">Cohort average</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon danger"><HiOutlineExclamation /></div>
          <div className="kpi-content">
            <span className="kpi-value">{facultyData.totalStudentsBelowThreshold}</span>
            <span className="kpi-label">At-Risk Shortage</span>
            <span className="kpi-subtitle">&lt; 75% attendance</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon warning"><HiOutlineDocumentText /></div>
          <div className="kpi-content">
            <span className="kpi-value">{facultyData.pendingGradingCount}</span>
            <span className="kpi-label">Pending Grading</span>
            <span className="kpi-subtitle">From {facultyData.totalSubmissionsReceived} received</span>
          </div>
        </div>
      </div>

      {/* Course Filter Bar */}
      <div className="analytics-filter-bar">
        <div className="filter-group">
          <HiOutlineFilter style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }} />
          <label className="filter-label" htmlFor="facultyCourseSelect">Select Assigned Course:</label>
          <select
            id="facultyCourseSelect"
            className="filter-select"
            value={selectedCourseId}
            onChange={handleCourseChange}
          >
            {facultyData.courses && facultyData.courses.length > 0 ? (
              facultyData.courses.map((c) => (
                <option key={c.courseId} value={c.courseId}>
                  [{c.courseCode}] {c.courseName} ({c.enrolledCount} enrolled)
                </option>
              ))
            ) : (
              <option value="">No courses assigned</option>
            )}
          </select>
        </div>

        {courseDetail && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="badge badge-primary">{courseDetail.enrolledStudentsCount} Students</span>
            <span className="badge badge-info">{courseDetail.totalClassesHeld} Classes Held</span>
            <span className={`badge ${courseDetail.averageAttendancePercentage < 75 ? 'badge-danger' : 'badge-success'}`}>
              {courseDetail.averageAttendancePercentage}% Avg Attendance
            </span>
          </div>
        )}
      </div>

      {/* Selected Course Visualizations */}
      {detailLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div className="spinner" />
          <p style={{ marginTop: '8px', color: 'var(--color-text-secondary)' }}>Loading course performance data...</p>
        </div>
      ) : courseDetail ? (
        <>
          {/* At-Risk Warning Banner if shortage students exist */}
          {courseDetail.studentsBelowThreshold && courseDetail.studentsBelowThreshold.length > 0 && (
            <div className="at-risk-banner">
              <HiOutlineExclamation className="at-risk-icon" />
              <div className="at-risk-info">
                <h4>Attendance Shortage Notice: {courseDetail.studentsBelowThreshold.length} Students Below 75%</h4>
                <p>
                  These students have attendance strictly below the university standard 75% threshold in{' '}
                  <strong>{courseDetail.courseCode}</strong>. Review the list below for academic intervention.
                </p>
              </div>
            </div>
          )}

          <div className="charts-grid">
            <ProgressGauge
              value={courseDetail.averageAttendancePercentage}
              threshold={75}
              label={`${courseDetail.courseCode} Attendance`}
              subLabel={`${courseDetail.totalPresentMarks} present / ${courseDetail.totalAttendanceMarks} total records`}
            />

            <DonutChart
              title="Attendance Breakdown (Present vs Absent)"
              data={selectedCourseAttendanceData}
              size={210}
              emptyMessage="No attendance marked for this course yet."
            />

            <DonutChart
              title="Assignment Grading Status"
              data={selectedCourseSubmissionData}
              size={210}
              emptyMessage="No assignments submitted yet."
            />

            <BarChart
              title="Assigned Courses Enrollment Comparison"
              data={courseEnrollmentData}
              height={260}
              emptyMessage="No courses assigned."
            />
          </div>

          {/* At-Risk Students Table */}
          {courseDetail.studentsBelowThreshold && courseDetail.studentsBelowThreshold.length > 0 && (
            <div className="analytics-section">
              <div className="section-header">
                <h2 className="section-title" style={{ color: 'var(--color-danger)' }}>
                  <HiOutlineExclamation /> Students Requiring Attendance Intervention (&lt; 75%)
                </h2>
                <span className="badge badge-danger">
                  {courseDetail.studentsBelowThreshold.length} Students At Risk
                </span>
              </div>

              <div className="table-responsive">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Roll Number</th>
                      <th>Student Name</th>
                      <th>Department</th>
                      <th>Classes Held</th>
                      <th>Attended</th>
                      <th>Missed</th>
                      <th>Attendance %</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseDetail.studentsBelowThreshold.map((s) => (
                      <tr key={s.studentId}>
                        <td><strong>{s.rollNumber}</strong></td>
                        <td>{s.studentName}</td>
                        <td>{s.department}</td>
                        <td>{s.totalClasses}</td>
                        <td>{s.attendedClasses}</td>
                        <td><span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{s.missedClasses}</span></td>
                        <td>
                          <span className="badge badge-danger" style={{ fontWeight: 700 }}>
                            {s.attendancePercentage}%
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-warning">Shortage Warning</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Complete Course Attendance Report Table (Printable) */}
          <div className="analytics-section">
            <div className="section-header">
              <h2 className="section-title">
                <HiOutlineClipboardCheck /> Complete Course Attendance Register & Status
              </h2>
              <span className="badge badge-info">{courseDetail.studentAttendanceReport?.length || 0} Total Enrolled</span>
            </div>

            <div className="table-responsive">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Student Name</th>
                    <th>Department</th>
                    <th>Held</th>
                    <th>Attended</th>
                    <th>Missed</th>
                    <th>Attendance Rate</th>
                    <th>Eligibility Status</th>
                  </tr>
                </thead>
                <tbody>
                  {courseDetail.studentAttendanceReport && courseDetail.studentAttendanceReport.length > 0 ? (
                    courseDetail.studentAttendanceReport.map((s) => (
                      <tr key={s.studentId}>
                        <td><strong>{s.rollNumber}</strong></td>
                        <td>{s.studentName}</td>
                        <td>{s.department}</td>
                        <td>{s.totalClasses}</td>
                        <td>{s.attendedClasses}</td>
                        <td>{s.missedClasses}</td>
                        <td>
                          <span className={`badge ${s.isBelowThreshold ? 'badge-danger' : 'badge-success'}`}>
                            {s.attendancePercentage}%
                          </span>
                        </td>
                        <td>
                          {s.isBelowThreshold ? (
                            <span className="badge badge-danger">Shortage (&lt;75%)</span>
                          ) : (
                            <span className="badge badge-success">Eligible (≥75%)</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)' }}>
                        No enrolled students found for this course.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="chart-empty">Please select a course above to view analytics.</div>
      )}
    </div>
  );
}
