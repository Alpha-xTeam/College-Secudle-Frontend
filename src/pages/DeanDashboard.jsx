import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';
import { getAuthHeaders, getUserRole } from '../utils/auth';
import { roomsAPI } from '../api/rooms'; // Add this import
import Footer from '../components/Footer';

const API_URL_GLOBAL = process.env.REACT_APP_API_URL;

const DeanDashboard = () => {
  const [statistics, setStatistics] = useState({});
  const [departments, setDepartments] = useState([]);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showEditDeptModal, setShowEditDeptModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastFetch, setLastFetch] = useState(0);
  const [editingDept, setEditingDept] = useState(null);
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [annForm, setAnnForm] = useState({ title: '', body: '', starts_at: '', expires_at: '' });
  const [showEditAnnModal, setShowEditAnnModal] = useState(false);
  const [editingAnn, setEditingAnn] = useState(null);
  const [editAnnForm, setEditAnnForm] = useState({ title: '', body: '', starts_at: '', expires_at: '', is_active: true });

  // New state for temporary booking
  const [showTempBookingModal, setShowTempBookingModal] = useState(false);
  const [tempBookingForm, setTempBookingForm] = useState({
      original_schedule_id: '', // Add this field
      room_id: '',
      booking_date: '', // YYYY-MM-DD
      day_of_week: '', // Will be derived or selected
      start_time: '',   // HH:MM
      end_time: '',     // HH:MM
      subject_name: '',
      instructor_name: '',
      notes: ''
  });
  const [rooms, setRooms] = useState([]); // To populate room dropdown
  const [schedules, setSchedules] = useState([]); // To store all schedules

  const [showConflictResolutionModal, setShowConflictResolutionModal] = useState(false);
  const [conflictingLectureDetails, setConflictingLectureDetails] = useState(null);
  const [relocationForm, setRelocationForm] = useState({
      schedule_id: '',
      room_id: '',
      booking_date: '',
      start_time: '',
      end_time: ''
  });

  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    description: ''
  });

  const currentUserRole = getUserRole(); // Get current user role

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = useCallback(async () => {
    // منع تكرار الطلبات خلال فترة قصيرة
    // const API_URL = API_URL_GLOBAL;
      const headers = getAuthHeaders();
      try {
      // First get rooms to use for fetching schedules
      const roomsRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/rooms`, { headers });
      setRooms(roomsRes.data.data);
      
      // Fetch schedules for all rooms
      const schedulesPromises = roomsRes.data.data.map(room => 
        roomsAPI.getRoomSchedules(room.id)
      );
      
      // Wait for all schedule requests to complete
      const schedulesResults = await Promise.all(schedulesPromises);
      
      // Flatten all schedules into a single array
      const allSchedules = schedulesResults.flatMap((result, index) => {
        const roomId = roomsRes.data.data[index].id;
        const roomName = roomsRes.data.data[index].name;
        return result.data.map(schedule => ({
          ...schedule,
          room_name: roomName,
          room_id: roomId
        }));
      });
      
      // Fetch other data
      const [statsRes, deptsRes, annsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/dean/statistics`, { headers }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/dean/departments`, { headers }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/dean/announcements`, { headers })
      ]);

      setStatistics(statsRes.data.data);
      setDepartments(deptsRes.data.data);
      setAnnouncements(annsRes.data.data || []);
      setSchedules(allSchedules); // Set schedules data
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('فشل في جلب البيانات');
    }
  }, [lastFetch]);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
  // const API_URL = API_URL_GLOBAL;
  const headers = getAuthHeaders();
      const payload = { title: annForm.title, body: annForm.body };
      if (annForm.starts_at) payload.starts_at = annForm.starts_at;
      if (annForm.expires_at) payload.expires_at = annForm.expires_at;
      await axios.post(`${process.env.REACT_APP_API_URL}/api/dean/announcements`, payload, { headers });
      setSuccess('تم نشر الإعلان العام');
      setShowAnnModal(false);
      setAnnForm({ title: '', body: '', expires_at: '' });
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'فشل في نشر الإعلان');
    }
  };

  const openEditAnnouncement = (ann) => {
    setEditingAnn(ann);
    setEditAnnForm({
      title: ann.title || '',
      body: ann.body || '',
      starts_at: (ann.starts_at || '').slice(0,16),
      expires_at: (ann.expires_at || '').slice(0,16),
      is_active: !!ann.is_active
    });
    setShowEditAnnModal(true);
  };

  const handleUpdateAnnouncement = async (e) => {
    e.preventDefault();
    if (!editingAnn) return;
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
      const headers = getAuthHeaders();
      const payload = {
        title: editAnnForm.title,
        body: editAnnForm.body,
        is_active: editAnnForm.is_active
      };
      if (editAnnForm.starts_at) payload.starts_at = editAnnForm.starts_at;
      if (editAnnForm.expires_at) payload.expires_at = editAnnForm.expires_at;
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/api/dean/announcements/${editingAnn.id}`, payload, { headers });
      if (res.data?.success) {
        setSuccess('تم تحديث الإعلان العام');
        setShowEditAnnModal(false);
        setEditingAnn(null);
        fetchData();
      } else {
        setError(res.data?.message || 'فشل في تحديث الإعلان');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'فشل في تحديث الإعلان');
    }
  };

  const handleDeleteAnnouncement = async (annId) => {
    if (!window.confirm('هل تريد حذف هذا الإعلان؟')) return;
    try {
  const headers = getAuthHeaders();
  const res = await axios.delete(`${process.env.REACT_APP_API_URL}/api/dean/announcements/${annId}`, { headers });
      if (res.data?.success) {
        setSuccess('تم حذف الإعلان');
        fetchData();
      } else {
        setError(res.data?.message || 'فشل في حذف الإعلان');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'فشل في حذف الإعلان');
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
  const headers = getAuthHeaders();
      
  await axios.post(`${process.env.REACT_APP_API_URL}/api/dean/departments`, deptForm, { headers });
      
      setSuccess('تم إنشاء القسم بنجاح');
      setShowDeptModal(false);
      setDeptForm({ name: '', code: '', description: '' });
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'فشل في إنشاء القسم');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDepartment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
  const headers = getAuthHeaders();
      
  await axios.put(`${process.env.REACT_APP_API_URL}/api/dean/departments/${editingDept.id}`, deptForm, { headers });
      
      setSuccess('تم تحديث القسم بنجاح');
      setShowEditDeptModal(false);
      setEditingDept(null);
      setDeptForm({ name: '', code: '', description: '' });
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'فشل في تحديث القسم');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (deptId, deptName) => {
    if (window.confirm(`هل أنت متأكد من حذف قسم "${deptName}"? 
سيتم حذف جميع البيانات المرتبطة بهذا القسم.`)) {
      try {
  const headers = getAuthHeaders();
        
  await axios.delete(`${process.env.REACT_APP_API_URL}/api/dean/departments/${deptId}`, { headers });
        setSuccess('تم حذف القسم بنجاح');
        fetchData();
      } catch (error) {
        setError(error.response?.data?.message || 'فشل في حذف القسم');
      }
    }
  };

  const openEditDeptModal = (dept) => {
    setEditingDept(dept);
    setDeptForm({
      name: dept.name,
      code: dept.code,
      description: dept.description || ''
    });
    setShowEditDeptModal(true);
  };

  // New handlers for temporary booking
  const handleTempBookingChange = (e) => {
    setTempBookingForm({
        ...tempBookingForm,
        [e.target.name]: e.target.value
    });
    // If booking_date changes, update day_of_week
    if (e.target.name === 'booking_date' && e.target.value) {
        const date = new Date(e.target.value);
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        setTempBookingForm(prev => ({ ...prev, day_of_week: days[date.getDay()] }));
    }
  };

  const handleCreateTempBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
        const headers = getAuthHeaders();
        
        // Validate that an original schedule is selected
        if (!tempBookingForm.original_schedule_id) {
            setError('يرجى اختيار الجدول الأصلي الذي سيتم نقله مؤقتاً');
            setLoading(false);
            return;
        }
        
        const payload = { 
            original_schedule_id: tempBookingForm.original_schedule_id,
            room_id: tempBookingForm.room_id,
            day_of_week: tempBookingForm.day_of_week,
            temporary_start_time: tempBookingForm.start_time,
            temporary_end_time: tempBookingForm.end_time,
            subject_name: tempBookingForm.subject_name,
            instructor_name: tempBookingForm.instructor_name,
            notes: tempBookingForm.notes,
        };

        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/dean/temporary-schedule`, payload, { headers });
        
        if (response.data.success) {
            setSuccess(response.data.message);
            setShowTempBookingModal(false);
            // Reset form
            setTempBookingForm({
                original_schedule_id: '',
                room_id: '', booking_date: '', day_of_week: '',
                start_time: '', end_time: '', subject_name: '',
                instructor_name: '', notes: ''
            });
            fetchData(); // Refresh data
        } else {
            setError(response.data.message || 'فشل في إنشاء الحجز المؤقت');
        }
    } catch (error) {
        console.error("Temporary booking error:", error);
        if (error.response && error.response.status === 409) {
            const conflictingSchedule = error.response.data.data.conflicting_schedule;
            setConflictingLectureDetails(conflictingSchedule);
            setRelocationForm({
                schedule_id: conflictingSchedule.id,
                room_id: '', // User will select new room
                booking_date: '', // User will select new date
                start_time: '', // User will select new start time
                end_time: '' // User will select new end time
            });
            setShowConflictResolutionModal(true);
            setError(error.response.data.message); // Display conflict message
        } else {
            setError(error.response?.data?.message || 'حدث خطأ في الاتصال');
        }
    } finally {
        setLoading(false);
    }
  };

  const handleRelocationChange = (e) => {
    setRelocationForm({
        ...relocationForm,
        [e.target.name]: e.target.value
    });
  };

  const handleRelocateConflictingLecture = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
        const headers = getAuthHeaders();
        const payload = {
            room_id: relocationForm.room_id,
            booking_date: relocationForm.booking_date,
            start_time: relocationForm.start_time,
            end_time: relocationForm.end_time,
            // The backend will need to know which schedule to update.
            // We'll send the original schedule's ID.
            schedule_id: relocationForm.schedule_id
        };

        // Assuming there's an API endpoint to update a schedule by ID
        // This might be a PUT request to /api/schedules/<schedule_id> or similar
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/dean/schedules/${relocationForm.schedule_id}`, payload, { headers });

        if (response.data.success) {
            setSuccess(response.data.message);
            setShowConflictResolutionModal(false);
            // Reset forms and refresh data
            setTempBookingForm({
                room_id: '', booking_date: '', day_of_week: '',
                start_time: '', end_time: '', subject_name: '',
                instructor_name: '', notes: ''
            });
            setRelocationForm({
                schedule_id: '', room_id: '', booking_date: '', start_time: '', end_time: ''
            });
            fetchData();
        } else {
            setError(response.data.message || 'فشل في نقل المحاضرة');
        }
    } catch (error) {
        console.error("Relocation error:", error);
        setError(error.response?.data?.message || 'حدث خطأ في الاتصال أثناء نقل المحاضرة');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div>
      <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary mb-3">
            <i className="fas fa-tachometer-alt me-2"></i>
            لوحة تحكم العميد
          </h2>
          <div className="mb-3">
            <Button variant="outline-primary" onClick={() => setShowAnnModal(true)}>
              <i className="fas fa-megaphone me-2"></i>
              إعلانات عامة
            </Button>
          
          </div>
          
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')} className="rounded-3">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess('')} className="rounded-3">
              <i className="fas fa-check-circle me-2"></i>
              {success}
            </Alert>
          )}
        </Col>
      </Row>

      {/* الإحصائيات */}
      <Row className="mb-4 g-3">
        <Col xs={12} sm={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm bg-primary text-white">
            <Card.Body className="text-center">
              <i className="fas fa-building fa-2x mb-2"></i>
              <h4>{statistics.total_departments}</h4>
              <p className="mb-0">إجمالي الأقسام</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm bg-success text-white">
            <Card.Body className="text-center">
              <i className="fas fa-users fa-2x mb-2"></i>
              <h4>{statistics.total_users}</h4>
              <p className="mb-0">إجمالي المستخدمين</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm bg-info text-white">
            <Card.Body className="text-center">
              <i className="fas fa-door-open fa-2x mb-2"></i>
              <h4>{statistics.total_rooms}</h4>
              <p className="mb-0">إجمالي القاعات</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm bg-warning text-dark">
            <Card.Body className="text-center">
              <i className="fas fa-user-tie fa-2x mb-2"></i>
              <h4>{statistics.department_heads}</h4>
              <p className="mb-0">رؤساء الأقسام</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* الأقسام */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light border-0 d-flex flex-column flex-md-row justify-content-between align-items-center">
              <h5 className="mb-2 mb-md-0" style={{ color: '#111827' }}>
                <i className="fas fa-building me-2 text-primary"></i>
                الأقسام
              </h5>
              <Button 
                variant="primary" 
                onClick={() => setShowDeptModal(true)}
                className="rounded-3"
              >
                <i className="fas fa-plus me-2"></i>
                إضافة قسم جديد
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table className="mb-0" striped hover>
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0">اسم القسم</th>
                      <th className="border-0 d-none d-md-table-cell">الرمز</th>
                      <th className="border-0 d-none d-lg-table-cell">الوصف</th>
                      <th className="border-0">الحالة</th>
                      <th className="border-0 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map(dept => (
                      <tr key={dept.id}>
                        <td className="fw-bold">{dept.name}</td>
                        <td className="d-none d-md-table-cell">
                          <Badge bg="secondary" className="rounded-pill">{dept.code}</Badge>
                        </td>
                        <td className="d-none d-lg-table-cell text-muted">{dept.description}</td>
                        <td>
                          <Badge bg={dept.is_active ? 'success' : 'danger'} className="rounded-pill">
                            {dept.is_active ? '✓ نشط' : '✗ غير نشط'}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <div className="d-flex gap-2 justify-content-center">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => openEditDeptModal(dept)}
                              className="rounded-3"
                              title="تعديل القسم"
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                              className="rounded-3"
                              title="حذف القسم"
                            >
                              <i className="fas fa-trash"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* مودال إضافة قسم */}
      {/* مودال الإعلانات العامة */}
      <Modal show={showAnnModal} onHide={() => setShowAnnModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>الإعلانات العامة للأقسام</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateAnnouncement} className="mb-4">
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Label>عنوان الإعلان</Form.Label>
                <Form.Control placeholder="مثال: إعلان عام" value={annForm.title} onChange={(e)=>setAnnForm({...annForm, title: e.target.value})} required />
              </Col>
              <Col md={4}>
                <Form.Label>نص الإعلان</Form.Label>
                <Form.Control placeholder="نص مختصر" value={annForm.body} onChange={(e)=>setAnnForm({...annForm, body: e.target.value})} required />
              </Col>
              <Col md={2}>
                <Form.Label>بداية الإعلان</Form.Label>
                <Form.Control type="datetime-local" value={annForm.starts_at} onChange={(e)=>setAnnForm({...annForm, starts_at: e.target.value})} />
              </Col>
              <Col md={2}>
                <Form.Label>انتهاء الإعلان</Form.Label>
                <Form.Control type="datetime-local" value={annForm.expires_at} onChange={(e)=>setAnnForm({...annForm, expires_at: e.target.value})} />
              </Col>
              <Col md={1} className="text-end">
                <Button type="submit" variant="primary" className="w-100">نشر</Button>
              </Col>
            </Row>
          </Form>

          <div className="row g-3">
            {announcements.map((a)=> (
              <div className="col-12" key={a.id}>
                <Card className="border-0 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h5 className="mb-1 fw-bold">{a.title}</h5>
                        <div className="text-muted" style={{fontSize:12}}>
                          {(a.starts_at || a.created_at || '').slice(0,16).replace('T',' ')}
                          {a.expires_at ? ` • حتى ${(a.expires_at || '').slice(0,16).replace('T',' ')}` : ''}
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <Button variant="outline-secondary" size="sm" onClick={() => openEditAnnouncement(a)}>تعديل</Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteAnnouncement(a.id)}>حذف</Button>
                      </div>
                    </div>
                    <div style={{ whiteSpace:'pre-wrap' }} className="mt-2">{a.body}</div>
                  </Card.Body>
                </Card>
              </div>
            ))}
            {announcements.length===0 && (
              <Alert variant="info" className="mb-0">لا توجد إعلانات حالياً</Alert>
            )}
          </div>
        </Modal.Body>
      </Modal>

      {/* مودال تعديل إعلان عام */}
      <Modal show={showEditAnnModal} onHide={() => setShowEditAnnModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>تعديل الإعلان العام</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateAnnouncement}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={12}>
                <Form.Label>عنوان الإعلان</Form.Label>
                <Form.Control value={editAnnForm.title} onChange={(e)=>setEditAnnForm({...editAnnForm, title: e.target.value})} required />
              </Col>
              <Col md={12}>
                <Form.Label>نص الإعلان</Form.Label>
                <Form.Control value={editAnnForm.body} onChange={(e)=>setEditAnnForm({...editAnnForm, body: e.target.value})} required />
              </Col>
              <Col md={6}>
                <Form.Label>بداية الإعلان</Form.Label>
                <Form.Control type="datetime-local" value={editAnnForm.starts_at} onChange={(e)=>setEditAnnForm({...editAnnForm, starts_at: e.target.value})} />
              </Col>
              <Col md={6}>
                <Form.Label>انتهاء الإعلان</Form.Label>
                <Form.Control type="datetime-local" value={editAnnForm.expires_at} onChange={(e)=>setEditAnnForm({...editAnnForm, expires_at: e.target.value})} />
              </Col>
              <Col md={12}>
                <Form.Check
                  type="switch"
                  id="ann-active-switch-global"
                  label="نشط"
                  checked={editAnnForm.is_active}
                  onChange={(e)=>setEditAnnForm({...editAnnForm, is_active: e.target.checked})}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={()=>setShowEditAnnModal(false)}>إلغاء</Button>
            <Button variant="success" type="submit">حفظ</Button>
          </Modal.Footer>
        </Form>
      </Modal>
      <Modal show={showDeptModal} onHide={() => setShowDeptModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>إضافة قسم جديد</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateDepartment}> 
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>اسم القسم</Form.Label>
              <Form.Control
                type="text"
                value={deptForm.name}
                onChange={(e) => setDeptForm({...deptForm, name: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>رمز القسم</Form.Label>
              <Form.Control
                type="text"
                value={deptForm.code}
                onChange={(e) => setDeptForm({...deptForm, code: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>الوصف</Form.Label>
              <Form.Control
                as="textarea"
                value={deptForm.description}
                onChange={(e) => setDeptForm({...deptForm, description: e.target.value})}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeptModal(false)}>
              إلغاء
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              إنشاء القسم
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* مودال تعديل قسم */}
      <Modal show={showEditDeptModal} onHide={() => {
        setShowEditDeptModal(false);
        setEditingDept(null);
        setDeptForm({ name: '', code: '', description: '' });
      }}>
        <Modal.Header closeButton>
          <Modal.Title>تعديل القسم</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditDepartment}> 
          <Modal.Body>
            <Alert variant="info" className="mb-3">
              <i className="fas fa-info-circle me-2"></i>
              تعديل معلومات القسم: <strong>{editingDept?.name}</strong>
            </Alert>
            <Form.Group className="mb-3">
              <Form.Label>اسم القسم</Form.Label>
              <Form.Control
                type="text"
                value={deptForm.name}
                onChange={(e) => setDeptForm({...deptForm, name: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>رمز القسم</Form.Label>
              <Form.Control
                type="text"
                value={deptForm.code}
                onChange={(e) => setDeptForm({...deptForm, code: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>الوصف</Form.Label>
              <Form.Control
                as="textarea"
                value={deptForm.description}
                onChange={(e) => setDeptForm({...deptForm, description: e.target.value})}
                rows={3}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => {
              setShowEditDeptModal(false);
              setEditingDept(null);
              setDeptForm({ name: '', code: '', description: '' });
            }}>
              إلغاء
            </Button>
            <Button variant="success" type="submit" disabled={loading}>
              <i className="fas fa-save me-2"></i>
              حفظ التعديلات
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

    

      {/* Conflict Resolution Modal */}
      <Modal show={showConflictResolutionModal} onHide={() => setShowConflictResolutionModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>حل تعارض الجدول</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRelocateConflictingLecture}>
          <Modal.Body>
            {conflictingLectureDetails && (
              <Alert variant="warning">
                <p>يوجد تعارض مع المحاضرة التالية:</p>
                <ul>
                  <li>المادة: <strong>{conflictingLectureDetails.subject_name}</strong></li>
                  <li>المحاضر: <strong>{conflictingLectureDetails.instructor_name}</strong></li>
                  <li>القاعة الأصلية: <strong>{conflictingLectureDetails.room_name}</strong></li> {/* Assuming room_name is available or can be fetched */}
                  <li>اليوم: <strong>{conflictingLectureDetails.day_of_week}</strong></li>
                  <li>الوقت: <strong>{conflictingLectureDetails.start_time} - {conflictingLectureDetails.end_time}</strong></li>
                </ul>
                <p>يرجى تحديد قاعة وتاريخ ووقت جديدين لنقل هذه المحاضرة:</p>
              </Alert>
            )}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>القاعة الجديدة</Form.Label>
                  <Form.Select
                    name="room_id"
                    value={relocationForm.room_id}
                    onChange={handleRelocationChange}
                    required
                  >
                    <option value="">اختر قاعة</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>{room.name} ({room.code})</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>تاريخ النقل</Form.Label>
                  <Form.Control
                    type="date"
                    name="booking_date"
                    value={relocationForm.booking_date}
                    onChange={handleRelocationChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>وقت البدء الجديد</Form.Label>
                  <Form.Control
                    type="time"
                    name="start_time"
                    value={relocationForm.start_time}
                    onChange={handleRelocationChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>وقت الانتهاء الجديد</Form.Label>
                  <Form.Control
                    type="time"
                    name="end_time"
                    value={relocationForm.end_time}
                    onChange={handleRelocationChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConflictResolutionModal(false)}>
              إلغاء
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'جاري النقل...' : 'تأكيد النقل'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      </Container>
      
      {/* Footer Component */}
      <Footer />
    </div>
  );
};

export default DeanDashboard;
