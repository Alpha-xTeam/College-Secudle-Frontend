// مسح الجلسة عند بدء التطبيق لضمان بداية نظيفة

export const clearSessionOnStart = () => {
  // مسح جميع بيانات الجلسة السابقة
  sessionStorage.clear();
  
  // مسح أي بيانات متبقية من localStorage (إن وجدت)
  const keysToRemove = ['authToken', 'user', 'accessLogs'];
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('Session cleared - Starting fresh');
};

// دالة للتحقق من حالة النظافة للجلسة
export const isSessionClean = () => {
  const authToken = sessionStorage.getItem('authToken');
  const user = sessionStorage.getItem('user');
  
  return !authToken && !user;
};
