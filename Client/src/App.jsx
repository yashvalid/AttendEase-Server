import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layouts
import AuthLayout from './components/layout/AuthLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
// Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import CreateClass from './pages/teacher/CreateClass';
import TeacherClasses from './pages/teacher/TeacherClasses';
import AttendanceRecords from './pages/teacher/AttendanceRecords';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAvailableClasses from './pages/student/StudentAvailableClasses';
import StudentEnrolledClasses from './pages/student/StudentEnrolledClasses';
import StudentHistory from './pages/student/StudentHistory';
import NotFound from './pages/NotFound';
import UserProtectedWrapper from './Components/UserProtectedWrapper';
import TeacherProtectedWrapper from './Components/TeacherProtectedWrapper';

// Protected Route Component
// const ProtectedRoute = ({ children, allowedRoles }) => {
//   const { user, isAuthenticated, loading } = useAuth();

//   if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
//   if (!isAuthenticated) return <Navigate to="/login" replace />;

//   if (allowedRoles && !allowedRoles.includes(user?.role)) {
//     return <Navigate to="/" replace />;
//   }

//   return children;
// };

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Toaster position="top-right" />
          <Routes>
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Teacher Routes */}
            <Route path="/teacher" element={
              <TeacherProtectedWrapper>
                <DashboardLayout />
              </TeacherProtectedWrapper>
            }>
              <Route index element={<TeacherDashboard />} />
              <Route path="create-class" element={<CreateClass />} />
              <Route path="classes" element={<TeacherClasses />} />
              <Route path="records" element={<AttendanceRecords />} />
            </Route>

            {/* Student Routes */}
            <Route path="/student" element={
              <UserProtectedWrapper>
                <DashboardLayout />
              </UserProtectedWrapper>
            }>
              <Route index element={<StudentDashboard />} />
              <Route path="available" element={<StudentAvailableClasses />} />
              <Route path="enrolled" element={<StudentEnrolledClasses />} />
              <Route path="history" element={<StudentHistory />} />
            </Route>

            {/* Redirect root based on role or to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
