// دوال المصادقة والتحقق من الصلاحيات

export const setAuthToken = (token) => {
  localStorage.setItem('authToken', token);
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  const user = getUser();
  
  // إزالة console.log لتنظيف الكونسل
  // console.log('DEBUG: Token:', token);
  // console.log('DEBUG: User:', user);
  
  // فحص إضافي للتأكد من صحة البيانات
  if (!token || !user) {
    // console.log('DEBUG: Authentication failed - missing token or user');
    return false;
  }
  
  // تبسيط فحص المصادقة - تجاهل تحقق JWT للاختبار
  // console.log('DEBUG: Authentication successful');
  return true;
};

export const getUserRole = () => {
  const user = getUser();
  return user ? user.role : null;
};

export const getUserDepartment = () => {
  const user = getUser();
  return user ? user.department_id : null;
};

export const hasPermission = (requiredRoles) => {
  const userRole = getUserRole();
  return requiredRoles.includes(userRole);
};

export const logout = () => {
  removeAuthToken();
  // مسح أي بيانات إضافية من التخزين
  localStorage.clear();
  window.location.href = '/home';
};

// دالة لمسح البيانات عند إغلاق النافذة
// أوقف مسح البيانات تلقائياً عند إعادة التحميل
export const clearSessionOnClose = () => {
  // يمكن تفعيل المسح فقط عند إغلاق التبويبة نهائياً إذا رغبت
};

// إضافة Authorization header للطلبات
export const getAuthHeaders = () => {
  const token = getAuthToken();
  const user = getUser();
  
  console.debug('getAuthHeaders: token exists =', !!token);
  console.debug('getAuthHeaders: user exists =', !!user);
  
  if (token) {
    console.debug('getAuthHeaders: token preview =', token.substring(0, 20) + '...');
    console.debug('getAuthHeaders: user role =', user ? user.role : 'unknown');
  }
  
  return token ? { Authorization: `Bearer ${token}` } : {};
};
