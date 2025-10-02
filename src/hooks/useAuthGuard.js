import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

// Hook لحماية الصفحات من الوصول المباشر
export const useAuthGuard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const protectedPaths = [
      '/dashboard',
      '/manage-users',
      '/manage-rooms',
      '/manage-supervisors',
      '/edit-schedule'
    ];
    
    // فحص إذا كان المسار محمي
    const isProtectedPath = protectedPaths.some(path => 
      location.pathname.startsWith(path)
    );
    
    // إذا كان المسار محمي ولم يسجل دخول، توجه للهوم
    if (isProtectedPath && !isAuthenticated()) {
      console.warn('محاولة وصول غير مصرح بها للمسار:', location.pathname);
      navigate('/home', { replace: true });
    }
  }, [location.pathname, navigate]);
};

// Hook للتحقق من محاولات الوصول المشبوهة
export const useSecurityMonitor = () => {
  const location = useLocation();
  
  useEffect(() => {
    // تسجيل محاولات الوصول للتدقيق
    const logAccess = () => {
      const timestamp = new Date().toISOString();
      const accessLog = {
        path: location.pathname,
        timestamp,
        authenticated: isAuthenticated(),
        userAgent: navigator.userAgent
      };
      
      // يمكن إرسال هذه البيانات للخادم للتدقيق
      // تم تعطيل console.log لتنظيف الكونسل
      // console.log('Access Log:', accessLog);
      
      // حفظ محلي للسجلات (اختياري) - استخدام sessionStorage
      const logs = JSON.parse(sessionStorage.getItem('accessLogs') || '[]');
      logs.push(accessLog);
      
      // الاحتفاظ بآخر 100 سجل فقط
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      sessionStorage.setItem('accessLogs', JSON.stringify(logs));
    };
    
    logAccess();
  }, [location.pathname]);
};
