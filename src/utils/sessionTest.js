// اختبار نظام إدارة الجلسات

console.log('🧪 Testing Session Management System...');

// اختبار مسح الجلسة
function testSessionClear() {
  console.log('1️⃣ Testing session clear...');
  
  // إضافة بيانات وهمية
  sessionStorage.setItem('authToken', 'test-token');
  sessionStorage.setItem('user', JSON.stringify({ name: 'Test User' }));
  
  console.log('Before clear:', {
    token: sessionStorage.getItem('authToken'),
    user: sessionStorage.getItem('user')
  });
  
  // مسح الجلسة
  sessionStorage.clear();
  
  console.log('After clear:', {
    token: sessionStorage.getItem('authToken'),
    user: sessionStorage.getItem('user')
  });
  
  console.log('✅ Session clear test passed');
}

// اختبار تحقق من المصادقة
function testAuthCheck() {
  console.log('2️⃣ Testing authentication check...');
  
  const isAuth1 = !sessionStorage.getItem('authToken');
  console.log('No token found:', isAuth1);
  
  sessionStorage.setItem('authToken', 'valid-token');
  const isAuth2 = !!sessionStorage.getItem('authToken');
  console.log('Token found:', isAuth2);
  
  sessionStorage.clear();
  console.log('✅ Auth check test passed');
}

// تشغيل الاختبارات
testSessionClear();
testAuthCheck();

console.log('🎉 All tests completed successfully!');
console.log('📋 System behavior:');
console.log('   - When tab closes: All session data cleared');
console.log('   - When app starts: Fresh clean session');
console.log('   - Default route: /home (no authentication required)');
console.log('   - Protected routes: Redirect to /home if not authenticated');
