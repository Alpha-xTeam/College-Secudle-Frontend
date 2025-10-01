import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { doctorsAPI } from '../api/doctors';
import { getAuthHeaders } from '../utils/auth'; // Assuming this is how auth headers are obtained

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

  useEffect(() => {
    fetchDoctorsAndDepartments();
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
      const lectures = await doctorsAPI.getDoctorLectures(doctorId, { includeAssistants: true });
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

  // Derived filtered doctors list by selected department
  const filteredDoctors = selectedFilterDepartment && selectedFilterDepartment !== ''
    ? doctors.filter(d => String(d.department_id) === String(selectedFilterDepartment))
    : doctors;

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
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
                <Table striped bordered hover responsive>
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
                        <td>{doctor.name}</td>
                        <td>{getDepartmentName(doctor.department_id)}</td>
                        <td>
                          <Button
                            variant="info"
                            size="sm"
                            onClick={() => handleViewLectures(doctor.id, doctor.name)}
                            className="me-2"
                          >
                            عرض المحاضرات
                          </Button>
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => handleEditDoctor(doctor)}
                            className="me-2"
                          >
                            <i className="fas fa-edit me-1"></i>
                            تعديل
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteDoctor(doctor.id, doctor.name)}
                            disabled={loading}
                          >
                            <i className="fas fa-trash me-1"></i>
                            حذف
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
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
          ) : selectedDoctorLectures.length === 0 ? (
            <Alert variant="info">لا توجد محاضرات مخصصة لهذا الدكتور.</Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>المادة</th>
                  <th>اليوم</th>
                  <th>الوقت</th>
                  <th>القاعة</th>
                  <th>المرحلة</th>
                  <th>نوع الدراسة</th>
                  <th>الدور</th>
                </tr>
              </thead>
              <tbody>
                {selectedDoctorLectures.map(lecture => {
                  // Determine role: primary if lecture.doctor_id matches or schedule_doctors entry has is_primary
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

                  return (
                    <tr key={lecture.id}>
                      <td>{lecture.subject_name}</td>
                      <td>{days[lecture.day_of_week]}</td>
                      <td>{lecture.start_time} - {lecture.end_time}</td>
                      <td>{lecture.rooms ? lecture.rooms.code : 'غير محدد'}</td>
                      <td><Badge bg="info">{lecture.academic_stage}</Badge></td>
                      <td>{lecture.study_type === 'morning' ? 'صباحي' : 'مسائي'}</td>
                      <td>{role}</td>
                    </tr>
                  );
                })}
               </tbody>
             </Table>
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
