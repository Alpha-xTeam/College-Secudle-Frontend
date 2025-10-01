import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { roomsAPI } from '../api/rooms';
import axios from 'axios';
import { getAuthHeaders, getUserRole, getUserDepartment } from '../utils/auth';

const ManageRooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printQRUrl, setPrintQRUrl] = useState('');
  const printImgRef = useRef(null);
  const [showGeneralUploadModal, setShowGeneralUploadModal] = useState(false); // State for general upload modal
  const [generalUploadLoading, setGeneralUploadLoading] = useState(false); // State for general upload loading
  const [generalUploadResults, setGeneralUploadResults] = useState(null); // State for general upload results

  // الحصول على دور المستخدم والقسم المرتبط به
  const userRole = getUserRole();
  const userDepartmentId = getUserDepartment();

  const [roomForm, setRoomForm] = useState({
    name: '',
    code: '',
    department_id: (userRole === 'department_head' || userRole === 'supervisor') ? userDepartmentId : '',
    capacity: '',
    description: ''
  });

  useEffect(() => {
    const fetchData = async () => {
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

        // جلب القاعات حسب دور المستخدم
        let roomsRes;
        if (userRole === 'dean') {
          // العميد يستخدم getAllRooms للحصول على جميع القاعات
          roomsRes = await roomsAPI.getAllRooms();
        } else {
          // رئيس القسم والمشرف يستخدمون getRooms للحصول على قاعات قسمهم
          roomsRes = await roomsAPI.getRooms();
        }
        
        if (roomsRes.success) {
          setRooms(roomsRes.data);
        }

        // جلب الأقسام فقط للعميد
        if (userRole === 'dean') {
          const deptsRes = await axios.get(`${API_URL}/api/dean/departments`, { headers });
          if (deptsRes.data.success) {
            setDepartments(deptsRes.data.data);
          }
        }
      } catch (error) {
        setError('فشل في جلب البيانات');
      }
    };

    fetchData();
  }, [userRole]); // إعادة تحميل البيانات عند تغيير دور المستخدم

  const refetchData = async () => {
    try {
      let roomsRes;
      if (userRole === 'dean') {
        // العميد يستخدم getAllRooms للحصول على جميع القاعات
        roomsRes = await roomsAPI.getAllRooms();
      } else {
        // رئيس القسم والمشرف يستخدمون getRooms للحصول على قاعات قسمهم
        roomsRes = await roomsAPI.getRooms();
      }
      
      if (roomsRes.success) {
        setRooms(roomsRes.data);
      }
    } catch (error) {
      setError('فشل في إعادة تحميل البيانات');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingRoom) {
        const response = await roomsAPI.updateRoom(editingRoom.id, roomForm);
        if (response.success) {
          setSuccess('تم تحديث القاعة بنجاح');
        }
      } else {
        const response = await roomsAPI.createRoom(roomForm);
        if (response.success) {
          setSuccess('تم إنشاء القاعة بنجاح! يمكنك الآن إضافة الجدول الدراسي من خلال زر "إدارة الجدول"');
        }
      }

      setShowModal(false);
      resetForm();
      refetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'فشل في حفظ القاعة');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setRoomForm({
      name: room.name,
      code: room.code,
      department_id: room.department_id,
      capacity: room.capacity || '',
      description: room.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (roomId) => {
    if (window.confirm('هل أنت متأكد من حذف هذه القاعة؟ سيتم حذف جميع الجداول المرتبطة بها.')) {
      try {
        const response = await roomsAPI.deleteRoom(roomId);
        if (response.success) {
          setSuccess('تم حذف القاعة بنجاح');
          refetchData();
        }
      } catch (error) {
        setError('فشل في حذف القاعة');
      }
    }
  };

  const resetForm = () => {
    setRoomForm({
      name: '',
      code: '',
      department_id: userRole === 'department_head' ? userDepartmentId : '',
      capacity: '',
      description: ''
    });
    setEditingRoom(null);
  };

  const handleManageSchedule = (roomId) => {
    navigate(`/edit-schedule/${roomId}`);
  };

  const downloadQR = async (roomCode) => {
    try {
      const blob = await roomsAPI.downloadQR(roomCode);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `room_${roomCode}_qr.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('فشل في تحميل QR Code');
    }
  };

  const viewQR = async (roomId) => {
    try {
      const blob = await roomsAPI.getRoomQR(roomId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('فشل في عرض QR Code');
    }
  };

  // طباعة QR Code
  const printQR = async (roomId) => {
    try {
      const blob = await roomsAPI.getRoomQR(roomId);
      const url = window.URL.createObjectURL(blob);
      setPrintQRUrl(url);
      setShowPrintModal(true);
    } catch (error) {
      setError('فشل في طباعة QR Code');
    }
  };

  const handlePrint = () => {
    if (printQRUrl) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html><head><title>طباعة QR Code</title>
        <script>
          window.onload = function() { window.print(); };
        </script>
        </head><body style='text-align:center;padding:40px;'>
          <img src='${printQRUrl}' style='max-width:400px;'/>
        </body></html>
      `);
      printWindow.document.close();
    }
  };

  const regenerateQR = async (roomId) => {
    if (window.confirm('هل تريد إعادة إنشاء QR Code لهذه القاعة؟')) {
      try {
        setLoading(true);
        const response = await roomsAPI.regenerateQR(roomId);
        if (response.success) {
          setSuccess('تم إعادة إنشاء QR Code بنجاح');
          refetchData();
        }
      } catch (error) {
        setError('فشل في إعادة إنشاء QR Code');
      } finally {
        setLoading(false);
      }
    }
  };

  // Function to handle general Excel file upload
  const handleGeneralExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset input
    e.target.value = null;

    setGeneralUploadLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await roomsAPI.uploadGeneralWeeklySchedule(formData);

      if (response.success) {
        setGeneralUploadResults(response.data);
        setShowGeneralUploadModal(true);
        setSuccess(response.message);
        refetchData(); // Refresh rooms and schedules
      } else {
        setError(response.message || 'فشل في تحميل الجدول العام');
      }
    } catch (error) {
      console.error('Error uploading general Excel file:', error);
      setError(error.response?.data?.message || 'فشل في تحميل ملف Excel العام');
    } finally {
      setGeneralUploadLoading(false);
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary mb-3">
            <i className="fas fa-door-open me-2"></i>
            إدارة القاعات
          </h2>
          
          {userRole === 'dean' && (
            <Alert variant="success" className="mb-3">
              <i className="fas fa-crown me-2"></i>
              <strong>عميد الكلية:</strong> يمكنك رؤية وإدارة جميع قاعات الكلية من جميع الأقسام.
              <br />
              <small><strong>💡 نصيحة:</strong> بعد إضافة القاعة، استخدم زر "إدارة الجدول" لإدخال الجدول الدراسي للقاعة.</small>
            </Alert>
          )}
          
          {userRole === 'department_head' && (
            <Alert variant="info" className="mb-3">
              <i className="fas fa-info-circle me-2"></i>
              <strong>ملاحظة:</strong> يتم عرض قاعات قسمك فقط، وستتم إضافة أي قاعة جديدة تلقائياً إلى قسمك.
              <br />
              <small><strong>💡 نصيحة:</strong> بعد إضافة القاعة، استخدم زر "إدارة الجدول" لإدخال الجدول الدراسي للقاعة.</small>
            </Alert>
          )}
          
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

      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light border-0 d-flex flex-column flex-md-row justify-content-between align-items-center">
              <h5 className="mb-2 mb-md-0 text-dark">
                <i className="fas fa-list me-2 text-info"></i>
                قائمة القاعات
              </h5>
              <div className="d-flex gap-2">
                <Button 
                  variant="success" 
                  onClick={() => document.getElementById('general-excel-upload').click()}
                  className="rounded-3"
                  disabled={generalUploadLoading}
                >
                  <i className="fas fa-file-excel me-2"></i>
                  تحميل جدول عام
                </Button>
                <input
                  id="general-excel-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={handleGeneralExcelUpload}
                />
                <Button 
                  variant="primary" 
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                  className="rounded-3"
                >
                  <i className="fas fa-plus me-2"></i>
                  إضافة قاعة جديدة
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table className="mb-0" striped hover>
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0">اسم القاعة</th>
                      <th className="border-0 d-none d-md-table-cell">الرمز</th>
                      <th className="border-0 d-none d-lg-table-cell">القسم</th>
                      <th className="border-0 d-none d-md-table-cell">السعة</th>
                      <th className="border-0">الحالة</th>
                      <th className="border-0 d-none d-lg-table-cell">QR Code</th>
                      <th className="border-0 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map(room => (
                      <tr key={room.id}>
                        <td className="fw-bold">{room.name}</td>
                        <td className="d-none d-md-table-cell">
                          <Badge bg="secondary" className="rounded-pill">{room.code}</Badge>
                        </td>
                        <td className="d-none d-lg-table-cell text-muted">{room.department?.name || 'غير محدد'}</td>
                        <td className="d-none d-md-table-cell text-muted">{room.capacity || 'غير محدد'}</td>
                        <td>
                          <Badge bg={room.is_active ? 'success' : 'danger'} className="rounded-pill">
                            {room.is_active ? '✓ نشط' : '✗ غير نشط'}
                          </Badge>
                        </td>
                        <td className="d-none d-lg-table-cell text-center">
                        {room.qr_code_path ? (
                          <div className="d-flex gap-1 flex-wrap justify-content-center">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => downloadQR(room.code)}
                              title="تحميل QR Code"
                            >
                              <i className="fas fa-download"></i>
                            </Button>
                            <Button
                              variant="info"
                              size="sm"
                              onClick={() => viewQR(room.id)}
                              title="عرض QR Code"
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => printQR(room.id)}
                              title="طباعة QR Code"
                            >
                              <i className="fas fa-print"></i>
                            </Button>
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={() => regenerateQR(room.id)}
                              title="إعادة إنشاء QR Code"
                            >
                              <i className="fas fa-redo"></i>
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => regenerateQR(room.id)}
                            title="إنشاء QR Code"
                          >
                            <i className="fas fa-qrcode me-1"></i>
                            إنشاء QR
                          </Button>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          <Button
                            variant="info"
                            size="sm"
                            onClick={() => handleManageSchedule(room.id)}
                            className="text-white"
                          >
                            <i className="fas fa-calendar-alt me-1"></i>
                            إدارة الجدول
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleEdit(room)}
                          >
                            تعديل
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(room.id)}
                          >
                            حذف
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
        {/* Modal for QR print preview */}
        <Modal show={showPrintModal} onHide={() => { setShowPrintModal(false); window.URL.revokeObjectURL(printQRUrl); }} centered>
          <Modal.Header closeButton>
            <Modal.Title>طباعة QR Code</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center">
            {printQRUrl && (
              <img ref={printImgRef} src={printQRUrl} alt="QR Code" style={{ maxWidth: '100%', marginBottom: '20px' }} />
            )}
            <Button variant="primary" onClick={handlePrint} style={{ fontSize: '18px', padding: '10px 30px' }}>
              <i className="fas fa-print me-2"></i>
              طباعة
            </Button>
          </Modal.Body>
        </Modal>

        {/* General Excel Upload Results Modal */}
        <Modal show={showGeneralUploadModal} onHide={() => setShowGeneralUploadModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>نتائج تحميل الجدول العام</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {generalUploadResults && (
              <div>
                <Alert variant="success">
                  <p><strong>تم إنشاء {generalUploadResults.created_count} جدول بنجاح</strong></p>
                  <p><strong>عدد الأخطاء: {generalUploadResults.error_count}</strong></p>
                  {generalUploadResults.warning_count > 0 && (
                    <p><strong>عدد التحذيرات: {generalUploadResults.warning_count}</strong></p>
                  )}
                </Alert>
                
                {generalUploadResults.warnings && generalUploadResults.warnings.length > 0 && (
                  <div className="mt-3">
                    <h6 className="text-warning">التحذيرات:</h6>
                    <ul>
                      {generalUploadResults.warnings.map((warning, index) => (
                        <li key={index} className="text-warning">{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {generalUploadResults.errors && generalUploadResults.errors.length > 0 && (
                  <div className="mt-3">
                    <h6>الأخطاء:</h6>
                    <ul>
                      {generalUploadResults.errors.map((error, index) => (
                        <li key={index} className="text-danger">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {generalUploadResults.created_schedules && generalUploadResults.created_schedules.length > 0 && (
                  <div className="mt-3">
                    <h6>الجداول المُنشأة:</h6>
                    <Table striped bordered hover size="sm">
                      <thead>
                        <tr>
                          <th>القاعة</th>
                          <th>المادة</th>
                          <th>المدرس</th>
                          <th>اليوم</th>
                          <th>الوقت</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generalUploadResults.created_schedules.map((schedule, index) => (
                          <tr key={index}>
                            <td>{schedule.room_code}</td>
                            <td>{schedule.subject_name}</td>
                            <td>{schedule.instructor_name}</td>
                            <td>{schedule.day_of_week}</td>
                            <td>{schedule.start_time} - {schedule.end_time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowGeneralUploadModal(false)}>
              إغلاق
            </Button>
          </Modal.Footer>
        </Modal>
      </Row>

      {/* مودال إضافة/تعديل القاعة */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingRoom ? 'تعديل القاعة' : 'إضافة قاعة جديدة'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {userRole === 'department_head' && (
              <Alert variant="info" className="mb-3">
                <i className="fas fa-info-circle me-2"></i>
                ستتم إضافة القاعة تلقائياً إلى قسمك
              </Alert>
            )}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>اسم القاعة *</Form.Label>
                  <Form.Control
                    type="text"
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({...roomForm, name: e.target.value})}
                    required
                    placeholder="مثال: قاعة المحاضرات الكبيرة"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>رمز القاعة *</Form.Label>
                  <Form.Control
                    type="text"
                    value={roomForm.code}
                    onChange={(e) => setRoomForm({...roomForm, code: e.target.value})}
                    required
                    placeholder="مثال: A101"
                    disabled={editingRoom} // منع تعديل الرمز
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              {userRole === 'dean' && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>القسم *</Form.Label>
                    <Form.Select
                      value={roomForm.department_id}
                      onChange={(e) => setRoomForm({...roomForm, department_id: e.target.value})}
                      required
                    >
                      <option value="">اختر القسم</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
              {userRole === 'department_head' && (
                <input 
                  type="hidden" 
                  value={userDepartmentId} 
                  onChange={(e) => setRoomForm({...roomForm, department_id: e.target.value})}
                />
              )}
              <Col md={userRole === 'dean' ? 6 : 12}>
                <Form.Group className="mb-3">
                  <Form.Label>السعة</Form.Label>
                  <Form.Control
                    type="number"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({...roomForm, capacity: e.target.value})}
                    placeholder="عدد الطلاب"
                    min="1"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>الوصف</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={roomForm.description}
                onChange={(e) => setRoomForm({...roomForm, description: e.target.value})}
                placeholder="وصف مختصر للقاعة وإمكانياتها..."
              />
            </Form.Group>

            {!editingRoom && (
              <Alert variant="info">
                <small>
                  <strong>ملاحظة:</strong> سيتم توليد QR Code تلقائياً للقاعة بعد الإنشاء
                </small>
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              إلغاء
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : (editingRoom ? 'تحديث' : 'إنشاء')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ManageRooms;
