import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { doctorsAPI } from '../api/doctors';
import { getAuthHeaders } from '../utils/auth'; // Assuming this is how auth headers are obtained
import { roomsAPI } from '../api/rooms';

const ManageDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorDepartment, setNewDoctorDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showLecturesModal, setShowLecturesModal] = useState(false);
  const [selectedDoctorLectures, setSelectedDoctorLectures] = useState([]);
  const [selectedDoctorName, setSelectedDoctorName] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editDoctorName, setEditDoctorName] = useState('');
  const [editDoctorDepartment, setEditDoctorDepartment] = useState('');
  const [selectedFilterDepartment, setSelectedFilterDepartment] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [fallbackTotal, setFallbackTotal] = useState(0);
  const [fallbackCompleted, setFallbackCompleted] = useState(0);

  // Helper: format time string HH:MM:SS or HH:MM into 12-hour format with Arabic AM/PM markers
  const formatTime12 = (t) => {
    if (!t) return '';
    const parts = String(t).split(':');
    const hhRaw = parseInt(parts[0], 10) || 0;
    const mm = (parts[1] || '00').slice(0,2).padStart(2,'0');
    const isPM = hhRaw >= 12;
    const period = isPM ? 'م' : 'ص';
    const hh = (hhRaw % 12) === 0 ? 12 : (hhRaw % 12);
    return `${hh}:${mm} ${period}`;
  };

  useEffect(() => {
    fetchDoctorsAndDepartments();

    // Inject modern styles for this page
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      /* Modern manage doctors styles */
      .desktop-only { display:block; }
      .mobile-only { display:none; }
      @media(max-width: 768px) {
        .desktop-only { display:none !important; }
        .mobile-only { display:block !important; }
      }
      .mobile-only .card { border-radius:12px; }
      .mobile-only .doctor-avatar { width:56px; height:56px; }
      .lectures-list .lecture-card { padding: 1rem; display:flex; align-items:center; gap:12px; border-radius:10px; }
      .lecture-left { order:1; align-self:flex-start; }
      .lecture-center { order:2; }
      .lecture-right { order:3; align-self:stretch; display:flex; justify-content:space-between; gap:8px; margin-top:8px; }
      .lecture-details { gap:10px; }
      .lecture-details span { display:inline-block; min-width:80px; }
      .lecture-index { font-weight:700; width:48px; height:48px; font-size:16px; }
      /* Rounded pill for lecture type (e.g., عملي) */
      .lecture-type-pill { border-radius: 999px; padding: .45rem .85rem; display:inline-block; }
      .badge-type, .badge-role { font-size: .95rem; }
      .mobile-only .btn-icon { width:44px; height:44px; display:inline-flex; align-items:center; justify-content:center; }
      .mobile-only .card .btn { min-width:44px; }
      @media(max-width:768px){
        /* Mobile layout improvements */
        .lectures-list .lecture-card { flex-direction:column; align-items:stretch; padding:1rem; gap:12px; }
        .lecture-left { order:1; align-self:flex-start; }
        .lecture-center { order:2; }
        .lecture-right { order:3; align-self:stretch; display:flex; justify-content:space-between; gap:8px; margin-top:8px; }
        .lecture-subject { font-size:1.05rem; white-space:normal; }
        .lecture-index { width:48px; height:48px; font-size:16px; }
        .doctor-avatar { width:56px; height:56px; }
        /* Make mobile action buttons larger and full width */
        .mobile-only .btn-icon { width:44px; height:44px; display:inline-flex; align-items:center; justify-content:center; }
        .mobile-only .card .btn { min-width:44px; }
        /* Touch targets and spacing */
        .lecture-details { gap:10px; }
        .badge-type, .lecture-type-pill { font-size: .95rem; padding: .45rem .85rem; }
        /* Make badges wrap and align in a neat column */
        .lecture-right { flex-direction:row; flex-wrap:wrap; gap:8px; }
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      const existing = document.head.querySelector('style');
      if (existing && existing.textContent.includes('Modern manage doctors styles')) existing.remove();
    };
  }, []);

  const fetchDoctorsAndDepartments = async () => {
    setLoading(true);
    setError('');
    try {
      const [doctorsResponse, departmentsResponse] = await Promise.all([
        doctorsAPI.getAllDoctors(),
        doctorsAPI.getDepartments()
      ]);
      setDoctors(doctorsResponse);
      setDepartments(departmentsResponse);
    } catch (err) {
      console.error("Failed to fetch doctors or departments:", err);
      setError('فشل في جلب بيانات الدكاترة أو الأقسام: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!newDoctorName.trim() || !newDoctorDepartment) {
      setError('الرجاء إدخال اسم الدكتور واختيار القسم.');
      setLoading(false);
      return;
    }

    try {
      await doctorsAPI.addDoctor({ name: newDoctorName, department_id: parseInt(newDoctorDepartment) });
      setSuccess('تم إضافة الدكتور بنجاح.');
      setNewDoctorName('');
      setNewDoctorDepartment('');
      setShowAddModal(false);
      fetchDoctorsAndDepartments(); // Refresh list
    } catch (err) {
      console.error("Failed to add doctor:", err);
      setError('فشل في إضافة الدكتور: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewLectures = async (doctorId, doctorName) => {
    setLoading(true);
    setError('');
    setSelectedDoctorLectures([]);
    setSelectedDoctorName(doctorName);
    setSelectedDoctorId(doctorId);
    try {
      // Ask backend to include lectures where doctor is assistant as well
      let res = await doctorsAPI.getDoctorLectures(doctorId, { includeAssistants: true });
      // Normalize response shape: backend may return array or { data: [] }
      let lectures = [];
      if (Array.isArray(res)) lectures = res;
      else if (res && Array.isArray(res.data)) lectures = res.data;

      // If backend returned nothing, fallback: scan room schedules for assistant entries
      if (!lectures || lectures.length === 0) {
        console.info(`No lectures returned for doctor ${doctorId} from /doctors endpoint — falling back to scanning room schedules for assistant entries.`);
        // Fetch rooms list then scan schedules with limited concurrency
        const roomsRes = await roomsAPI.getAllRooms();
        const roomsList = (roomsRes && roomsRes.data) ? roomsRes.data : (Array.isArray(roomsRes) ? roomsRes : []);
        const concurrency = 3;
        const found = [];
        let p = 0;
        // progress
        setIsScanning(true);
        setFallbackTotal(roomsList.length);
        setFallbackCompleted(0);
        const worker = async () => {
          while (true) {
            const i = p++;
            if (i >= roomsList.length) break;
            const room = roomsList[i];
            try {
              const r = await roomsAPI.getRoomSchedules(room.id);
              const arr = (r && r.data) ? r.data : (Array.isArray(r) ? r : []);
              if (Array.isArray(arr)) {
                arr.forEach(sch => {
                  try {
                    const scheduleDoctors = Array.isArray(sch.schedule_doctors) ? sch.schedule_doctors : (sch.schedule_doctors ? [sch.schedule_doctors] : []);
                    const matches = scheduleDoctors.some(sd => {
                      const sdId = sd && (sd.doctor_id || sd.doctors?.id || sd.doctors?.doctor_id || sd.id);
                      return String(sdId) === String(doctorId);
                    });
                    const primaryMatch = String(sch.doctor_id || sch.primary_doctor_id || '') === String(doctorId);
                    if (matches || primaryMatch) {
                      found.push({ ...sch, room_name: room.name, room_id: room.id });
                    }
                  } catch (e) { /* ignore per-schedule parse errors */ }
                });
              }
            } catch (e) {
              // If aborted or timeout, don't spam console
              const isAbort = e && (e.code === 'ECONNABORTED' || (e.message && e.message.toLowerCase().includes('aborted')));
              if (!isAbort) console.warn(`Failed to fetch schedules for room ${room.id} during fallback:`, e.message || e);
            } finally {
              // update progress per room processed
              setFallbackCompleted(prev => prev + 1);
            }
           }
         };
        const workers = Array.from({ length: Math.min(concurrency, roomsList.length) }, () => worker());
        await Promise.all(workers);
        setIsScanning(false);
        setFallbackTotal(0);
        setFallbackCompleted(0);
         lectures = found;
       }

      // Sort lectures: study_type (morning -> evening), then day_of_week (Sun..Sat), then start_time
      const studyOrder = { morning: 0, evening: 1, night: 2 };
      const dayOrder = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
      const toSeconds = (t) => {
        if (!t) return 0;
        const p = String(t).split(':');
        const hh = parseInt(p[0],10) || 0; const mm = parseInt(p[1],10) || 0; return hh*3600 + mm*60;
      };
      lectures.sort((a,b) => {
        const sa = (a.study_type||'').toString().toLowerCase();
        const sb = (b.study_type||'').toString().toLowerCase();
        const saOrd = studyOrder.hasOwnProperty(sa) ? studyOrder[sa] : 99;
        const sbOrd = studyOrder.hasOwnProperty(sb) ? studyOrder[sb] : 99;
        if (saOrd !== sbOrd) return saOrd - sbOrd;
        const da = (a.day_of_week||a.day||'').toString().toLowerCase();
        const db = (b.day_of_week||b.day||'').toString().toLowerCase();
        const ia = dayOrder.indexOf(da) === -1 ? 99 : dayOrder.indexOf(da);
        const ib = dayOrder.indexOf(db) === -1 ? 99 : dayOrder.indexOf(db);
        if (ia !== ib) return ia - ib;
        return toSeconds(a.start_time) - toSeconds(b.start_time);
      });
      setSelectedDoctorLectures(lectures);
      setShowLecturesModal(true);
    } catch (err) {
      console.error("Failed to fetch doctor lectures:", err);
      setError('فشل في جلب محاضرات الدكتور: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoctor = async (doctorId, doctorName) => {
    if (window.confirm(`هل أنت متأكد من حذف الدكتور "${doctorName}"؟\n\nتنبيه: لا يمكن حذف دكتور له محاضرات مخصصة.`)) {
      setLoading(true);
      setError('');
      try {
        await doctorsAPI.deleteDoctor(doctorId);
        setSuccess('تم حذف الدكتور بنجاح.');
        fetchDoctorsAndDepartments(); // Refresh list
      } catch (err) {
        console.error("Failed to delete doctor:", err);
        if (err.error === "Cannot delete doctor. Doctor has assigned schedules.") {
          setError('لا يمكن حذف الدكتور. يوجد محاضرات مخصصة لهذا الدكتور.');
        } else {
          setError('فشل في حذف الدكتور: ' + (err.error || err.message || 'خطأ غير معروف'));
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditDoctor = (doctor) => {
    setEditingDoctor(doctor);
    setEditDoctorName(doctor.name);
    setEditDoctorDepartment(doctor.department_id);
    setShowEditModal(true);
  };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!editDoctorName.trim() || !editDoctorDepartment) {
      setError('الرجاء إدخال اسم الدكتور واختيار القسم.');
      setLoading(false);
      return;
    }

    try {
      await doctorsAPI.updateDoctor(editingDoctor.id, {
        name: editDoctorName.trim(),
        department_id: editDoctorDepartment
      });
      setSuccess('تم تحديث بيانات الدكتور بنجاح.');
      setShowEditModal(false);
      setEditingDoctor(null);
      setEditDoctorName('');
      setEditDoctorDepartment('');
      fetchDoctorsAndDepartments(); // Refresh list
    } catch (err) {
      console.error("Failed to update doctor:", err);
      setError('فشل في تحديث بيانات الدكتور: ' + (err.error || err.message || 'خطأ غير معروف'));
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentName = (departmentId) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : 'غير محدد';
  };

  const days = {
    sunday: 'الأحد',
    monday: 'الاثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت'
  };

  // Map English stage keys to Arabic labels
  const stageArabicMap = { first: 'المرحلة الأولى', second: 'المرحلة الثانية', third: 'المرحلة الثالثة', fourth: 'المرحلة الرابعة' };

  // Derived filtered doctors list by selected department
  const filteredDoctors = selectedFilterDepartment && selectedFilterDepartment !== ''
    ? doctors.filter(d => String(d.department_id) === String(selectedFilterDepartment))
    : doctors;

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4 doctors-page-header">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <h2 className="mb-0">إدارة الدكاترة</h2>
              <Form.Select
                value={selectedFilterDepartment}
                onChange={(e) => setSelectedFilterDepartment(e.target.value)}
                style={{ width: 220 }}
              >
                <option value="">كل الأقسام</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </Form.Select>
              {selectedFilterDepartment && (
                <Button variant="outline-secondary" size="sm" onClick={() => setSelectedFilterDepartment('')}>مسح الفلتر</Button>
              )}
              <div style={{ fontSize: 14, color: '#6c757d' }}>
                {filteredDoctors.length} دكاترة
              </div>
            </div>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              إضافة دكتور جديد
            </Button>
          </div>

          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

          <Card>
            <Card.Header style={{ color: 'black' }}>قائمة الدكاترة</Card.Header>
            <Card.Body>
              {loading ? (
                <p>جاري التحميل...</p>
              ) : filteredDoctors.length === 0 ? (
                <Alert variant="info">لا يوجد دكاترة مضافون في هذا القسم.</Alert>
              ) : (
                <>
                  <div className="desktop-only">
                    <Table striped bordered hover responsive className="modern-table">
                      <thead>
                        <tr>
                          <th>الاسم</th>
                          <th>القسم</th>
                          <th>الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDoctors.map(doctor => (
                          <tr key={doctor.id}>
                            <td>
                              <div className="doctor-name-cell">
                                <div className="doctor-avatar">
                                  <i className="fa fa-user-md"></i>
                                </div>
                                <div>
                                  <div>{doctor.name}</div>
                                  <div style={{ fontSize: 12, color: '#6b7280' }}>{getDepartmentName(doctor.department_id)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="d-none d-md-table-cell">{getDepartmentName(doctor.department_id)}</td>
                            <td className="text-center actions-col">
                              <Button
                                variant="light"
                                size="sm"
                                onClick={() => handleViewLectures(doctor.id, doctor.name)}
                                className="btn-icon"
                                title="عرض المحاضرات"
                              >
                                <i className="fa fa-eye text-primary"></i>
                              </Button>
                              <Button
                                variant="light"
                                size="sm"
                                onClick={() => handleEditDoctor(doctor)}
                                className="btn-icon"
                                title="تعديل الدكتور"
                              >
                                <i className="fa fa-edit text-warning"></i>
                              </Button>
                              <Button
                                variant="light"
                                size="sm"
                                onClick={() => handleDeleteDoctor(doctor.id, doctor.name)}
                                disabled={loading}
                                className="btn-icon"
                                title="حذف الدكتور"
                              >
                                <i className="fa fa-trash text-danger"></i>
                              </Button>
                            </td>
                          </tr>
                         ))}
                      </tbody>
                    </Table>
                  </div>

                  {/* Mobile card list (shown only on small screens) */}
                  <div className="mobile-only">
                    <div style={{display:'grid', gap:12}}>
                      {filteredDoctors.map(doctor => (
                        <Card key={`mobile-${doctor.id}`} className="shadow-sm d-md-none">
                          <Card.Body style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{display:'flex', gap:12, alignItems:'center'}}>
                              <div className="doctor-avatar" style={{width:56,height:56}}><i className="fa fa-user-md"></i></div>
                              <div>
                                <div style={{fontWeight:700}}>{doctor.name}</div>
                                <div style={{fontSize:12, color:'#6b7280'}}>{getDepartmentName(doctor.department_id)}</div>
                              </div>
                            </div>
                            <div style={{display:'flex', gap:8}}>
                              <Button variant="light" size="sm" className="btn-icon" onClick={() => handleViewLectures(doctor.id, doctor.name)} title="عرض المحاضرات"><i className="fa fa-eye text-primary"></i></Button>
                              <Button variant="light" size="sm" className="btn-icon" onClick={() => handleEditDoctor(doctor)} title="تعديل"><i className="fa fa-edit text-warning"></i></Button>
                              <Button variant="light" size="sm" className="btn-icon" onClick={() => handleDeleteDoctor(doctor.id, doctor.name)} title="حذف"><i className="fa fa-trash text-danger"></i></Button>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Doctor Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>إضافة دكتور جديد</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddDoctor}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>اسم الدكتور</Form.Label>
              <Form.Control
                type="text"
                value={newDoctorName}
                onChange={(e) => setNewDoctorName(e.target.value)}
                placeholder="أدخل اسم الدكتور"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>القسم</Form.Label>
              <Form.Select
                value={newDoctorDepartment}
                onChange={(e) => setNewDoctorDepartment(e.target.value)}
                required
              >
                <option value="">اختر القسم</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              إلغاء
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'جاري الإضافة...' : 'إضافة'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* View Lectures Modal */}
      <Modal show={showLecturesModal} onHide={() => setShowLecturesModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>محاضرات الدكتور: {selectedDoctorName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading ? (
            <p>جاري تحميل المحاضرات...</p>
          ) : isScanning ? (
            <div>
              <p>جارٍ البحث عن محاضرات مساعدي الدكتور — الرجاء الانتظار...</p>
              <ProgressBar now={fallbackTotal ? (fallbackCompleted / fallbackTotal) * 100 : 0} label={`${fallbackCompleted}/${fallbackTotal}`} />
            </div>
          ) : selectedDoctorLectures.length === 0 ? (
            <Alert variant="info">لا توجد محاضرات مخصصة لهذا الدكتور.</Alert>
          ) : (
            <div className="lectures-list">
              {selectedDoctorLectures.map((lecture, idx) => {
                let role = 'غير محدد';
                try {
                  if (lecture.doctor_id && String(lecture.doctor_id) === String(selectedDoctorId)) {
                    role = 'أساسي';
                  } else if (Array.isArray(lecture.schedule_doctors) && lecture.schedule_doctors.some(sd => String(sd.doctor_id) === String(selectedDoctorId) && sd.is_primary)) {
                    role = 'أساسي';
                  } else if (Array.isArray(lecture.schedule_doctors) && lecture.schedule_doctors.some(sd => String(sd.doctor_id) === String(selectedDoctorId))) {
                    role = 'مساعد';
                  }
                } catch (_) {}

                const studyLabel = lecture.study_type === 'morning' ? 'صباحي' : 'مسائي';
                return (
                  <div className="lecture-card" key={lecture.id || idx}>
                    <div className="lecture-left" aria-hidden style={{display:'flex',alignItems:'center',justifyContent:'center',width:64}}>
                      <div className="lecture-index" style={{width:44,height:44,borderRadius:999,background:'linear-gradient(90deg,#6a11cb,#2575fc)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:16}}>{idx+1}</div>
                    </div>
                    <div className="lecture-center" style={{flex:1,minWidth:0}}>
                      <div className="lecture-subject" style={{fontWeight:700,fontSize:18,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={lecture.subject_name}>{lecture.subject_name}</div>
                      <div className="lecture-details" style={{color:'#6b7280',marginTop:8,display:'flex',flexWrap:'wrap',gap:12,alignItems:'center'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}><i className="fa fa-calendar-alt" aria-hidden="true"/><span style={{fontSize:13}}>{days[lecture.day_of_week]}</span></div>
                        <div style={{display:'flex',alignItems:'center',gap:8}}><i className="fa fa-clock" aria-hidden="true"/><span style={{fontSize:13}}>{formatTime12(lecture.start_time)} - {formatTime12(lecture.end_time)}</span></div>
                        <div style={{display:'flex',alignItems:'center',gap:8}}><i className="fa fa-door-open" aria-hidden="true"/><span style={{fontSize:13}}>{lecture.rooms ? lecture.rooms.code : 'غير محدد'}</span></div>
                      </div>
                      <div className="lecture-extra" style={{marginTop:10,display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
                        <div style={{fontSize:14}}><strong>الدور:</strong> <span className="badge-role">{role}</span></div>
                      </div>
                    </div>
                    <div className="lecture-right" style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8}}>
                      <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end'}}>
                        <span className={`badge-type lecture-type-pill ${lecture.lecture_type === 'theoretical' ? 'bg-info text-white' : 'bg-success text-white'}`} style={{padding:'.35rem .6rem'}}>{lecture.lecture_type === 'theoretical' ? 'نظري' : 'عملي'}</span>
                        <Badge bg="secondary" className="rounded-pill">{(stageArabicMap[(lecture.academic_stage || lecture.stage || '').toString().toLowerCase()] || lecture.academic_stage || lecture.stage || '—')}</Badge>
                        <Badge bg={studyLabel === 'صباحي' ? 'warning' : 'dark'} className="rounded-pill text-uppercase">{studyLabel}</Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLecturesModal(false)}>
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>تعديل بيانات الدكتور</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateDoctor}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>اسم الدكتور</Form.Label>
              <Form.Control
                type="text"
                value={editDoctorName}
                onChange={(e) => setEditDoctorName(e.target.value)}
                placeholder="أدخل اسم الدكتور"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>القسم</Form.Label>
              <Form.Select
                value={editDoctorDepartment}
                onChange={(e) => setEditDoctorDepartment(e.target.value)}
                required
              >
                <option value="">اختر القسم</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              إلغاء
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'جاري التحديث...' : 'تحديث'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ManageDoctors;
