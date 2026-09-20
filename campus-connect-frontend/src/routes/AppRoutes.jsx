/**
 * AppRoutes — defines the entire routing structure of CampusConnect.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';

// Auth Pages
import LandingPage from '../pages/auth/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Dashboards
import StudentDashboard from '../pages/student/StudentDashboard';
import FacultyDashboard from '../pages/faculty/FacultyDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';

// Phase 2 Pages
import StudentCourses from '../pages/student/StudentCourses';
import StudentEnrolledCourses from '../pages/student/StudentEnrolledCourses';
import StudentProfile from '../pages/student/StudentProfile';
import FacultyCourses from '../pages/faculty/FacultyCourses';
import AdminCourses from '../pages/admin/AdminCourses';
import AdminStudents from '../pages/admin/AdminStudents';

// Phase 3 Attendance Pages
import StudentAttendance from '../pages/student/StudentAttendance';
import FacultyAttendance from '../pages/faculty/FacultyAttendance';
import AdminAttendance from '../pages/admin/AdminAttendance';

// Phase 4 Assignment Pages
import StudentAssignments from '../pages/student/StudentAssignments';
import FacultyAssignments from '../pages/faculty/FacultyAssignments';
import FacultySubmissions from '../pages/faculty/FacultySubmissions';
import AdminAssignments from '../pages/admin/AdminAssignments';

// Phase 5 Timetable Pages
import StudentTimetable from '../pages/student/StudentTimetable';
import FacultyTimetable from '../pages/faculty/FacultyTimetable';
import AdminTimetable from '../pages/admin/AdminTimetable';

// Phase 7 Study Materials Pages
import StudentStudyMaterials from '../pages/student/StudentStudyMaterials';
import FacultyStudyMaterials from '../pages/faculty/FacultyStudyMaterials';
import AdminStudyMaterials from '../pages/admin/AdminStudyMaterials';

// Phase 8 Announcements Pages
import StudentAnnouncements from '../pages/student/StudentAnnouncements';
import FacultyAnnouncements from '../pages/faculty/FacultyAnnouncements';
import AdminAnnouncements from '../pages/admin/AdminAnnouncements';

// Phase 9 Messaging Pages
import StudentMessages from '../pages/student/StudentMessages';
import FacultyMessages from '../pages/faculty/FacultyMessages';

// Phase 10 Analytics & Reports Pages
import StudentAnalytics from '../pages/student/StudentAnalytics';
import FacultyAnalytics from '../pages/faculty/FacultyAnalytics';
import AdminAnalytics from '../pages/admin/AdminAnalytics';

export default function AppRoutes() {
  const { user, isAuthenticated } = useAuth();

  const getDashboardPath = () => {
    const roleRoutes = {
      STUDENT: '/student/dashboard',
      FACULTY: '/faculty/dashboard',
      ADMIN: '/admin/dashboard',
    };
    return roleRoutes[user?.role] || '/';
  };

  return (
    <Routes>
      {/* ---- PUBLIC AUTH ROUTES ---- */}
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to={getDashboardPath()} replace /> : <LandingPage />}
      />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={getDashboardPath()} replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to={getDashboardPath()} replace /> : <RegisterPage />}
      />

      {/* ---- PROTECTED DASHBOARD ROUTES ---- */}
      <Route element={<DashboardLayout />}>
        {/* Student Routes */}
        <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/courses" element={<StudentCourses />} />
          <Route path="/student/my-courses" element={<StudentEnrolledCourses />} />
          <Route path="/student/attendance" element={<StudentAttendance />} />
          <Route path="/student/timetable" element={<StudentTimetable />} />
          <Route path="/student/assignments" element={<StudentAssignments />} />
          <Route path="/student/study-materials" element={<StudentStudyMaterials />} />
          <Route path="/student/announcements" element={<StudentAnnouncements />} />
          <Route path="/student/messages" element={<StudentMessages />} />
          <Route path="/student/analytics" element={<StudentAnalytics />} />
          <Route path="/student/profile" element={<StudentProfile />} />
        </Route>

        {/* Faculty Routes */}
        <Route element={<ProtectedRoute allowedRoles={['FACULTY']} />}>
          <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
          <Route path="/faculty/courses" element={<FacultyCourses />} />
          <Route path="/faculty/attendance" element={<FacultyAttendance />} />
          <Route path="/faculty/timetable" element={<FacultyTimetable />} />
          <Route path="/faculty/assignments" element={<FacultyAssignments />} />
          <Route path="/faculty/submissions" element={<FacultySubmissions />} />
          <Route path="/faculty/study-materials" element={<FacultyStudyMaterials />} />
          <Route path="/faculty/announcements" element={<FacultyAnnouncements />} />
          <Route path="/faculty/messages" element={<FacultyMessages />} />
          <Route path="/faculty/analytics" element={<FacultyAnalytics />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/courses" element={<AdminCourses />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/attendance" element={<AdminAttendance />} />
          <Route path="/admin/timetable" element={<AdminTimetable />} />
          <Route path="/admin/assignments" element={<AdminAssignments />} />
          <Route path="/admin/study-materials" element={<AdminStudyMaterials />} />
          <Route path="/admin/announcements" element={<AdminAnnouncements />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
        </Route>
      </Route>


      {/* ---- CATCH ALL REDIRECT ---- */}
      <Route path="*" element={<Navigate to={isAuthenticated ? getDashboardPath() : '/'} replace />} />
    </Routes>
  );
}

