import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import DeanDashboard from './pages/DeanDashboard';
import DepartmentDashboard from './pages/DepartmentDashboard';
import ManageUsers from './pages/ManageUsers';
import ManageRooms from './pages/ManageRooms';
import ManageSupervisors from './pages/ManageSupervisors';
import EditSchedule from './pages/EditSchedule';
import ManageDoctors from './pages/ManageDoctors'; // New import
import RoomSchedulePublic from './pages/RoomSchedulePublic';
import StudentScheduleView from './pages/StudentScheduleView';
import General from './pages/General';
import { isAuthenticated, getUserRole, clearSessionOnClose } from './utils/auth';
import { useAuthGuard, useSecurityMonitor } from './hooks/useAuthGuard';
import './styles/responsive.css';
import './styles/mobile-responsive.css';

function App() {
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    userRole: null,
    loading: true
  });

  // تطبيق الحماية الأمنية
  useAuthGuard();
  useSecurityMonitor();

  useEffect(() => {
    // تطبيق مسح الجلسة عند إغلاق النافذة فقط
    clearSessionOnClose();

    const checkAuth = () => {
      const isLoggedIn = isAuthenticated();
      const userRole = getUserRole();
      setAuthState({
        isLoggedIn,
        userRole,
        loading: false
      });
    };

    checkAuth();

    // إضافة listener للتحقق من تغييرات localStorage
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const { isLoggedIn, userRole } = authState;

  const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    // إجبار الذهاب للهوم أولاً إذا لم يسجل دخول
    if (!isLoggedIn) {
      return <Navigate to="/home" replace />;
    }
    
    // فحص الصلاحيات إذا كانت مطلوبة
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return <Navigate to="/home" replace />;
    }
    
    return children;
  };

  // إخفاء Navbar في صفحات الهوم والصفحات العامة (بما في ذلك صفحة /general)
  const currentPath = (window.location && window.location.pathname) ? window.location.pathname : '';
  const currentPathLower = currentPath.toLowerCase();
  const isHomeOrPublic = currentPathLower === '/home' || currentPathLower === '/general' || currentPathLower.startsWith('/room/');
  if (authState.loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>جاري التحقق من تسجيل الدخول...</div>
      </div>
    );
  }
  return (
    <div className="App">
      {isLoggedIn && !isHomeOrPublic && <Navbar />}
      <div className={isLoggedIn && !isHomeOrPublic ? "main-content" : ""}>
        <Container fluid className={isLoggedIn && !isHomeOrPublic ? "py-4" : ""}>
          <Routes>
            {/* Public Routes - Home is accessible without login */}
            <Route path="/home" element={<Home />} />
            {/* Login Route - Only accessible from Home */}
            <Route 
              path="/login" 
              element={
                isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />
              } 
            />
            {/* Public Room Schedule - Always accessible */}
            {/* Public Room Schedule - Always accessible */}
            <Route path="/room/:roomCode" element={<RoomSchedulePublic />} />
            {/* Student Schedule View - Publicly accessible */}
            <Route path="/student-schedule" element={<StudentScheduleView />} />
            {/* Protected Routes - Require Authentication */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  {userRole === 'dean' ? <DeanDashboard /> : <DepartmentDashboard />}
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/manage-users" 
              element={
                <ProtectedRoute allowedRoles={['dean', 'department_head', 'supervisor']}>
                  <ManageUsers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/manage-rooms" 
              element={
                <ProtectedRoute allowedRoles={['dean', 'department_head', 'supervisor']}>
                  <ManageRooms />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/manage-supervisors" 
              element={
                <ProtectedRoute allowedRoles={['department_head']}>
                  <ManageSupervisors />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/edit-schedule/:roomId" 
              element={
                <ProtectedRoute allowedRoles={['dean', 'department_head', 'supervisor']}>
                  <EditSchedule />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/manage-doctors" 
              element={
                <ProtectedRoute allowedRoles={['dean']}>
                  <ManageDoctors />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/general" 
              element={<General />} 
            />
            {/* Root Path - Always goes to Home first */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            {/* Any Other Route - Must go to Home first */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Container>
      </div>
    </div>
  );
}

export default App;
