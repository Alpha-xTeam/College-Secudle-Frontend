import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

const RequireAuth = ({ children }) => {
  const isLoggedIn = isAuthenticated();

  useEffect(() => {
    // فحص دوري لحالة المصادقة
    const interval = setInterval(() => {
      if (!isAuthenticated()) {
        // إعادة تحميل الصفحة لإجبار المستخدم على تسجيل الدخول
        window.location.href = '/login';
      }
    }, 30000); // كل 30 ثانية

    return () => clearInterval(interval);
  }, []);

  // إذا لم يكن مسجل دخول، وجهه فوراً لصفحة تسجيل الدخول
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RequireAuth;
