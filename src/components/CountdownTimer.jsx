import React, { useState, useEffect } from 'react';
import './CountdownTimer.css';

/**
 * مكون العداد التنازلي للمحاضرات
 * يعرض:
 * - عداد تنازلي قبل ساعة من بدء المحاضرة
 * - "المحاضرة جارية الآن" أثناء وقت المحاضرة
 * - لا يعرض شيء قبل الساعة الأخيرة أو بعد انتهاء المحاضرة
 */
const CountdownTimer = ({ startTime, endTime, dayOfWeek }) => {
  const [status, setStatus] = useState(null); // 'upcoming', 'ongoing', 'ended', null
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateStatus = () => {
      const now = new Date();
      const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
      
      // التحقق من أن اليوم الحالي يطابق يوم المحاضرة
      if (currentDay !== dayOfWeek) {
        setStatus(null);
        return;
      }

      // تحويل أوقات المحاضرة إلى كائنات Date لليوم الحالي
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const lectureStart = new Date();
      lectureStart.setHours(startHour, startMinute, 0, 0);
      
      const lectureEnd = new Date();
      lectureEnd.setHours(endHour, endMinute, 0, 0);
      
      // ساعة واحدة قبل بدء المحاضرة
      const oneHourBefore = new Date(lectureStart.getTime() - 60 * 60 * 1000);
      
      const currentTime = now.getTime();
      const startTimeMs = lectureStart.getTime();
      const endTimeMs = lectureEnd.getTime();
      const oneHourBeforeMs = oneHourBefore.getTime();

      // تحديد الحالة
      if (currentTime >= oneHourBeforeMs && currentTime < startTimeMs) {
        // قبل بدء المحاضرة بأقل من ساعة - عرض العداد
        setStatus('upcoming');
        
        const diff = startTimeMs - currentTime;
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else if (currentTime >= startTimeMs && currentTime < endTimeMs) {
        // المحاضرة جارية الآن
        setStatus('ongoing');
        setTimeLeft('');
      } else {
        // إما قبل الساعة الأخيرة أو بعد انتهاء المحاضرة - لا نعرض شيء
        setStatus(null);
        setTimeLeft('');
      }
    };

    // تحديث الحالة فوراً
    updateStatus();

    // تحديث كل ثانية
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [startTime, endTime, dayOfWeek]);

  // إذا لم تكن هناك حالة، لا نعرض شيء
  if (!status) {
    return null;
  }

  // عرض "المحاضرة جارية الآن"
  if (status === 'ongoing') {
    return (
      <div className="countdown-badge ongoing-badge">
        <i className="fas fa-circle ongoing-icon"></i>
        <span className="ongoing-text">المحاضرة جارية الآن</span>
      </div>
    );
  }

  // عرض العداد التنازلي
  if (status === 'upcoming') {
    return (
      <div className="countdown-badge upcoming-badge">
        <i className="fas fa-clock"></i>
        <span className="countdown-text">تبدأ خلال: {timeLeft}</span>
      </div>
    );
  }

  return null;
};

export default CountdownTimer;
