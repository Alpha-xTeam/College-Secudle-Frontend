// مثال توضيحي لحفظ البيانات

console.log('شرح نظام حفظ البيانات:');
console.log('');

console.log('✅ بيانات دائمة (محفوظة في قاعدة البيانات):');
console.log('   القاعات: حفظ دائم في جدول rooms');
console.log('   الجداول: حفظ دائم في جدول schedules');
console.log('   المستخدمين: حفظ دائم في جدول users');
console.log('   QR Codes: حفظ دائم كملفات في الخادم');
console.log('');

console.log('❌ بيانات مؤقتة (تُمسح عند إغلاق التبويبة):');
console.log('   رمز تسجيل الدخول: sessionStorage');
console.log('   معلومات المستخدم الحالي: sessionStorage');
console.log('   سجلات الوصول: sessionStorage');
console.log('');

// محاكاة إضافة قاعة
console.log('مثال: إضافة قاعة جديدة');
console.log('1. المستخدم يدخل بيانات القاعة');
console.log('2. النظام يرسل POST request للخادم');
console.log('3. الخادم ينفذ: db.session.add(room)');
console.log('4. الخادم ينفذ: db.session.commit()');
console.log('5. القاعة محفوظة نهائياً في قاعدة البيانات ✅');
console.log('');

console.log('عند إغلاق التبويبة:');
console.log('   sessionStorage يُمسح (رمز تسجيل الدخول)');
console.log('   قاعدة البيانات تبقى كما هي (جميع القاعات محفوظة)');
console.log('');

console.log('عند فتح النظام مرة أخرى:');
console.log('   صفحة الهوم تظهر (لا يوجد تسجيل دخول)');
console.log('   يجب تسجيل الدخول مرة أخرى');
console.log('   جميع القاعات والبيانات موجودة كما هي');
