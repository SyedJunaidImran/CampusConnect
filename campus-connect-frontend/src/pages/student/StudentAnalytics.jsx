/**
 * StudentAnalytics — Personal academic analytics, attendance tracking, and assignment monitoring.
 */
import { useState, useEffect } from 'react';
import { getStudentAnalytics } from '../../api/analyticsApi';
import BarChart from '../../components/charts/BarChart';
import DonutChart from '../../components/charts/DonutChart';
import ProgressGauge from '../../components/charts/ProgressGauge';
import {
  HiOutlineAcademicCap,
  HiOutlineClipboardCheck,
  HiOutlineDocumentText,
  HiOutlineExclamation,
  HiOutlineFolder,
  HiOutlineSpeakerphone,
  HiOutlinePrinter,
  HiOutlineRefresh,
} from 'react-icons/hi';
import '../../styles/analytics.css';

export default function StudentAnalytics() {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudentAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getStudentAnalytics();
      setStudentData(res.data.data);
    } catch (err) {
      console.error('Failed to load student analytics', err);
      setError(err.response?.data?.message || 'Failed to load personal academic analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentAnalytics();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="analytics-loading" style={{ textAlign: 'center', padding: '60px 0' }}>
        <div className="spinner" />
        <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>Loading your academic performance analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error" style={{ padding: '40px', textAlign: 'center' }}>
        <div className="alert alert-danger" style={{ maxWidth: '600px', margin: '0 auto' }}>
          {error}
        </div>
        <button onClick={fetchStudentAnalytics} className="btn btn-primary" style={{ marginTop: '16px' }}>
          Retry
        </button>
      </div>
    );
  }

  // Course attendance comparison data for BarChart
  const courseAttendanceData = (studentData.courseAttendance || []).map((c) => ({
    label: c.courseCode,
    value: c.attendancePercentage,
    unit: '%',
    color: c.isBelowThreshold ? 'var(--color-danger)' : 'var(--color-primary)',
  }));

  // Assignment status breakdown
  const assignmentStatusData = [
    { label: 'Graded', value: studentData.gradedAssignmentsCount || 0, color: '#10b981' },
    { label: 'Submitted (Pending Review)', value: (studentData.submittedAssignmentsCount || 0) - (studentData.gradedAssignmentsCount || 0) - (studentData.lateAssignmentsCount || 0), color: '#3b82f6' },
    { label: 'Late', value: studentData.lateAssignmentsCount || 0, color: '#f59e0b' },
    { label: 'Unsubmitted', value: studentData.pendingAssignmentsCount || 0, color: 'var(--color-danger)' },
  ].filter((item) => item.value > 0);

  return (
    <div className="analytics-page">
      {/* Printable Report Header */}
      <div className="print-header">
        <h1>CAMPUSCONNECT STUDENT ACADEMIC TRANSCRIPT & ATTENDANCE REPORT</h1>
        <p>
          Student: {studentData.studentName} ({studentData.rollNumber}) • {studentData.department} • Semester {studentData.semester}
          • Generated on {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Screen Page Header & Actions */}
      <div className="analytics-header">
        <div className="analytics-title">
          <h1>
            <HiOutlineAcademicCap /> My Academic Analytics & Performance
          </h1>
          <p>
            {studentData.studentName} ({studentData.rollNumber}) • {studentData.department} • Semester {studentData.semester}
          </p>
        </div>

        <div className="analytics-actions">
          <button className="btn-report" onClick={fetchStudentAnalytics} title="Refresh Metrics">
            <HiOutlineRefresh /> Refresh
          </button>
          <button className="btn-report primary" onClick={handlePrint}>
            <HiOutlinePrinter /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* Attendance Shortage Warning Banner */}
      {studentData.hasAttendanceShortage && (
        <div className="at-risk-banner">
          <HiOutlineExclamation className="at-risk-icon" />
          <div className="at-risk-info">
            <h4>Attendance Shortage Alert: {studentData.shortageCoursesCount} Course(s) Below 75%</h4>
            <p>
              Your attendance in one or more enrolled courses is below the mandatory <strong>75% threshold</strong>.
              Attend upcoming classes to maintain exam eligibility.
            </p>
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon primary"><HiOutlineAcademicCap /></div>
          <div className="kpi-content">
            <span className="kpi-value">{studentData.enrolledCoursesCount}</span>
            <span className="kpi-label">Enrolled Courses</span>
            <span className="kpi-subtitle">Active this semester</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className={`kpi-icon ${studentData.overallAttendancePercentage < 75 ? 'danger' : 'success'}`}>
            <HiOutlineClipboardCheck />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{studentData.overallAttendancePercentage}%</span>
            <span className="kpi-label">Overall Attendance</span>
            <span className="kpi-subtitle">{studentData.totalClassesAttended} of {studentData.totalClassesHeld} attended</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon primary"><HiOutlineDocumentText /></div>
          <div className="kpi-content">
            <span className="kpi-value">{studentData.submittedAssignmentsCount} / {studentData.totalAssignments}</span>
            <span className="kpi-label">Assignments Done</span>
            <span className="kpi-subtitle">{studentData.assignmentCompletionRate}% completion rate</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon purple"><HiOutlineAcademicCap /></div>
          <div className="kpi-content">
            <span className="kpi-value">
              {studentData.averageGradePercentage !== null ? `${studentData.averageGradePercentage}%` : 'N/A'}
            </span>
            <span className="kpi-label">Average Score</span>
            <span className="kpi-subtitle">From {studentData.gradedAssignmentsCount} graded</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon success"><HiOutlineFolder /></div>
          <div className="kpi-content">
            <span className="kpi-value">{studentData.studyMaterialsAvailableCount}</span>
            <span className="kpi-label">Study Materials</span>
            <span className="kpi-subtitle">Uploaded by instructors</span>
          </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="charts-grid">
        <ProgressGauge
          value={studentData.overallAttendancePercentage}
          threshold={75}
          label="Overall Attendance"
          subLabel={`${studentData.totalClassesAttended} attended • ${studentData.totalClassesMissed} missed`}
        />

        <BarChart
          title="Course-wise Attendance Rate (%)"
          data={courseAttendanceData}
          height={260}
          emptyMessage="No enrolled courses found."
        />

        <DonutChart
          title="Assignment Submissions & Status"
          data={assignmentStatusData.length > 0 ? assignmentStatusData : [{ label: 'No Assignments', value: 0, color: '#ccc' }]}
          size={210}
          emptyMessage="No assignments assigned yet."
        />
      </div>

      {/* Course-wise Attendance Table */}
      <div className="analytics-section">
        <div className="section-header">
          <h2 className="section-title">
            <HiOutlineClipboardCheck /> Course-by-Course Attendance Breakdown
          </h2>
          <span className="badge badge-info">{studentData.courseAttendance?.length || 0} Courses Enrolled</span>
        </div>

        <div className="table-responsive">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Course Name</th>
                <th>Instructor</th>
                <th>Classes Held</th>
                <th>Attended</th>
                <th>Missed</th>
                <th>Attendance %</th>
                <th>Eligibility Status</th>
              </tr>
            </thead>
            <tbody>
              {studentData.courseAttendance && studentData.courseAttendance.length > 0 ? (
                studentData.courseAttendance.map((c) => (
                  <tr key={c.courseId}>
                    <td><strong>{c.courseCode}</strong></td>
                    <td>{c.courseName}</td>
                    <td>{c.facultyName}</td>
                    <td>{c.totalClasses}</td>
                    <td><span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{c.attendedClasses}</span></td>
                    <td><span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{c.missedClasses}</span></td>
                    <td>
                      <span className={`badge ${c.isBelowThreshold ? 'badge-danger' : 'badge-success'}`} style={{ fontWeight: 700 }}>
                        {c.attendancePercentage}%
                      </span>
                    </td>
                    <td>
                      {c.isBelowThreshold ? (
                        <span className="badge badge-danger">Shortage Warning (&lt;75%)</span>
                      ) : (
                        <span className="badge badge-success">Good Standing</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)' }}>
                    You are not enrolled in any courses.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignments and Status Table */}
      <div className="analytics-section">
        <div className="section-header">
          <h2 className="section-title">
            <HiOutlineDocumentText /> Assignment Activity & Submission Status
          </h2>
          <span className="badge badge-primary">{studentData.assignments?.length || 0} Assignments</span>
        </div>

        <div className="table-responsive">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Assignment Title</th>
                <th>Course</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Marks</th>
              </tr>
            </thead>
            <tbody>
              {studentData.assignments && studentData.assignments.length > 0 ? (
                studentData.assignments.map((a) => (
                  <tr key={a.assignmentId}>
                    <td><strong>{a.title}</strong></td>
                    <td>{a.courseCode}</td>
                    <td>{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      {a.status === 'GRADED' && <span className="badge badge-success">Graded</span>}
                      {a.status === 'SUBMITTED' && <span className="badge badge-info">Submitted</span>}
                      {a.status === 'LATE' && <span className="badge badge-warning">Late Submission</span>}
                      {a.status === 'OVERDUE' && <span className="badge badge-danger">Overdue</span>}
                      {a.status === 'NOT_SUBMITTED' && <span className="badge badge-warning">Pending</span>}
                    </td>
                    <td>
                      {a.marksObtained !== null ? (
                        <strong>{a.marksObtained} / {a.totalMarks}</strong>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)' }}>Pending review</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)' }}>
                    No assignments found for your enrolled courses.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
