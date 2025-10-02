import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Form, Modal, Badge } from 'react-bootstrap';
import { schedulesAPI } from '../api/schedules';
import { getAuthHeaders } from '../utils/auth';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://hsabadi.pythonanywhere.com';

const General = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomSchedule, setRoomSchedule] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // تحديد يوم بغداد الحالي
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

  useEffect(() => {
    fetchDepartments();
    
    // إضافة أنماط CSS مخصصة
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      /* Page layout */
      .general-page {
        background: linear-gradient(180deg, #f4f7fb 0%, #eef3fb 100%);
        min-height: 100vh;
        padding: 2rem 0;
      }
      .general-card {
        border: 0;
        border-radius: 14px;
        box-shadow: 0 12px 30px rgba(37, 50, 75, 0.08);
        background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,250,255,0.9) 100%);
      }
      .general-header {
        background: linear-gradient(90deg, #1e88e5 0%, #6a11cb 100%);
        border-radius: 14px 14px 0 0;
        color: #fff;
        padding: 1.1rem 1.25rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .general-header .title {
        font-weight: 600;
        font-size: 1.25rem;
      }
      .general-header .subtitle {
        opacity: 0.9;
        font-size: 0.95rem;
      }

      /* Room card */
      .rooms-grid { display: grid; grid-template-columns: repeat(1, 1fr); gap: 1rem; }
      @media(min-width: 576px){ .rooms-grid { grid-template-columns: repeat(2, 1fr); } }
      @media(min-width: 992px){ .rooms-grid { grid-template-columns: repeat(3, 1fr); } }

      .room-card {
        border-radius: 12px;
        overflow: hidden;
        background: #fff;
        transition: transform .22s ease, box-shadow .22s ease;
        display: flex;
        flex-direction: column;
        min-height: 180px;
        padding: 1rem;
        border: 1px solid rgba(20,30,60,0.04);
      }
      .room-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 14px 30px rgba(34, 60, 80, 0.08);
      }
      .room-card .room-meta { display:flex; align-items:center; justify-content:space-between; gap: .6rem; }
      .room-card .room-title { font-size: 1.1rem; font-weight: 600; color: #1162b0; }
      .room-card .room-code { color: #6b7280; font-size: .9rem; }
      .room-card .room-actions { margin-top: auto; display:flex; gap:.6rem; }

      .btn-modern {
        background: linear-gradient(90deg,#6a11cb,#2575fc); color:white; border:0; padding: .6rem 1rem; border-radius:8px; display:inline-flex; align-items:center; gap:.6rem;
      }
      .btn-modern:focus{ box-shadow:0 6px 18px rgba(90,60,150,0.12); }

      /* Modal lecture styles */
      .lecture-list { display:flex; flex-direction:column; gap:.8rem; }
      .lecture-card { border-radius:10px; border:0; box-shadow:0 8px 20px rgba(25,35,60,0.05); padding: .9rem 1rem; background:#fff; margin-bottom:.8rem; display:flex; gap:12px; align-items:flex-start; }
      .order-badge { position:relative; width:40px; height:40px; border-radius:50%; background: linear-gradient(90deg,#6a11cb,#2575fc); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; box-shadow:0 6px 18px rgba(90,60,150,0.12); flex-shrink:0; line-height:1; }
      /* Small connector line to visually group items (subtle) — absolutely positioned so it doesn't affect centering */
      .order-badge::after { content: ''; position:absolute; bottom:-8px; left:50%; transform:translateX(-50%); width:2px; height:12px; background: rgba(16,24,40,0.06); border-radius:1px; }
      .lecture-meta { flex:1; display:flex; justify-content:space-between; gap:1rem; align-items:center; }
      .lecture-details { display:flex; gap:1rem; align-items:center; }
      .lecture-details .icon { font-size:1.15rem; color:#4b5563; }
      .badge-type { padding: .45rem .6rem; border-radius: 999px; font-weight:600; }

      @media(max-width: 576px) {
        .lecture-card { flex-direction: row-reverse; align-items:center; gap:10px; padding: .6rem; }
        .order-badge { width:32px; height:32px; font-size:0.9rem; }
        .order-badge::after { display:none; }
        .lecture-meta { flex-direction:column; align-items:stretch; gap: .6rem; }
        .lecture-details { gap:.6rem; }
        .lecture-details .icon { font-size:1rem; }
      }
      @media(max-width: 400px) {
        .order-badge { width:28px; height:28px; font-size:0.85rem; }
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      const existingStyle = document.head.querySelector('style');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await schedulesAPI.getDepartments();
      if (response.success) {
        setDepartments(response.data);
      } else {
        setError('فشل في جلب الأقسام');
      }
    } catch (err) {
      console.error('fetchDepartments error', err);
      if (err && (err.code === 'ECONNABORTED' || (err.message && err.message.toLowerCase().includes('aborted') || err.message && err.message.toLowerCase().includes('timeout')))) {
        setError('انتهى وقت الطلب. يرجى المحاولة مرة أخرى.');
      } else {
        setError('خطأ في جلب الأقسام');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentChange = async (e) => {
    const departmentId = e.target.value;
    setSelectedDepartment(departmentId);
    if (departmentId) {
      await fetchRooms(departmentId);
    } else {
      setRooms([]);
    }
  };

  const fetchRooms = async (departmentId) => {
    try {
      setLoading(true);
      const response = await schedulesAPI.searchRooms('', departmentId);
      if (response.success) {
        setRooms(response.data);
      } else {
        setError('فشل في جلب القاعات');
      }
    } catch (err) {
      console.error('fetchRooms error', err);
      if (err && (err.code === 'ECONNABORTED' || (err.message && err.message.toLowerCase().includes('aborted') || err.message && err.message.toLowerCase().includes('timeout')))) {
        setError('انتهى وقت الطلب أثناء جلب القاعات. حاول مرة أخرى.');
      } else {
        setError('خطأ في جلب القاعات');
      }
    } finally {
      setLoading(false);
    }
  };

  const viewTodayLectures = async (room) => {
    setSelectedRoom(room);
    setShowModal(true);
    setScheduleLoading(true);
    try {
      // Function to infer study type based on Baghdad local time
      const inferStudyType = () => {
        try {
          const baghdadNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Baghdad' }));
          const hour = baghdadNow.getHours();
          // Consider evening starting from 16:00 (4pm). Adjust as needed.
          return hour >= 16 ? 'evening' : 'morning';
        } catch (e) {
          return 'morning';
        }
      };

      const primaryType = inferStudyType();
      const secondaryType = primaryType === 'morning' ? 'evening' : 'morning';

      // First try the inferred study type
      let response = await schedulesAPI.getRoomSchedule(room.code, primaryType);
      // If the response doesn't contain schedule data, try the other study type
      if (!(response && response.success && response.data && response.data.schedule && Object.keys(response.data.schedule).length > 0)) {
        const fallback = await schedulesAPI.getRoomSchedule(room.code, secondaryType);
        if (fallback && fallback.success && fallback.data && fallback.data.schedule && Object.keys(fallback.data.schedule).length > 0) {
          response = fallback;
        }
      }

      if (response && response.success) {
        setRoomSchedule(response.data);
      } else {
        setError('فشل في جلب جدول القاعة');
      }
    } catch (err) {
      console.error('viewTodayLectures error', err);
      if (err && (err.code === 'ECONNABORTED' || (err.message && err.message.toLowerCase().includes('aborted') || err.message && err.message.toLowerCase().includes('timeout')))) {
        setError('انتهى وقت الطلب أثناء جلب جدول القاعة. يرجى المحاولة مرة أخرى.');
      } else {
        setError('خطأ في جلب جدول القاعة');
      }
    } finally {
      setScheduleLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRoom(null);
    setRoomSchedule(null);
  };

  // الحصول على المحاضرات اليومية
  const todayLectures = useMemo(() => {
    if (!roomSchedule || !baghdadTodayKey || !roomSchedule.schedule) return [];
    const dayData = roomSchedule.schedule[baghdadTodayKey] || {};
    const lectures = [];
    Object.keys(dayData).forEach(stage => {
      if (Array.isArray(dayData[stage])) {
        dayData[stage].forEach(lecture => {
          lectures.push({ ...lecture, stage });
        });
      }
    });
    const timeToSeconds = (t) => {
      if (!t) return 0;
      const parts = t.split(':');
      const hh = parseInt(parts[0], 10) || 0;
      const mm = parseInt(parts[1], 10) || 0;
      const ss = parseInt(parts[2], 10) || 0;
      return hh * 3600 + mm * 60 + ss;
    };

    return lectures.sort((a, b) => {
      const aStart = a.postponed_start_time || a.start_time || '';
      const bStart = b.postponed_start_time || b.start_time || '';
      return timeToSeconds(aStart) - timeToSeconds(bStart);
    });
  }, [roomSchedule, baghdadTodayKey]);

  return (
    <Container fluid className="general-page">
      <Row className="justify-content-center">
        <Col md={10}>
          <Card className="general-card">
            <Card.Header className="general-header">
              <h4 className="mb-0">صفحة عامة</h4>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">اختر القسم:</Form.Label>
                <Form.Select
                  value={selectedDepartment}
                  onChange={handleDepartmentChange}
                  disabled={loading}
                  className="form-control-lg"
                >
                  <option value="">اختر قسم...</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {loading && (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">جاري التحميل...</p>
                </div>
              )}

              {selectedDepartment && rooms.length > 0 && (
                <div>
                  <h5 className="mb-4">القاعات في هذا القسم:</h5>
                  <div className="rooms-grid">
                    {rooms.map(room => (
                      <div key={room.id} className="room-card">
                        <div className="room-meta">
                          <div>
                            <div className="room-title"><i className="fa fa-door-open me-2" aria-hidden="true"></i> {room.name}</div>
                            <div className="room-code">{room.code} • السعة: {room.capacity || '—'}</div>
                          </div>
                          <div className="text-end">
                            <div className="badge bg-light text-dark">{room.department?.name || 'عام'}</div>
                          </div>
                        </div>
                        <div style={{height:16}} />
                        <div className="room-actions">
                          <button className="btn-modern" onClick={() => viewTodayLectures(room)}>
                            <i className="fa fa-eye"/> <span>رؤية محاضرات اليوم</span>
                          </button>
                          <a className="btn btn-outline-secondary" href={`/room/${room.code}`}>
                            <i className="fa fa-external-link-alt"/> عرض القاعة
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDepartment && rooms.length === 0 && !loading && (
                <Alert variant="info" className="text-center">
                  لا توجد قاعات في هذا القسم
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal لعرض المحاضرات اليومية */}
      <Modal show={showModal} onHide={closeModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            محاضرات اليوم - {selectedRoom?.name} ({selectedRoom?.code})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {scheduleLoading ? (
            <div className="text-center">
              <Spinner animation="border" />
              <p>جاري تحميل الجدول...</p>
            </div>
          ) : todayLectures.length > 0 ? (
            <div>
              {todayLectures.map((lecture, index) => {
                // Determine displayed doctor name
                const doctorName = lecture.primary_doctor_name || lecture.doctor_name || (lecture.schedule_doctors && lecture.schedule_doctors.length ? (lecture.schedule_doctors[0].doctors && lecture.schedule_doctors[0].doctors.name) : null) || 'غير محدد';
                // Collect assistant doctors (non-primary)
                const assistantNames = (lecture.schedule_doctors || [])
                  .filter(sd => !sd.is_primary)
                  .map(sd => sd && sd.doctors && sd.doctors.name)
                  .filter(Boolean);
                // Map English stage keys to Arabic
                const stageKey = (lecture.stage || lecture.academic_stage || '').toString().toLowerCase();
                const stageArabicMap = { first: 'المرحلة الأولى', second: 'المرحلة الثانية', third: 'المرحلة الثالثة', fourth: 'المرحلة الرابعة' };
                const stageText = stageArabicMap[stageKey] || (lecture.stage || lecture.academic_stage || 'غير محدد');
                // Determine group/section display
                const groupText = lecture.group || lecture.group_letter || lecture.group_name || 'غير محدد';
                const sectionText = lecture.section || lecture.section_number || lecture.section_name || 'غير محدد';
                const typeIsTheoretical = lecture.lecture_type === 'theoretical';
                // Determine study time (morning/evening)
                const studyType = (roomSchedule && roomSchedule.study_type) || lecture.study_type || 'morning';
                return (
                 <div key={index} className="lecture-card">
                   <div className="order-badge">{index + 1}</div>
                   <div className="lecture-meta">
                     <div className="lecture-details">
                       <i className="fa fa-book icon" aria-hidden="true"></i>
                       <div>
                         <div style={{fontWeight:700}}>{lecture.subject_name || 'مادة غير محددة'}</div>
                        <div style={{color:'#6b7280', fontSize:'.95rem'}}>
                          <i className="fa fa-user me-2"></i> {doctorName}
                        </div>
                        {assistantNames.length > 0 && (
                          <div style={{color:'#6b7280', fontSize:'.9rem', marginTop:6}}>
                            <i className="fa fa-user-friends me-2" />
                            <strong>مساعدون:</strong> {assistantNames.join(', ')}
                          </div>
                        )}
                        <div style={{color:'#6b7280', fontSize:'.9rem', marginTop:4}}>
                          <i className="fa fa-layer-group me-2"></i>
                          {typeIsTheoretical ? `شعبة: ${sectionText}` : `كروب: ${groupText}`}
                        </div>
                       </div>
                     </div>
                     <div style={{textAlign:'right'}}>
                       <div style={{marginBottom:6}}><i className="fa fa-clock me-2"/> {lecture.start_time} - {lecture.end_time}</div>
                       <div style={{display:'flex', justifyContent:'flex-end', gap:10, alignItems:'center'}}>
                         <span className={`badge-type ${lecture.lecture_type === 'theoretical' ? 'bg-info text-white' : 'bg-success text-white'}`}>{lecture.lecture_type === 'theoretical' ? 'نظري' : 'عملي'}</span>
                         <span className="badge bg-secondary">{stageText}</span>
                         <span className={`badge ${studyType === 'morning' ? 'bg-warning text-dark' : 'bg-dark text-white'}`}>
                           <i className={`fa ${studyType === 'morning' ? 'fa-sun' : 'fa-moon'} me-1`}></i>
                           {studyType === 'morning' ? 'صباحي' : 'مسائي'}
                         </span>
                       </div>
                     </div>
                   </div>
                </div>
                );
               })}
            </div>
           ) : (
             <Alert variant="info">لا توجد محاضرات اليوم في هذه القاعة</Alert>
           )}
         </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default General;