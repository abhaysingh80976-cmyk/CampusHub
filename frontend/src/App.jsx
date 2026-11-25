import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute, GuestRoute } from './routes/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';

// Student
import StudentOverview from './dashboards/student/StudentOverview';
import StudentAttendance from './dashboards/student/StudentAttendance';
import StudentAssignments from './dashboards/student/StudentAssignments';
import StudentMaterials from './dashboards/student/StudentMaterials';
import StudentNotices from './dashboards/student/StudentNotices';
import StudentEvents from './dashboards/student/StudentEvents';

// Teacher
import TeacherOverview from './dashboards/teacher/TeacherOverview';
import TeacherStudents from './dashboards/teacher/TeacherStudents';
import TeacherAttendance from './dashboards/teacher/TeacherAttendance';
import TeacherAssignments from './dashboards/teacher/TeacherAssignments';
import TeacherMaterials from './dashboards/teacher/TeacherMaterials';
import TeacherNotices from './dashboards/teacher/TeacherNotices';

// Admin
import AdminOverview from './dashboards/admin/AdminOverview';
import AdminStudents from './dashboards/admin/AdminStudents';
import AdminTeachers from './dashboards/admin/AdminTeachers';
import AdminSubjects from './dashboards/admin/AdminSubjects';
import AdminAttendance from './dashboards/admin/AdminAttendance';
import AdminAssignments from './dashboards/admin/AdminAssignments';
import AdminMaterials from './dashboards/admin/AdminMaterials';
import AdminNotices from './dashboards/admin/AdminNotices';
import AdminEvents from './dashboards/admin/AdminEvents';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/student" element={<ProtectedRoute roles={['student']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<StudentOverview />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="assignments" element={<StudentAssignments />} />
        <Route path="materials" element={<StudentMaterials />} />
        <Route path="notices" element={<StudentNotices />} />
        <Route path="events" element={<StudentEvents />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="/teacher" element={<ProtectedRoute roles={['teacher']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<TeacherOverview />} />
        <Route path="students" element={<TeacherStudents />} />
        <Route path="attendance" element={<TeacherAttendance />} />
        <Route path="assignments" element={<TeacherAssignments />} />
        <Route path="materials" element={<TeacherMaterials />} />
        <Route path="notices" element={<TeacherNotices />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<AdminOverview />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="teachers" element={<AdminTeachers />} />
        <Route path="subjects" element={<AdminSubjects />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="assignments" element={<AdminAssignments />} />
        <Route path="materials" element={<AdminMaterials />} />
        <Route path="notices" element={<AdminNotices />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
