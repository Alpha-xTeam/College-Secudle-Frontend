import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Card, Table } from 'react-bootstrap';
import axios from 'axios';
import CountdownTimer from '../components/CountdownTimer';
import Icon from '../components/Icon';

// أنماط CSS مخصصة حديثة
const modernStyles = `
  /* Modern Student Schedule Styles */
  .modern-student-schedule {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    min-height: 100vh;
    position: relative;
  }
  
  .modern-student-schedule::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.03) 0%, transparent 50%);
    pointer-events: none;
    z-index: -1;
  }
  
  /* Modern Header */
  .modern-schedule-header {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    margin-bottom: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    position: relative;
    overflow: hidden;
  }
  
  .modern-schedule-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
  }
  
  .modern-schedule-title {
    background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 800;
    font-size: 2rem;
    margin-bottom: 0;
  }
  
  /* Modern Form Card */
  .modern-form-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: none;
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    margin-bottom: 2rem;
  }
  
  .modern-form-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .modern-form-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }
  
  .modern-form-card:hover::before {
    opacity: 1;
  }
  
  .modern-form-header {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border: none;
    border-radius: 20px 20px 0 0;
    padding: 1.5rem 2rem;
    position: relative;
  }
  
  .modern-form-title {
    background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 800;
    font-size: 1.25rem;
    margin: 0;
  }
  
  /* Modern Form Controls */
  .modern-form-control {
    border: 2px solid #e2e8f0 !important;
    border-radius: 12px !important;
    padding: 1rem 1.25rem !important;
    font-size: 1rem !important;
    transition: all 0.3s ease !important;
    background: rgba(255, 255, 255, 0.8) !important;
    backdrop-filter: blur(10px) !important;
  }
  
  .modern-form-control:focus {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
    background: white !important;
  }
  
  .modern-form-label {
    font-weight: 700 !important;
    color: #1e293b !important;
    margin-bottom: 0.75rem !important;
    font-size: 0.95rem !important;
  }
  
  /* Modern Buttons */
  .modern-btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
    border: none !important;
    border-radius: 12px !important;
    padding: 0.75rem 2rem !important;
    font-weight: 600 !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3) !important;
  }
  
  .modern-btn-primary:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4) !important;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
  }
  
  /* Modern Table */
  .modern-schedule-table {
    background: rgba(255, 255, 255, 0.9) !important;
    backdrop-filter: blur(20px) !important;
    border-radius: 16px !important;
    overflow: hidden !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
    border-collapse: separate !important;
    border-spacing: 0 !important;
  }
  
  .modern-schedule-table thead th {
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%) !important;
    color: white !important;
    border: none !important;
    font-weight: 700 !important;
    padding: 1.25rem 1rem !important;
    text-align: center !important;
    vertical-align: middle !important;
    position: relative !important;
  }
  
  .modern-schedule-table tbody td {
    padding: 1rem !important;
    border-bottom: 1px solid #f1f5f9 !important;
    vertical-align: middle !important;
    text-align: center !important;
    transition: all 0.3s ease !important;
  }
  
  .modern-schedule-table tbody tr {
    transition: all 0.3s ease !important;
  }
  
  .modern-schedule-table tbody tr:hover {
    background: rgba(59, 130, 246, 0.05) !important;
    transform: scale(1.01) !important;
  }
  
  /* Modern Alerts */
  .modern-alert {
    border: none !important;
    border-radius: 16px !important;
    padding: 1.25rem 1.5rem !important;
    border-left: 4px solid !important;
    backdrop-filter: blur(10px) !important;
    position: relative !important;
    overflow: hidden !important;
  }
  
  .modern-alert-danger {
    background: rgba(239, 68, 68, 0.1) !important;
    border-left-color: #ef4444 !important;
    color: #dc2626 !important;
  }
  
  .modern-alert-info {
    background: rgba(59, 130, 246, 0.1) !important;
    border-left-color: #3b82f6 !important;
    color: #2563eb !important;
  }
  
  /* Mobile Responsive Styles */
  @media (max-width: 768px) {
    /* Hide table on mobile */
    .modern-schedule-table {
      display: none !important;
    }
    
    /* Show cards on mobile */
    .mobile-schedule-cards {
      display: block !important;
    }
    
    /* Mobile schedule cards */
    .mobile-schedule-card {
      background: rgba(255, 255, 255, 0.9) !important;
      backdrop-filter: blur(20px) !important;
      border: none !important;
      border-radius: 16px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
      margin-bottom: 1rem !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      position: relative !important;
      overflow: hidden !important;
    }
    
    .mobile-schedule-card:hover {
      transform: translateY(-4px) !important;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
    }
    
    .mobile-schedule-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .mobile-schedule-card:hover::before {
      opacity: 1;
    }
    
    .mobile-schedule-header {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
      border: none !important;
      border-radius: 16px 16px 0 0 !important;
      padding: 1rem 1.25rem !important;
      position: relative !important;
    }
    
    .mobile-schedule-title {
      background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: 800;
      font-size: 1.1rem;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .mobile-schedule-body {
      padding: 1.25rem !important;
    }
    
    .mobile-schedule-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .mobile-schedule-info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .mobile-schedule-info-label {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .mobile-schedule-info-value {
      font-size: 0.95rem;
      color: #1e293b;
      font-weight: 600;
    }
    
    .mobile-schedule-time {
      grid-column: 1 / -1;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      padding: 1rem;
      border-radius: 12px;
      border: 1px solid #bae6fd;
    }
    
    .mobile-schedule-time .mobile-schedule-info-label {
      color: #0369a1;
    }
    
    .mobile-schedule-time .mobile-schedule-info-value {
      color: #0c4a6e;
      font-size: 1.1rem;
    }
    
    .mobile-doctor-list {
      grid-column: 1 / -1;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      padding: 1rem;
      border-radius: 12px;
      border: 1px solid #fcd34d;
    }
    
    .mobile-doctor-item {
      font-size: 0.9rem;
      margin-bottom: 0.25rem;
      padding: 0.25rem 0;
    }
    
    .mobile-primary-doctor {
      font-weight: bold;
      color: #92400e;
    }
  }
  
  /* Desktop card grid styles */
  .desktop-schedule-cards {
    display: none; /* hidden by default, shown on large screens via media query */
    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
    gap: 1rem;
    padding: 1rem;
  }
  
  .desktop-card {
    display: flex;
    gap: 1rem;
    align-items: stretch;
    background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
    border-radius: 12px;
    padding: 12px;
    border: 1px solid rgba(15, 23, 42, 0.04);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  
  .desktop-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 18px 40px rgba(2,6,23,0.08);
  }
  
  .desktop-card-left {
    width: 84px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 8px;
    color: white;
    font-weight: 700;
    text-align: center;
  }
  
  .lecture-type-practical { background: linear-gradient(90deg,#f59e0b,#fbbf24); }
  .lecture-type-theoretical { background: linear-gradient(90deg,#3b82f6,#06b6d4); }
  
  .desktop-card-body { flex: 1; display: flex; flex-direction: column; gap: 6px; }
  
  .lecture-title { font-weight: 800; font-size: 1.05rem; color: #0f172a; }
  .meta-line { color: #475569; font-size: 0.9rem; }
  
  .badge-compact { display: inline-block; padding: 6px 10px; border-radius: 999px; font-weight:700; font-size:0.82rem; }
  .room-badge { background: rgba(59,130,246,0.1); color:#0743a6; }
  .section-badge { background: rgba(234,179,8,0.08); color:#92400e; }
  .group-badge { background: rgba(99,102,241,0.08); color:#312e81; }
  
  .time-compact { font-weight:800; color:#0f172a; }

  /* Show desktop cards and hide the table on larger screens */
  @media (min-width: 769px) {
    .desktop-schedule-cards {
      display: grid !important;
    }
    .modern-schedule-table {
      display: none !important;
    }
    .mobile-schedule-cards {
      display: none !important;
    }
  }
`;

const StudentScheduleView = () => {
  const [studentId, setStudentId] = useState('');
  const [schedule, setSchedule] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // إضافة الأنماط CSS المخصصة
  useEffect(() => {
    const existingStyle = document.querySelector('#modern-student-schedule-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'modern-student-schedule-styles';
    styleElement.textContent = modernStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      const styleToRemove = document.querySelector('#modern-student-schedule-styles');
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, []);

  // إضافة الـ CSS المتجاوب عند تحميل المكون
  useEffect(() => {
    const styleId = 'student-schedule-mobile-styles';
    
    // التحقق من عدم وجود الـ CSS مسبقاً لتجنب التكرار
    if (!document.getElementById(styleId)) {
      const mobileStyles = `
        @media (max-width: 768px) {
          /* إخفاء جدول العرض الخاص بصفحة جدول الطلاب على الهواتف فقط */
          .modern-schedule-table,
          .modern-schedule-table .table-responsive table {
            display: none !important;
          }
          
          /* إظهار تصميم الهواتف */
          .mobile-schedule-view {
            display: block !important;
          }
          
          /* تصميم البطاقات للهواتف */
          .mobile-schedule-card {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            margin-bottom: 15px;
            padding: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .mobile-schedule-card h6 {
            color: #0d6efd;
            margin-bottom: 10px;
            font-weight: bold;
            border-bottom: 2px solid #0d6efd;
            padding-bottom: 5px;
          }
          
          .mobile-info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
            border-bottom: 1px solid #e9ecef;
          }
          
          .mobile-info-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          
          .mobile-info-label {
            font-weight: bold;
            color: #495057;
            min-width: 70px;
          }
          
          .mobile-info-value {
            text-align: right;
            color: #212529;
            flex: 1;
          }
          
          .mobile-doctors-list {
            text-align: right;
          }
          
          .mobile-doctor-item {
            font-size: 0.9em;
            margin-bottom: 2px;
            padding: 2px 0;
          }
          
          .mobile-primary-doctor {
            font-weight: bold;
            color: #198754;
          }
          
          /* تحسين شكل الحاوية الرئيسية */
          .container {
            padding-left: 10px !important;
            padding-right: 10px !important;
          }
          
          .card {
            margin: 10px auto;
            border-radius: 10px;
          }
          
          .card-header h5 {
            font-size: 1.1rem;
            text-align: center;
          }
          
          /* تحسين شكل النموذج */
          .form-group {
            margin-bottom: 20px;
          }
          
          .form-control {
            padding: 12px;
            font-size: 16px;
            border-radius: 8px;
          }
          
          .btn {
            width: 100%;
            padding: 12px;
            font-size: 16px;
            border-radius: 8px;
            margin-bottom: 15px;
          }
          
          /* تحسين شكل التنبيهات */
          .alert {
            border-radius: 8px;
            margin: 15px 0;
          }
          
          /* إخفاء عنوان الجدول على الهواتف */
          .mobile-hide-desktop-title {
            display: none;
          }
          
          /* عنوان خاص بالهواتف */
          .mobile-schedule-title {
            text-align: center;
            color: #0d6efd;
            font-weight: bold;
            margin-bottom: 20px;
            padding: 10px;
            background: linear-gradient(135deg, #e3f2fd 0%, #f1f8ff 100%);
            border-radius: 8px;
            border: 1px solid #bee5eb;
          }
        }
        
        /* إخفاء تصميم الهواتف على الشاشات الكبيرة */
        @media (min-width: 769px) {
          .mobile-schedule-view {
            display: none !important;
          }
        }
      `;

      const styleSheet = document.createElement("style");
      styleSheet.type = "text/css";
      styleSheet.id = styleId;
      styleSheet.textContent = mobileStyles;
      document.head.appendChild(styleSheet);
    }

    // تنظيف الـ CSS عند إلغاء تحميل المكون
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const getCurrentDayOfWeek = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const date = new Date();
    return days[date.getDay()];
  };

  const dayLabels = {
    sunday: 'الأحد',
    monday: 'الاثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت',
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hh, mm] = timeStr.split(':');
    const hour = parseInt(hh, 10);
    const minute = parseInt(mm, 10);
    const ampm = hour >= 12 ? 'م' : 'ص';
    const formattedHour = hour % 12 || 12;
    return `${String(formattedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;
  };

  const handleFetchSchedule = async () => {
    if (!studentId) {
      setError('الرجاء إدخال معرف الطالب.');
      return;
    }

    setLoading(true);
    setError('');
    setSchedule(null);

    try {
      const defaultOrigin = (() => {
        try {
          const origin = window.location.origin || `${window.location.protocol}//${window.location.hostname}`;
          return origin.replace(/:\\d+$/, ':5000');
        } catch (e) {
          return 'http://127.0.0.1:5000';
        }
      })();
      const API_URL = process.env.REACT_APP_API_URL || defaultOrigin;

      const response = await axios.get(`${API_URL}/api/students/get_student_full_schedule/${studentId}`);
      if (response.data.student_schedule) {
        const fetchedStudent = response.data.student || null;
        setStudent(fetchedStudent);
        const today = getCurrentDayOfWeek();
        // Filter schedules for today
        let todaySchedule = response.data.student_schedule.filter(s => s.day_of_week === today);

        // Further filter by student's section/group: keep schedule if schedule group/letter is null OR matches student's group
        if (fetchedStudent) {
          const studentGroup = fetchedStudent.group || fetchedStudent.group_name || '';
          const studentSection = fetchedStudent.section || '';

          todaySchedule = todaySchedule.filter(entry => {
            // Group matching: allow when schedule group is null or matches student's group or group_letter
            const groupMatch = !entry.group && !entry.group_letter
              ? true
              : (entry.group && String(entry.group).trim().toLowerCase() === String(studentGroup).trim().toLowerCase())
                || (entry.group_letter && String(entry.group_letter).trim().toUpperCase() === String(studentGroup).trim().toUpperCase());

            // Section matching: allow when schedule.section and schedule.section_number are null OR matches student's section
            const sectionMatch = (entry.section === null && entry.section_number === null)
              ? true
              : (entry.section && String(entry.section).trim() === String(studentSection).trim())
                || (entry.section_number && String(entry.section_number) === String(studentSection));

            return groupMatch && sectionMatch;
          });
        }

        // Sort by start time
        todaySchedule = todaySchedule.sort((a, b) => {
          const timeA = (a.start_time || '').split(':').map(Number);
          const timeB = (b.start_time || '').split(':').map(Number);
          if (timeA[0] !== timeB[0]) return timeA[0] - timeB[0];
          return timeA[1] - timeB[1];
        });

        setSchedule(todaySchedule);
        console.log("DEBUG: todaySchedule", todaySchedule, 'student=', fetchedStudent);
      } else {
        setError('لم يتم العثور على جدول لهذا المعرف.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ أثناء جلب الجدول.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-student-schedule">
      <Container className="py-4">
        {/* Header Section */}
        <div className="modern-schedule-header">
          <h1 className="modern-schedule-title">
            <i className="fas fa-calendar-alt me-3"></i>
            عرض الجدول الأسبوعي للطالب
          </h1>
          <p className="text-muted mb-0 fs-5">
            عرض الجدول الدراسي اليومي بتصميم متجاوب
          </p>
        </div>

        {/* Form Card */}
        <Card className="modern-form-card">
          <Card.Header className="modern-form-header">
            <h5 className="modern-form-title">
              <i className="fas fa-search me-2"></i>
              البحث عن الجدول
            </h5>
          </Card.Header>
          <Card.Body className="p-4">
            <Form>
              <Form.Group className="mb-4" controlId="studentIdInput">
                <Form.Label className="modern-form-label">
                  <i className="fas fa-id-card me-2"></i>
                  معرف الطالب
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="أدخل معرف الطالب الخاص بك..."
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="modern-form-control"
                />
                <Form.Text className="text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  أدخل المعرف المسجل في النظام لعرض جدولك الدراسي
                </Form.Text>
              </Form.Group>
              <div className="d-flex justify-content-center">
                <Button 
                  variant="primary" 
                  onClick={handleFetchSchedule} 
                  disabled={loading}
                  className="modern-btn-primary px-5 py-3"
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-2"></i>
                      جاري التحميل...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-search me-2"></i>
                      عرض الجدول
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        {/* Alerts */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')} className="modern-alert modern-alert-danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {/* Schedule Display */}
        {schedule && schedule.length > 0 && (
          <Card className="modern-form-card">
            <Card.Header className="modern-form-header">
              <h5 className="modern-form-title">
                <i className="fas fa-calendar-day me-2"></i>
                الجدول اليومي - {dayLabels[getCurrentDayOfWeek()]}
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              {/* Desktop Card Grid (horizontal cards) */}
              <div className="desktop-schedule-cards">
                {schedule.map((entry, index) => (
                  <div key={index} className={`desktop-card ${entry.lecture_type === 'practical' ? 'lecture-type-practical' : 'lecture-type-theoretical'}`}>
                    <div className={`desktop-card-left ${entry.lecture_type === 'practical' ? 'lecture-type-practical' : 'lecture-type-theoretical'}`}>
                      <div className="time-compact">{formatTime(entry.start_time)}</div>
                      <div className="time-compact">{formatTime(entry.end_time)}</div>
                      <div style={{ marginTop: 8 }} className="badge-compact">{entry.lecture_type === 'practical' ? 'عملي' : 'نظري'}</div>
                    </div>

                    <div className="desktop-card-body">
                      <div className="lecture-title">{entry.subject_name}</div>
                      
                      {/* عداد المحاضرة لسطح المكتب */}
                      <CountdownTimer 
                        startTime={entry.start_time} 
                        endTime={entry.end_time} 
                        dayOfWeek={entry.day_of_week}
                      />
                      
                      <div className="meta-line">{entry.rooms?.name || entry.rooms?.code} • {entry.instructor_name || entry.doctors?.name || 'غير محدد'}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                        <div className="badge-compact room-badge">{entry.rooms?.code || '---'}</div>
                        <div className="badge-compact section-badge">{entry.section || (entry.section_number ? `ق${entry.section_number}` : 'عام')}</div>
                        <div className="badge-compact group-badge">{entry.group || entry.group_letter || 'عام'}</div>
                      </div>
                      {entry.has_multiple_doctors && (
                        <div style={{ marginTop: 8, color: '#6b7280', fontSize: 13 }}>{entry.multiple_doctors_names?.join(' • ')}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Cards */}
              <div className="mobile-schedule-cards">
                {schedule.map((entry, index) => (
                  <Card key={index} className="mobile-schedule-card">
                    <Card.Header className="mobile-schedule-header">
                      <h6 className="mobile-schedule-title">
                        <i className="fas fa-book"></i>
                        {entry.subject_name}
                      </h6>
                    </Card.Header>
                    <Card.Body className="mobile-schedule-body">
                      {/* عداد المحاضرة للموبايل */}
                      <CountdownTimer 
                        startTime={entry.start_time} 
                        endTime={entry.end_time} 
                        dayOfWeek={entry.day_of_week}
                      />
                      
                      <div className="mobile-schedule-info">
                        <div className="mobile-schedule-time">
                          <div className="mobile-schedule-info-label"><Icon name="clock" className="me-1" /> الوقت</div>
                          <div className="mobile-schedule-info-value">
                            {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                          </div>
                        </div>
                        
                        <div className="mobile-schedule-info-item">
                          <div className="mobile-schedule-info-label"><Icon name="university" className="me-1" /> القاعة</div>
                          <div className="mobile-schedule-info-value">
                            <strong className="text-primary">{entry.rooms.name || entry.rooms.code}</strong>
                          </div>
                        </div>
                        
                        <div className="mobile-schedule-info-item">
                          <div className="mobile-schedule-info-label">📋 الشعبة</div>
                          <div className="mobile-schedule-info-value">
                            <strong className="text-warning">{entry.section || 'غير محدد'}</strong>
                          </div>
                        </div>
                        
                        <div className="mobile-schedule-info-item">
                          <div className="mobile-schedule-info-label"><Icon name="users" className="me-1" /> الجروب</div>
                          <div className="mobile-schedule-info-value">
                            <strong className="text-info">{entry.group || 'غير محدد'}</strong>
                          </div>
                        </div>
                        
                        <div className="mobile-doctor-list">
                          <div className="mobile-schedule-info-label"><Icon name="teacher" className="me-1" /> المحاضر</div>
                          <div className="mobile-schedule-info-value">
                            {entry.has_multiple_doctors ? (
                              <div className="mobile-doctor-list">
                                {entry.multiple_doctors_names?.map((name, nameIndex) => (
                                  <div 
                                    key={nameIndex} 
                                    className={`mobile-doctor-item ${
                                      name === entry.primary_doctor_name ? 'mobile-primary-doctor' : ''
                                    }`}
                                  >
                                    {name === entry.primary_doctor_name && <Icon name="star" className="me-1 text-warning" />}
                                    {name}
                                    {name === entry.primary_doctor_name && ' (أساسي)'}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <strong className="text-success">
                                {entry.doctors?.name || entry.instructor_name || 'غير محدد'}
                              </strong>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            </Card.Body>
          </Card>
        )}

        {schedule && schedule.length === 0 && !loading && (
          <Card className="modern-form-card">
            <Card.Body className="text-center py-5">
              <div className="mb-4">
                <i className="fas fa-calendar-times fa-4x text-muted"></i>
              </div>
              <h5 className="text-muted">لا توجد جداول متاحة</h5>
              <p className="text-muted">
                لا توجد محاضرات مجدولة لهذا الطالب في الوقت الحالي
              </p>
            </Card.Body>
          </Card>
        )}
      </Container>
    </div>
  );
};

export default StudentScheduleView;