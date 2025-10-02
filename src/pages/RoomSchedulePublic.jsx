import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, Modal, Form } from 'react-bootstrap';
import axios from 'axios';
import { schedulesAPI } from '../api/schedules';
import { TEAM_CONFIG, getMainLogo } from '../config/teamConfig';
import ProfessionalScheduleTable from '../components/ProfessionalScheduleTable';
import FullWeeklyScheduleTable from '../components/FullWeeklyScheduleTable';
import Footer from '../components/Footer';
import { getAuthHeaders } from '../utils/auth';
import '../styles/announcements.css';
import '../styles/mobile-schedule-responsive.css';
import './RoomSchedulePublic.css';

const RoomSchedulePublic = () => {
  const { roomCode } = useParams();
  const [roomInfo, setRoomInfo] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [selectedStudyType, setSelectedStudyType] = useState('');
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(false);

  const [weeklyScheduleData, setWeeklyScheduleData] = useState(null);
  const [showWeeklyScheduleView, setShowWeeklyScheduleView] = useState(false);
  const [weeklyScheduleLoading, setWeeklyScheduleLoading] = useState(false);
  const [weeklyScheduleParams, setWeeklyScheduleParams] = useState({ stage: '', studyType: '' });

  // أزرار البحث والعرض
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [showStudentFilterModal, setShowStudentFilterModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState('1');
  const [selectedWeeklyStudyType, setSelectedWeeklyStudyType] = useState('morning');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [studentFilterError, setStudentFilterError] = useState('');
  const [studentModalSchedule, setStudentModalSchedule] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null); // store fetched student object

  // بيانات الجدول الأسبوعي في الـ Modal
  const [modalWeeklyScheduleData, setModalWeeklyScheduleData] = useState(null);
  const [modalWeeklyScheduleLoading, setModalWeeklyScheduleLoading] = useState(false);

  // تحديد يوم بغداد الحالي كمفتاح متوافق مع API
  const baghdadTodayKey = useMemo(() => {
    try {
      const baghdadNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Baghdad' }));
      const dayIndex = baghdadNow.getDay(); // 0..6 بدءاً من الأحد
      const keys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      return keys[dayIndex];
    } catch (e) {
      return null;
    }
  }, []);

  // التحقق إن كان هناك أي محاضرات اليوم
  const hasTodayData = useMemo(() => {
    if (!scheduleData || !baghdadTodayKey || !scheduleData.schedule) return false;
    const dayData = scheduleData.schedule[baghdadTodayKey] || {};
    return Object.values(dayData).some((stageList) => Array.isArray(stageList) && stageList.length > 0);
  }, [scheduleData, baghdadTodayKey]);

  // دالة لتحويل قيم المراحل من الأرقام إلى الكلمات
  const convertStageToWord = (stage) => {
    const stageMap = {
      '1': 'first',
      '2': 'second',
      '3': 'third',
      '4': 'fourth'
    };
    return stageMap[stage] || stage;
  };

  const fetchRoomInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // محاولة الحصول على معلومات القاعة من public routes أولاً
      let response = await schedulesAPI.getRoomInfo(roomCode);
      
      if (!response.success) {
        // إذا فشل، جرب الحصول من department routes
        response = await schedulesAPI.getDepartmentRoomInfo(roomCode);
      }
      
      if (response.success) {
        setRoomInfo(response.data);
      } else {
        setError(response.message || 'لم يتم العثور على القاعة');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ في جلب معلومات القاعة');
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    fetchRoomInfo();
  }, [fetchRoomInfo]);

  // Effect to filter schedule when student ID changes
  React.useEffect(() => {
    const filterScheduleByStudent = async () => {
      if (!studentIdInput.trim()) {
        setStudentFilterError('');
        setStudentModalSchedule(null);
        setStudentInfo(null);
        return;
      }
      
      if (studentIdInput.length !== 4 || !/^\d+$/.test(studentIdInput)) {
        setStudentFilterError('الرقم الجامعي يجب أن يتكون من 4 أرقام فقط.');
        setStudentModalSchedule(null);
        setStudentInfo(null);
        return;
      }

      setStudentFilterError('');
      try {
        const defaultOrigin = (() => {
          try {
            const origin = window.location.origin || `${window.location.protocol}//${window.location.hostname}`;
            return origin.replace(/:\d+$/, ':5000');
          } catch (e) {
            return 'http://127.0.0.1:5000';
          }
        })();
        const API_URL = process.env.REACT_APP_API_URL || defaultOrigin;
        // إذا كان لديك توكن مصادقة أضفه هنا
        const headers = getAuthHeaders();

        // جلب بيانات الطالب
        const studentRes = await axios.get(`${API_URL}/api/students/get_student_by_id/${studentIdInput}`, { headers });
        const student = studentRes.data;
        setStudentInfo(student || null);

         if (!student) {
           setStudentFilterError('لم يتم العثور على طالب بهذا الرقم الجامعي.');
           setStudentModalSchedule(null);
           return;
         }

        // جلب جدول الطالب مباشرة من الواجهة الخلفية
        const studentScheduleRes = await axios.get(`${API_URL}/api/students/get_student_full_schedule/${studentIdInput}`, { headers });
        const studentScheduleData = studentScheduleRes.data.student_schedule;

        if (studentScheduleData && Array.isArray(studentScheduleData) && studentScheduleData.length > 0) {
          // Flatten student schedule into an array for card rendering
          const daysOrder = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
          const flat = [];
          const to12Hour = (t) => {
            if (!t) return '';
            const [hh, mm] = (t||'').slice(0,5).split(':').map(Number);
            if (Number.isNaN(hh) || Number.isNaN(mm)) return t;
            const ampm = hh >= 12 ? 'م' : 'ص';
            const h12 = hh % 12 || 12;
            return `${String(h12).padStart(2,'0')}:${String(mm).padStart(2,'0')} ${ampm}`;
          };
          // Build flat list with a sortable startMinutes key
          daysOrder.forEach(day => {
            const byDay = studentScheduleData.filter(s => s.day_of_week === day);
            byDay.forEach(s => {
              const start = (s.start_time || '').slice(0,5);
              const end = (s.end_time || '').slice(0,5);
              let startMinutes = 0;
              if (start && /^\d{1,2}:\d{2}$/.test(start)) {
                const [hh, mm] = start.split(':').map(Number);
                startMinutes = (Number.isFinite(hh) ? hh : 0) * 60 + (Number.isFinite(mm) ? mm : 0);
              }
              flat.push({
                day: day,
                startMinutes,
                time24: start && end ? `${start} - ${end}` : (start || end || ''),
                time: start && end ? `${to12Hour(start)} - ${to12Hour(end)}` : (to12Hour(start) || to12Hour(end) || ''),
                subject: s.subject_name || s.subject || '',
                room: (s.rooms && s.rooms.name) || s.room_name || '',
                room_code: (s.rooms && s.rooms.code) || s.room_code || '',
                doctor: s.instructor_name || s.primary_doctor_name || (s.schedule_doctors && s.schedule_doctors[0] && s.schedule_doctors[0].doctors && s.schedule_doctors[0].doctors.name) || '',
                lecture_type: s.lecture_type || s.type || 'theoretical',
                group: s.group || s.group_letter || s.group_name || '',
                group_letter: s.group_letter || s.group || '',
                section: s.section || s.section_number || ''
              });
            });
          });
          
          // Sort by day order then by startMinutes (ascending)
          flat.sort((a, b) => {
            const dayCompare = daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day);
            if (dayCompare !== 0) return dayCompare;
            return (a.startMinutes || 0) - (b.startMinutes || 0);
          });

          setStudentModalSchedule(flat);
        } else {
          setStudentModalSchedule([]); // No schedule found
        }
      } catch (error) {
        console.error('Error filtering student schedule:', error);
        setStudentFilterError('حدث خطأ أثناء تصفية الجدول.');
        setStudentModalSchedule(null);
      }
    };

    filterScheduleByStudent();
  }, [studentIdInput]);

  // Effect to fetch weekly schedule data when modal is opened and selections change
  React.useEffect(() => {
    if (showWeeklyModal && selectedStage && selectedWeeklyStudyType && roomInfo) {
      fetchModalWeeklySchedule(selectedStage, selectedWeeklyStudyType);
    }
  }, [showWeeklyModal, selectedStage, selectedWeeklyStudyType, roomInfo]);
  const openAnnouncements = async () => {
    try {
      setAnnLoading(true);
      setShowAnnouncements(true);
      const res = await schedulesAPI.getRoomAnnouncements(roomCode);
      if (res.success) {
        setAnnouncements(res.data || []);
      }
    } catch (e) {
      // تجاهل الخطأ في العرض العام
    } finally {
      setAnnLoading(false);
    }
  };

  const fetchSchedule = async (studyType) => {
    try {
      setScheduleLoading(true);
      setError('');
      
      const response = await schedulesAPI.getRoomSchedule(roomCode, studyType);
      
      if (response.success) {
        setScheduleData(response.data);
        setSelectedStudyType(studyType);
      } else {
        setError(response.message || 'فشل في جلب الجدول');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ في جلب الجدول');
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleStudyTypeSelect = (studyType) => {
    setScheduleData(null);
    fetchSchedule(studyType);
  };

  const handleShowWeeklySchedule = async (stage, studyType) => {
    const departmentId = roomInfo?.department?.id || roomInfo?.department_id;
    if (!departmentId) {
      setError('معلومات القسم غير متوفرة.');
      return;
    }
    setWeeklyScheduleLoading(true);
    setWeeklyScheduleParams({ stage, studyType });
    try {
      // تحويل قيمة المرحلة من رقم إلى كلمة
      const stageWord = convertStageToWord(stage);
      const response = await schedulesAPI.getWeeklyScheduleByStage(departmentId, stageWord, studyType);
      if (response.success) {
        setWeeklyScheduleData(response.data);
        setShowWeeklyScheduleView(true);
      } else {
        setError(response.message || 'فشل في جلب الجدول الأسبوعي');
        setWeeklyScheduleData(null); // Clear old data on failure
      }
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ في جلب الجدول الأسبوعي');
      setWeeklyScheduleData(null); // Clear old data on error
    } finally {
      setWeeklyScheduleLoading(false);
    }
  };

  const handleShowWeeklyScheduleModal = () => {
    if (handleShowWeeklySchedule) {
      handleShowWeeklySchedule(selectedStage, selectedWeeklyStudyType);
    }
    setShowWeeklyModal(false);
  };

  // دالة لجلب بيانات الجدول الأسبوعي في الـ Modal
  const fetchModalWeeklySchedule = async (stage, studyType) => {
    if (!stage || !studyType) return;

    const departmentId = roomInfo?.department?.id || roomInfo?.department_id;
    if (!departmentId) {
      console.error('معلومات القسم غير متوفرة');
      return;
    }

    setModalWeeklyScheduleLoading(true);
    try {
      // تحويل قيمة المرحلة من رقم إلى كلمة
      const stageWord = convertStageToWord(stage);
      const response = await schedulesAPI.getWeeklyScheduleByStage(departmentId, stageWord, studyType);
      
      if (response.success) {
        setModalWeeklyScheduleData(response.data);
      } else {
        setModalWeeklyScheduleData(null);
      }
    } catch (error) {
      setModalWeeklyScheduleData(null);
    } finally {
      setModalWeeklyScheduleLoading(false);
    }
  };

  const handleStudentSearch = () => {
    // البحث يتم تلقائياً عبر useEffect عند تغيير studentIdInput
    // هذه الدالة يمكن أن تُستخدم لإجراء بحث إضافي إذا لزم الأمر
  };

  const resetView = () => {
    setSelectedStudyType('');
    setScheduleData(null);
    setError('');
    setShowWeeklyScheduleView(false);
    setWeeklyScheduleData(null);
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">جاري تحميل معلومات القاعة...</p>
      </Container>
    );
  }

  if (error && !roomInfo && !showWeeklyScheduleView) {
    return (
      <Container className="mt-5">
        <Alert variant="danger" className="text-center">
          <h5>خطأ</h5>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

  if (showWeeklyScheduleView) {
    return (
      <Container className="mt-4">
        <Button onClick={() => setShowWeeklyScheduleView(false)} className="mb-3">العودة إلى عرض القاعة</Button>
        {weeklyScheduleLoading ? (
          <div className="text-center"><Spinner animation="border" /></div>
        ) : weeklyScheduleData ? (
          <FullWeeklyScheduleTable 
            weeklyScheduleData={weeklyScheduleData} 
            stage={weeklyScheduleParams.stage} 
            studyType={weeklyScheduleParams.studyType} 
          />
        ) : (
          <Alert variant="warning">{error || 'لا توجد بيانات لعرضها.'}</Alert>
        )}
      </Container>
    );
  }

  return (
    <div className="room-page">
      <Container className={`mt-4 ${window.innerWidth <= 768 ? 'px-2' : ''}`}>
      <Row className="justify-content-center">
        <Col lg={10} className={window.innerWidth <= 576 ? 'px-1' : ''}>
          {/* معلومات القاعة */}
          <Card className="mb-4 shadow-sm" style={{ background: '#fff', color: '#111' }}>
            <Card.Header className="text-center room-header">
              <div className="dept-name">قسم {roomInfo?.department?.name || roomInfo?.department_name || 'غير محدد'}</div>
              <h2>قاعة {roomInfo?.name}</h2>
              <div className="room-badge">
                <Badge bg="light" text="dark" className="fs-6" style={{ borderRadius:20, padding: '6px 12px' }}>
                  الرمز: {roomInfo?.code}
                </Badge>
              </div>
            </Card.Header>
          </Card>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {!selectedStudyType ? (
            /* اختيار نوع الدراسة */
            <Card className="shadow-sm" style={{ background: '#fff', color: '#111' }}>
              <Card.Header className="text-center" style={{ background: '#2a4dd7', color: '#fff' }}>
                <h4 className="mb-1">اختر نوع الدراسة لعرض جدول اليوم</h4>
                <div style={{ opacity: 0.9, fontSize: 14 }}>
                  اليوم: {{
                    sunday: 'الأحد',
                    monday: 'الاثنين',
                    tuesday: 'الثلاثاء',
                    wednesday: 'الأربعاء',
                    thursday: 'الخميس',
                    friday: 'الجمعة',
                    saturday: 'السبت'
                  }[baghdadTodayKey] || '—'} (بتوقيت بغداد)
                </div>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={6}>
                    <Button
                      className="study-btn study-btn--primary w-100 border-0"
                      size={window.innerWidth <= 576 ? "md" : "lg"}
                      onClick={() => handleStudyTypeSelect('morning')}
                      disabled={scheduleLoading}
                    >
                      <i className="fas fa-sun" />
                      <div>الدراسة الصباحية</div>
                      <small style={{ opacity: .9, marginTop: 6 }}>عرض محاضرات اليوم فقط</small>
                    </Button>
                  </Col>
                  <Col md={6}>
                    <Button
                      className="study-btn study-btn--muted w-100 border-0"
                      size={window.innerWidth <= 576 ? "md" : "lg"}
                      onClick={() => handleStudyTypeSelect('evening')}
                      disabled={scheduleLoading}
                    >
                      <i className="fas fa-moon" />
                      <div>الدراسة المسائية</div>
                      <small style={{ opacity: .9, marginTop: 6 }}>عرض محاضرات اليوم فقط</small>
                    </Button>
                  </Col>
                </Row>

                {scheduleLoading && (
                  <div className="text-center mt-3">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 mb-0">جاري تحميل الجدول...</p>
                  </div>
                )}

                {/* زر إعلانات القسم */}
                <div className="text-center mt-4">
                  <Button className="ann-btn" onClick={openAnnouncements}>
                    <i className="fas fa-bullhorn me-2" /> إعلانات القسم
                  </Button>
                </div>

                {/* أزرار البحث والعرض */}
                <div className="text-center mt-4">
                  <div className="d-flex justify-content-center gap-3 flex-wrap">
                    <Button 
                      className="px-4 py-2 rounded-3" 
                      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', fontWeight:600, minWidth:200 }}
                      onClick={() => setShowWeeklyModal(true)}
                    >
                      <i className="fas fa-calendar-week me-2" /> عرض الجدول الاسبوعي
                    </Button>
                    <Button 
                      className="px-4 py-2 rounded-3" 
                      style={{ background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)', border: 'none', fontWeight:600, minWidth:200 }}
                      onClick={() => setShowStudentFilterModal(true)}
                    >
                      <i className="fas fa-search me-2" /> عرض الجدول بواسطة ايدي الطالب
                    </Button>
                  </div>
                </div>
              </Card.Body>
              <Card.Footer className="text-center" style={{ background: 'rgba(255, 255, 255, 0.6)' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12
                }}>
                  {(() => {
                    const logo = getMainLogo();
                    return logo.type === 'image' ? (
                      <img src={logo.src} alt={logo.alt} style={{ width: 36, height: 36, borderRadius: '50%' }} />
                    ) : (
                      <span style={logo.style}>{logo.icon}</span>
                    );
                  })()}
                  <div style={{ textAlign: 'start' }}>
                    <div style={{ fontWeight: 800, lineHeight: 1, color: '#111827' }}>
                      {TEAM_CONFIG.teamName} Team
                    </div>
                    <div style={{ fontSize: 12, color: '#374151' }}>
                      Cybersecurity Department
                    </div>
                  </div>
                </div>
              </Card.Footer>
            </Card>
          ) : (
            /* عرض الجدول */
            <Card>
              <Card.Header className={window.innerWidth <= 576 ? 'd-block' : 'd-flex justify-content-between align-items-center'}>
                <h5 className={`mb-${window.innerWidth <= 576 ? '2' : '0'}`} style={{
                  fontSize: window.innerWidth <= 576 ? '1.1rem' : '1.25rem',
                  color: '#111827'
                }}>
                  جدول القاعة
                </h5>
                <Button
                  variant="outline-secondary"
                  size={window.innerWidth <= 576 ? "sm" : "sm"}
                  onClick={resetView}
                  className={window.innerWidth <= 576 ? 'w-100' : ''}
                  style={{
                    fontSize: window.innerWidth <= 576 ? '0.8rem' : '0.875rem',
                    padding: window.innerWidth <= 576 ? '6px 12px' : '8px 16px'
                  }}
                >
                  العودة لاختيار نوع الدراسة
                </Button>
              </Card.Header>
              
              <Card.Body>
                {!scheduleData ? (
                  <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">جاري تحميل الجدول...</p>
                  </div>
                ) : (
                  <>
                    {!hasTodayData && (
                      <Alert variant="info" className="text-center mb-3">
                        لا توجد محاضرات اليوم لهذه القاعة وفق نوع الدراسة المختار
                      </Alert>
                    )}
                    <ProfessionalScheduleTable 
                      scheduleData={{...scheduleData, highlightDayKey: baghdadTodayKey}} 
                      studyType={selectedStudyType}
                      onShowWeeklySchedule={handleShowWeeklySchedule}
                    />
                  </>
                )}
              </Card.Body>
            </Card>
          )}

          {/* بطاقة إعلانات القسم أسفل الجدول - Enhanced Modern Design */}
          <div className="announcements-section mt-4" 
               style={{
                 background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(255, 255, 255, 0.98) 100%)',
                 borderRadius: '20px',
                 padding: '25px',
                 boxShadow: '0 8px 32px rgba(102, 126, 234, 0.08)',
                 border: '1px solid rgba(102, 126, 234, 0.1)',
                 position: 'relative',
                 overflow: 'hidden'
               }}>
            {/* Decorative Background Element */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '100px',
              height: '100px',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
              borderRadius: '50%',
              zIndex: 0
            }} />
            
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4" style={{ position: 'relative', zIndex: 1 }}>
              <div className="d-flex align-items-center gap-3">
                <div style={{
                  width: '50px',
                  height: '50px',
                  /* use CSS class for decorative icon */
                }} className="ann-icon-circle">
                  <i className="fas fa-bullhorn" style={{ fontSize: '22px', color: 'white' }} />
                </div>
                <div>
                  <h4 className="mb-1" style={{
                    color: '#2c3e50',
                    fontWeight: '800',
                    fontSize: '1.5rem',
                    margin: 0
                  }}>إعلانات القسم</h4>
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    display: 'inline-block',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}>
                    {announcements.length} إعلان
                  </div>
                </div>
              </div>
              <Button className="ann-btn" size="sm" onClick={openAnnouncements}>
                <i className="fas fa-expand me-2" /> عرض في نافذة
              </Button>
            </div>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {annLoading ? (
                <div className="text-center py-5" style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '16px',
                  border: '2px dashed #e1e8ed'
                }}>
                  <div className="text-center py-5" style={{ background:'rgba(255,255,255,0.8)', borderRadius:'16px', border:'2px dashed #e1e8ed' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 15px' }} className="ann-icon-circle">
                      <Spinner animation="border" variant="light" size="sm" />
                    </div>
                    <p style={{ color: '#6c757d', fontWeight: '600', margin: 0 }}>جاري تحميل الإعلانات...</p>
                  </div>
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-5" style={{
                  background: 'rgba(248, 249, 250, 0.8)',
                  borderRadius: '20px',
                  border: '3px dashed #dee2e6'
                }}>
                  <div className="no-announcements">
                    <div className="icon"><i className="fas fa-bullhorn" /></div>
                    <h5 style={{ color: '#6c757d', marginBottom: '10px', fontWeight: '700' }}>لا توجد إعلانات حالياً</h5>
                   
                    <p style={{ color: '#adb5bd', margin: 0, fontSize: '0.95rem' }}>سيتم عرض الإعلانات الجديدة هنا عند توفرها</p>
                  </div>
                 </div>
              ) : (
                <div className="row g-4">
                  {announcements.map((ann, index) => (
                    <div className="col-12" key={ann.id} style={{
                      animation: `slideInModal 0.5s ease-out ${index * 0.1}s both`
                    }}>
                      <div className="announcement-card" style={{ position:'relative', overflow:'hidden' }}>
                        {/* Header: Subject and Time (time moved inline to avoid overlapping) */}
                        <div className="d-flex justify-content-between align-items-center" style={{ width: '100%' }}>
                          <div style={{
                            fontWeight: '700',
                            fontSize: '1.1rem',
                            color: '#333',
                            marginBottom: '4px'
                          }}>
                            {ann.title}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              padding: '6px 12px',
                              borderRadius: '18px',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 6px 18px rgba(102, 126, 234, 0.18)'
                            }}>
                              <i className="bi bi-clock" style={{ fontSize: '0.95rem' }} />
                              <span style={{ whiteSpace: 'nowrap' }}>{ann.time}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="d-flex align-items-start gap-3" style={{ width: '100%' }}>
                      {/* Subject and Room */}
                      <div className="flex-grow-1">
                        <div style={{ marginTop: 6 }} />
                         <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                         القاعة: <strong style={{ color: '#1f2937' }}>{ann.room} {ann.room_code ? `(${ann.room_code})` : ''}</strong>
                       </div>
                       {/* عرض الشعبة للنظري أو الكروب للعملي */}
                       {ann.lecture_type === 'theoretical' && ann.section && (
                         <div style={{ fontSize: '0.85rem', color: '#667eea', marginTop: '4px', fontWeight: '600' }}>
                           الشعبة: <strong>{ann.section}</strong>
                         </div>
                       )}
                       {ann.lecture_type === 'practical' && (ann.group || ann.group_letter) && (
                         <div style={{ fontSize: '0.85rem', color: '#dc3545', marginTop: '4px', fontWeight: '600' }}>
                           الكروب: <strong>{ann.group || ann.group_letter}</strong>
                         </div>
                       )}
                      </div>                          {/* Doctor and Type Badge */}
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'flex-end', 
                            gap: '4px'
                          }}>
                            <div style={{
                              fontSize: '0.9rem',
                              color: '#333',
                              fontWeight: '500'
                            }}>
                              {ann.doctor}
                            </div>
                            
                            <div style={{
                              background: ann.lecture_type === 'theoretical' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                              color: ann.lecture_type === 'theoretical' ? '#007bff' : '#dc3545',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              border: `1px solid ${ann.lecture_type === 'theoretical' ? 'rgba(52, 199, 89, 0.3)' : 'rgba(255, 59, 48, 0.3)'}`
                            }}>
                              <i className={`bi ${ann.lecture_type === 'theoretical' ? 'bi-book' : 'bi-laptop'}`} style={{ fontSize: '1rem' }} />
                              {ann.lecture_type === 'theoretical' ? 'نظري' : 'عملي'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Animation Styles */}
            <style>{`
              @keyframes slideInModal {
                from {
                  opacity: 0;
                  transform: translateY(20px) scale(0.95);
                }
                to {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }
              
              @keyframes pulse {
                0%, 100% {
                  transform: scale(1);
                }
                50% {
                  transform: scale(1.08);
                }
              }
            `}</style>
          </div>

          {/* معلومات إضافية */}
          <Card className="mt-4">
            <Card.Footer className="text-center text-muted">
              <small>
                نظام إدارة جداول الكلية - تم تحديث الجدول آخر مرة: {new Date().toLocaleDateString('ar-SA')}
              </small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Modal الجدول الأسبوعي */}
      <Modal 
        show={showWeeklyModal} 
        onHide={() => {
          setShowWeeklyModal(false);
          setModalWeeklyScheduleData(null);
          setModalWeeklyScheduleLoading(false);
          // إعادة تعيين الخيارات عند الإغلاق
          setSelectedWeeklyStudyType('');
          setSelectedStage('');
        }} 
        size="xl" 
        centered
        style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        <Modal.Header 
          closeButton
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderBottom: 'none',
            borderRadius: '16px 16px 0 0',
            padding: '25px 30px 20px'
          }}
        >
          <Modal.Title style={{
            color: 'white',
            fontWeight: '800',
            fontSize: '1.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="fas fa-calendar-week" style={{ fontSize: '20px', color: 'white' }} />
            </div>
            الجدول الأسبوعي الكامل
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body style={{
          padding: '30px',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          <div className="mb-4">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ fontWeight: '600', color: '#495057' }}>
                    <i className="bi bi-mortarboard me-2" />
                    نوع الدراسة
                  </Form.Label>
                  <Form.Select 
                    value={selectedWeeklyStudyType} 
                    onChange={(e) => {
                      setSelectedWeeklyStudyType(e.target.value);
                      // مسح البيانات عند تغيير نوع الدراسة
                      setModalWeeklyScheduleData(null);
                    }}
                    style={{
                      borderRadius: '12px',
                      border: '2px solid #e9ecef',
                      padding: '12px 16px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                  >
                    <option value="">اختر نوع الدراسة</option>
                    <option value="morning">الدراسة الصباحية</option>
                    <option value="evening">الدراسة المسائية</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ fontWeight: '600', color: '#495057' }}>
                    <i className="bi bi-hash me-2" />
                    المرحلة
                  </Form.Label>
                  <Form.Select 
                    value={selectedStage} 
                    onChange={(e) => {
                      setSelectedStage(e.target.value);
                      // مسح البيانات عند تغيير المرحلة
                      setModalWeeklyScheduleData(null);
                    }}
                    style={{
                      borderRadius: '12px',
                      border: '2px solid #e9ecef',
                      padding: '12px 16px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                  >
                    <option value="">اختر المرحلة</option>
                    <option value="1">المرحلة الأولى</option>
                    <option value="2">المرحلة الثانية</option>
                    <option value="3">المرحلة الثالثة</option>
                    <option value="4">المرحلة الرابعة</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </div>
          
          {selectedWeeklyStudyType && selectedStage && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
              border: '1px solid rgba(102, 126, 234, 0.1)'
            }}>
              {modalWeeklyScheduleLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">جاري تحميل الجدول الأسبوعي...</p>
                </div>
              ) : modalWeeklyScheduleData ? (
                <FullWeeklyScheduleTable 
                  weeklyScheduleData={modalWeeklyScheduleData} 
                  stage={selectedStage} 
                  studyType={selectedWeeklyStudyType} 
                />
              ) : (
                <div className="text-center py-5">
                  <div className="no-announcements">
                    <div className="icon"><i className="fas fa-bullhorn" /></div>
                    <h4 style={{ color: '#6c757d', marginBottom: '15px', fontWeight: '800' }}>
                      لا توجد بيانات للعرض
                    </h4>
                    <p style={{ color: '#adb5bd', margin: 0, fontSize: '1.1rem' }}>
                      تأكد من اختيار المرحلة ونوع الدراسة بشكل صحيح
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {(!selectedWeeklyStudyType || !selectedStage) && (
            <div className="text-center py-5" style={{
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '16px',
              border: '2px dashed #e1e8ed'
            }}>
              <div style={{
                fontSize: '4rem',
                color: '#6c757d',
                marginBottom: '20px'
              }}>📅</div>
              <h4 style={{ color: '#6c757d', marginBottom: '15px', fontWeight: '800' }}>
                يرجى اختيار نوع الدراسة والمرحلة
              </h4>
              <p style={{ color: '#adb5bd', margin: 0, fontSize: '1.1rem' }}>
                اختر نوع الدراسة والمرحلة لرؤية الجدول الأسبوعي الكامل
              </p>
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer style={{
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          borderTop: '2px solid #e9ecef',
          borderRadius: '0 0 16px 16px',
          padding: '20px 30px'
        }}>
          <Button 
            variant="secondary" 
            onClick={() => setShowWeeklyModal(false)}
            style={{
              background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
              borderColor: 'transparent',
              color: 'white',
              fontWeight: '600',
              padding: '12px 24px',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(108, 117, 125, 0.3)'
            }}
          >
            <i className="bi bi-x-circle me-2" />
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal البحث عن الطالب */}
      <Modal 
        show={showStudentFilterModal} 
        onHide={() => setShowStudentFilterModal(false)} 
        size="lg" 
        centered
        className="student-search-modal"
        contentClassName="student-search-modal-content"
        dialogClassName="modal-fullscreen-sm-down" // full screen on small devices for better readability
        style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        <Modal.Header 
          closeButton
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderBottom: 'none',
            borderRadius: '16px 16px 0 0',
            padding: '25px 30px 20px'
          }}
        >
          <Modal.Title style={{
            color: 'white',
            fontWeight: '800',
            fontSize: '1.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="fas fa-search" style={{ fontSize: '20px', color: 'white' }} />
            </div>
            البحث عن جدول الطالب
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body style={{
          padding: '30px',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
        }}>
          <div className="mb-4">
            <Form.Group>
              <Form.Label style={{ fontWeight: '600', color: '#495057', fontSize: '1.1rem' }}>
                <i className="bi bi-person-badge me-2" />
                أدخل رقم الطالب
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="مثال: 123456789"
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                style={{
                  borderRadius: '12px',
                  border: '2px solid #e9ecef',
                  padding: '15px 20px',
                  fontSize: '1.1rem',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
              />
            </Form.Group>
            
            {studentFilterError && (
              <div className="mt-3 p-3" style={{
                background: 'rgba(220, 53, 69, 0.1)',
                border: '1px solid rgba(220, 53, 69, 0.3)',
                borderRadius: '12px',
                color: '#721c24'
              }}>
                <i className="bi bi-exclamation-triangle me-2" />
                {studentFilterError}
              </div>
            )}
          </div>
          
          {studentModalSchedule && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
              border: '1px solid rgba(102, 126, 234, 0.1)'
            }}>
              <h5 style={{ color: '#495057', marginBottom: '20px', fontWeight: '700' }}>
                <i className="bi bi-calendar-check me-2" />
                جدول الطالب: {studentInfo?.full_name || studentInfo?.name || studentIdInput}
              </h5>
              
              {studentModalSchedule.length > 0 ? (
                <div className="row g-3">
                  {studentModalSchedule.filter(s => s.day === baghdadTodayKey).map((item, index) => (
                    <div className="col-12 student-schedule-card" key={index} style={{
                      background: 'rgba(248, 249, 250, 0.8)',
                      borderRadius: '12px',
                      padding: '15px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.transform = 'translateY(-4px)';
                       e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.transform = 'translateY(0)';
                       e.currentTarget.style.boxShadow = 'none';
                     }}>
                      {/* Header: Subject and Time (time moved inline to avoid overlapping) */}
                      <div className="d-flex justify-content-between align-items-center" style={{ width: '100%' }}>
                        <div style={{
                          fontWeight: '700',
                          fontSize: '1.1rem',
                          color: '#333',
                          marginBottom: '4px'
                        }}>
                          {item.subject}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '18px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 6px 18px rgba(102, 126, 234, 0.18)'
                          }}>
                            <i className="bi bi-clock" style={{ fontSize: '0.95rem' }} />
                            <span style={{ whiteSpace: 'nowrap' }}>{item.time}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="d-flex align-items-start gap-3" style={{ width: '100%' }}>
                        {/* Subject and Room */}
                        <div className="flex-grow-1">
                          <div style={{ marginTop: 6 }} />
                           <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                             القاعة: <strong style={{ color: '#1f2937' }}>{item.room} {item.room_code ? `(${item.room_code})` : ''}</strong>
                           </div>
                           {/* عرض الشعبة للنظري أو الكروب للعملي */}
                           {item.lecture_type === 'theoretical' && item.section && (
                             <div style={{ fontSize: '0.85rem', color: '#667eea', marginTop: '4px', fontWeight: '600' }}>
                               الشعبة: <strong>{item.section}</strong>
                             </div>
                           )}
                           {item.lecture_type === 'practical' && (item.group || item.group_letter) && (
                             <div style={{ fontSize: '0.85rem', color: '#dc3545', marginTop: '4px', fontWeight: '600' }}>
                               الكروب: <strong>{item.group || item.group_letter}</strong>
                             </div>
                           )}
                        </div>
                        
                        {/* Doctor and Type Badge */}
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'flex-end', 
                          gap: '4px'
                        }}>
                          <div style={{
                            fontSize: '0.9rem',
                            color: '#333',
                            fontWeight: '500'
                          }}>
                            {item.doctor}
                          </div>
                          
                          <div style={{
                            background: item.lecture_type === 'theoretical' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                            color: item.lecture_type === 'theoretical' ? '#007bff' : '#dc3545',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: `1px solid ${item.lecture_type === 'theoretical' ? 'rgba(52, 199, 89, 0.3)' : 'rgba(255, 59, 48, 0.3)'}`
                          }}>
                            <i className={`bi ${item.lecture_type === 'theoretical' ? 'bi-book' : 'bi-laptop'}`} style={{ fontSize: '1rem' }} />
                            {item.lecture_type === 'theoretical' ? 'نظري' : 'عملي'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4" style={{
                  background: 'rgba(248, 249, 250, 0.8)',
                  borderRadius: '12px',
                  border: '2px dashed #dee2e6'
                }}>
                  <div style={{
                    fontSize: '3rem',
                    color: '#6c757d',
                    marginBottom: '15px'
                  }}>📭</div>
                  <h5 style={{ color: '#6c757d', marginBottom: '10px', fontWeight: '700' }}>
                    لا يوجد جدول لهذا الطالب
                  </h5>
                  <p style={{ color: '#adb5bd', margin: 0 }}>
                    تأكد من صحة رقم الطالب أو تحقق من وجود جدول محدد له
                  </p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer style={{
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          borderTop: '2px solid #e9ecef',
          borderRadius: '0 0 16px 16px',
          padding: '20px 30px'
        }}>
          <div className={window.innerWidth <= 576 ? 'd-grid gap-2 w-100' : 'd-flex gap-2'}>
            <Button 
              variant="primary" 
              onClick={handleStudentSearch}
              disabled={!studentIdInput.trim()}
              className={window.innerWidth <= 576 ? 'w-100' : ''}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderColor: 'transparent',
                color: 'white',
                fontWeight: '600',
                padding: '12px 24px',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
              }}
            >
              <i className="bi bi-search me-2" />
              بحث
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={() => setShowStudentFilterModal(false)}
              className={window.innerWidth <= 576 ? 'w-100' : ''}
              style={{
                background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                borderColor: 'transparent',
                color: 'white',
                fontWeight: '600',
                padding: '12px 24px',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(108, 117, 125, 0.3)'
              }}
            >
              <i className="bi bi-x-circle me-2" />
              إغلاق
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Modal الإعلانات - Modern Enhanced Design */}
      <Modal 
        show={showAnnouncements} 
        onHide={() => setShowAnnouncements(false)} 
        size="lg" 
        centered
        style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        <Modal.Header 
          closeButton
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderBottom: 'none',
            borderRadius: '16px 16px 0 0',
            padding: '25px 30px 20px'
          }}
        >
          <Modal.Title style={{
            color: 'white',
            fontWeight: '800',
            fontSize: '1.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="fas fa-bullhorn" style={{ fontSize: '22px', color: 'white' }} />
            </div>
            إعلانات القسم
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '4px 10px',
              borderRadius: '15px',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}>
              {announcements.length} إعلان
            </div>
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body style={{
          padding: '30px',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          maxHeight: '70vh',
          overflowY: 'auto'
        }}>
          {annLoading ? (
            <div className="text-center py-5" style={{
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '16px',
              border: '2px dashed #e1e8ed'
            }}>
              <div className="text-center py-5" style={{ background:'rgba(255,255,255,0.8)', borderRadius:'16px', border:'2px dashed #e1e8ed' }}>
                <div style={{ width: '60px', height: '60px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 15px' }} className="ann-icon-circle">
                  <Spinner animation="border" variant="light" size="sm" />
                </div>
                <p style={{ color: '#6c757d', fontWeight: '600', margin: 0 }}>جاري تحميل الإعلانات...</p>
              </div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-5" style={{
              background: 'rgba(248, 249, 250, 0.8)',
              borderRadius: '20px',
              border: '3px dashed #dee2e6'
            }}>
              <div className="no-announcements">
                <div className="icon"><i className="fas fa-bullhorn" /></div>
                <h5 style={{ color: '#6c757d', marginBottom: '10px', fontWeight: '700' }}>لا توجد إعلانات حالياً</h5>
               
                <p style={{ color: '#adb5bd', margin: 0, fontSize: '0.95rem' }}>سيتم عرض الإعلانات الجديدة هنا عند توفرها</p>
              </div>
             </div>
          ) : (
            <div className="row g-4">
              {announcements.map((ann, index) => (
                <div className="col-12" key={ann.id} style={{
                  animation: `slideInModal 0.5s ease-out ${index * 0.1}s both`
                }}>
                  <div className="announcement-card" style={{ position:'relative', overflow:'hidden' }}>
                    {/* Header: Subject and Time (time moved inline to avoid overlapping) */}
                    <div className="d-flex justify-content-between align-items-center" style={{ width: '100%' }}>
                      <div style={{
                        fontWeight: '700',
                        fontSize: '1.1rem',
                        color: '#333',
                        marginBottom: '4px'
                      }}>
                        {ann.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '18px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 6px 18px rgba(102, 126, 234, 0.18)'
                        }}>
                          <i className="bi bi-clock" style={{ fontSize: '0.95rem' }} />
                          <span style={{ whiteSpace: 'nowrap' }}>{ann.time}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="d-flex align-items-start gap-3" style={{ width: '100%' }}>
                      {/* Subject and Room */}
                      <div className="flex-grow-1">
                        <div style={{ marginTop: 6 }} />
                         <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                         القاعة: <strong style={{ color: '#1f2937' }}>{ann.room} {ann.room_code ? `(${ann.room_code})` : ''}</strong>
                       </div>
                       {/* عرض الشعبة للنظري أو الكروب للعملي */}
                       {ann.lecture_type === 'theoretical' && ann.section && (
                         <div style={{ fontSize: '0.85rem', color: '#667eea', marginTop: '4px', fontWeight: '600' }}>
                           الشعبة: <strong>{ann.section}</strong>
                         </div>
                       )}
                       {ann.lecture_type === 'practical' && (ann.group || ann.group_letter) && (
                         <div style={{ fontSize: '0.85rem', color: '#dc3545', marginTop: '4px', fontWeight: '600' }}>
                           الكروب: <strong>{ann.group || ann.group_letter}</strong>
                         </div>
                       )}
                      </div>
                      
                      {/* Doctor and Type Badge */}
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'flex-end', 
                        gap: '4px'
                      }}>
                        <div style={{
                          fontSize: '0.9rem',
                          color: '#333',
                          fontWeight: '500'
                        }}>
                          {ann.doctor}
                        </div>
                        
                        <div style={{
                          background: ann.lecture_type === 'theoretical' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                          color: ann.lecture_type === 'theoretical' ? '#007bff' : '#dc3545',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          border: `1px solid ${ann.lecture_type === 'theoretical' ? 'rgba(52, 199, 89, 0.3)' : 'rgba(255, 59, 48, 0.3)'}`
                        }}>
                          <i className={`bi ${ann.lecture_type === 'theoretical' ? 'bi-book' : 'bi-laptop'}`} style={{ fontSize: '1rem' }} />
                          {ann.lecture_type === 'theoretical' ? 'نظري' : 'عملي'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer style={{
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          borderTop: '2px solid #e9ecef',
          borderRadius: '0 0 16px 16px',
          padding: '20px 30px'
        }}>
          <Button 
            variant="secondary" 
            onClick={() => setShowAnnouncements(false)}
            style={{
              background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
              borderColor: 'transparent',
              color: 'white',
              fontWeight: '600',
              padding: '12px 24px',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(108, 117, 125, 0.3)'
            }}
          >
            <i className="bi bi-x-circle me-2" />
            إغلاق
          </Button>
        </Modal.Footer>
        
        {/* Enhanced Modal Animations */}
        <style>{`
          @keyframes slideInModal {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.08);
            }
          }
        `}</style>
      </Modal>
    </Container>
    
    {/* Footer Component */}
    <Footer />
    </div>
  );
}

export default RoomSchedulePublic;