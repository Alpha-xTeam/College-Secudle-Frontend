import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';
import { getAuthHeaders } from '../utils/auth';

const ManageSupervisors = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [supervisorForm, setSupervisorForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    is_active: true
  });

  useEffect(() => {
    fetchSupervisors();
  }, []);

  // إعادة تعيين النموذج عند فتح المودال لإضافة مشرف جديد
  useEffect(() => {
    if (showModal && !editingSupervisor) {
      setSupervisorForm({
        username: '',
        email: '',
        password: '',
        full_name: '',
        is_active: true
      });
    }
  }, [showModal, editingSupervisor]);

  const fetchSupervisors = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000`;
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_URL}/api/department/supervisors`, { headers });
      if (res.data?.success) {
        setSupervisors(res.data.data || []);
      }
    } catch (error) {
      setError('فشل في جلب المشرفين');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000`;
      const headers = getAuthHeaders();

      if (editingSupervisor) {
        // تحديث المشرف
        const updateData = { ...supervisorForm };
        // إزالة كلمة المرور إذا كانت فارغة
        if (!updateData.password) {
          delete updateData.password;
        }
        const res = await axios.put(`${API_URL}/api/department/supervisors/${editingSupervisor.id}`, updateData, { headers });
        if (res.data?.success) {
          setSuccess('تم تحديث المشرف بنجاح');
        } else {
          setError(res.data?.message || 'فشل في تحديث المشرف');
        }
      } else {
        // إنشاء مشرف جديد
        const res = await axios.post(`${API_URL}/api/department/supervisors`, supervisorForm, { headers });
        if (res.data?.success) {
          setSuccess('تم إنشاء المشرف بنجاح');
        } else {
          setError(res.data?.message || 'فشل في إنشاء المشرف');
        }
      }

      setShowModal(false);
      resetForm();
      fetchSupervisors();
    } catch (error) {
      setError(error.response?.data?.message || 'فشل في حفظ المشرف');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (supervisorId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المشرف؟')) {
      try {
        const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000`;
        const headers = getAuthHeaders();
        
        const response = await axios.delete(`${API_URL}/api/department/supervisors/${supervisorId}`, { headers });
        if (response.data?.success) {
          setSuccess('تم حذف المشرف بنجاح');
          fetchSupervisors();
        } else {
          setError(response.data?.message || 'فشل في حذف المشرف');
        }
      } catch (error) {
        setError(error.response?.data?.message || 'فشل في حذف المشرف');
      }
    }
  };

  const resetForm = () => {
    setSupervisorForm({
      username: '',
      email: '',
      password: '',
      full_name: '',
      is_active: true
    });
    setEditingSupervisor(null);
  };

  const openEditModal = (supervisor) => {
    setEditingSupervisor(supervisor);
    setSupervisorForm({
      username: supervisor.username || '',
      email: supervisor.email || '',
      password: '',
      full_name: supervisor.full_name || '',
      is_active: supervisor.is_active !== false
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    // إعادة تعيين النموذج بالكامل
    setSupervisorForm({
      username: '',
      email: '',
      password: '',
      full_name: '',
      is_active: true
    });
    setEditingSupervisor(null);
    setShowModal(true);
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary mb-3" style={{ color: '#111827' }}>
            <i className="fas fa-users-cog me-2"></i>
            إدارة المشرفين
          </h2>
          
          <Alert variant="info" className="mb-3">
            <i className="fas fa-info-circle me-2"></i>
            <strong>ملاحظة:</strong> يمكنك إضافة مشرفين للتحكم في قاعات قسمك وإدارة الجداول الدراسية.
            <br />
            <small><strong>💡 نصيحة:</strong> المشرفون سيكونون قادرين على إدارة الجداول الدراسية للقاعات في قسمك.</small>
          </Alert>
          
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

      {/* قائمة المشرفين */}
      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light border-0 d-flex flex-column flex-md-row justify-content-between align-items-center">
              <h5 className="mb-2 mb-md-0">
                <i className="fas fa-users me-2 text-success"></i>
                المشرفون
              </h5>
              <Button 
                variant="success" 
                onClick={openCreateModal}
                className="rounded-3"
              >
                <i className="fas fa-user-plus me-2"></i>
                إضافة مشرف جديد
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table className="mb-0" striped hover>
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0">الاسم الكامل</th>
                      <th className="border-0 d-none d-md-table-cell">اسم المستخدم</th>
                      <th className="border-0 d-none d-lg-table-cell">البريد الإلكتروني</th>
                      <th className="border-0">الحالة</th>
                      <th className="border-0 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supervisors.map(supervisor => (
                      <tr key={supervisor.id}>
                        <td className="fw-bold">{supervisor.full_name}</td>
                        <td className="d-none d-md-table-cell text-muted">{supervisor.username}</td>
                        <td className="d-none d-lg-table-cell text-muted">{supervisor.email}</td>
                        <td>
                          <Badge bg={supervisor.is_active ? 'success' : 'danger'} className="rounded-pill">
                            {supervisor.is_active ? '✓ نشط' : '✗ غير نشط'}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <div className="d-flex gap-2 justify-content-center">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => openEditModal(supervisor)}
                              className="rounded-3"
                              title="تعديل المشرف"
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(supervisor.id)}
                              className="rounded-3"
                              title="حذف المشرف"
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
              
              {supervisors.length === 0 && (
                <div className="text-center text-muted py-5">
                  <i className="fas fa-users fa-3x mb-3"></i>
                  <h5>لا توجد مشرفين مسجلين</h5>
                  <p>ابدأ بإضافة مشرف جديد لإدارة القاعات</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* مودال إضافة/تعديل مشرف */}
      <Modal show={showModal} onHide={() => {
        setShowModal(false);
        resetForm();
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingSupervisor ? 'تعديل المشرف' : 'إضافة مشرف جديد'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>الاسم الكامل <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={supervisorForm.full_name}
                    onChange={(e) => setSupervisorForm({...supervisorForm, full_name: e.target.value})}
                    required
                    placeholder="أدخل الاسم الكامل"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>اسم المستخدم <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={supervisorForm.username}
                    onChange={(e) => setSupervisorForm({...supervisorForm, username: e.target.value})}
                    required
                    placeholder="أدخل اسم المستخدم"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>البريد الإلكتروني <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="email"
                    value={supervisorForm.email}
                    onChange={(e) => setSupervisorForm({...supervisorForm, email: e.target.value})}
                    required
                    placeholder="أدخل البريد الإلكتروني"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    {editingSupervisor ? 'كلمة المرور الجديدة (اختياري)' : 'كلمة المرور *'}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    value={supervisorForm.password}
                    onChange={(e) => setSupervisorForm({...supervisorForm, password: e.target.value})}
                    required={!editingSupervisor}
                    placeholder={editingSupervisor ? "اتركها فارغة إذا لم ترد تغييرها" : "أدخل كلمة المرور"}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Check
                    type="switch"
                    id="is_active"
                    label="تفعيل المشرف"
                    checked={supervisorForm.is_active}
                    onChange={(e) => setSupervisorForm({...supervisorForm, is_active: e.target.checked})}
                  />
                  <Form.Text className="text-muted">
                    المشرف النشط سيتمكن من الدخول وإدارة القاعات
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              إلغاء
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : (editingSupervisor ? 'تحديث المشرف' : 'إنشاء المشرف')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ManageSupervisors;
