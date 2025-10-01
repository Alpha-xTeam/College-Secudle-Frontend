import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge, Dropdown } from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { getAuthHeaders, getUserRole } from '../utils/auth';
import Icon from '../components/Icon';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Get user role to determine what features to show
  const userRole = getUserRole();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const [excelFile, setExcelFile] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedStudyType, setSelectedStudyType] = useState('');

  // State for export filters
  const [exportStageFilter, setExportStageFilter] = useState('');
  const [exportStudyTypeFilter, setExportStudyTypeFilter] = useState('');

  const getAcademicYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
    const currentDay = now.getDate();
    
    // Academic year starts on September 17th
    const academicYearStartMonth = 9;
    const academicYearStartDay = 17;
    
    if (currentMonth > academicYearStartMonth || 
        (currentMonth === academicYearStartMonth && currentDay >= academicYearStartDay)) {
      // After September 17th, academic year is current_year - (current_year + 1)
      return `${currentYear}_${currentYear + 1}`;
    } else {
      // Before September 17th, academic year is (current_year - 1) - current_year
      return `${currentYear - 1}_${currentYear}`;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

      const [usersRes, deptsRes] = await Promise.all([
        axios.get(`${API_URL}/api/dean/users`, { headers }),
        axios.get(`${API_URL}/api/dean/departments`, { headers })
      ]);

      if (usersRes.data.success) {
        setUsers(usersRes.data.data);
      }

      if (deptsRes.data.success) {
        setDepartments(deptsRes.data.data);
      }
    } catch (error) {
      setError('فشل في جلب البيانات');
    }
  };

  const handleSearchStudents = async () => {
    if (!searchQuery.trim()) {
      setSearchError('الرجاء إدخال كلمة للبحث.');
      setSearchResults([]);
      return;
    }

    setLoadingSearch(true);
    setSearchError('');
    setHasSearched(true); // Set to true when search is initiated
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
      const response = await axios.get(`${API_URL}/api/students/search_students?query=${searchQuery}`, { headers });
      setSearchResults(response.data.students || []);
    } catch (error) {
      setSearchError(error.response?.data?.error || 'فشل في البحث عن الطلاب.');
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleFileChange = (e) => {
    setExcelFile(e.target.files[0]);
    setUploadError('');
    setUploadMessage('');
  };

  const handleFileUpload = async () => {
    if (!excelFile) {
      setUploadError('الرجاء اختيار ملف Excel أولاً.');
      return;
    }
    if (!selectedStage) {
      setUploadError('الرجاء تحديد المرحلة أولاً.');
      return;
    }
    if (!selectedStudyType) {
      setUploadError('الرجاء تحديد نوع الدراسة أولاً.');
      return;
    }

    setLoadingUpload(true);
    setUploadError('');
    setUploadMessage('');

    const formData = new FormData();
    formData.append('file', excelFile);
    formData.append('stage', selectedStage);
    formData.append('study_type', selectedStudyType); // Add study_type to formData

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
      // Remove Content-Type header for FormData to let browser set it correctly 
      delete headers['Content-Type']; 

      const response = await axios.post(`${API_URL}/api/students/upload_students_excel`, formData, { headers });
      if (response.data.message) {
        setUploadMessage(response.data.message);
      } else {
        setUploadError('فشل في رفع الملف: لا توجد رسالة نجاح.');
      }
    } catch (error) {
      setUploadError(error.response?.data?.error || 'فشل في رفع الملف.');
    } finally {
      setLoadingUpload(false);
      setExcelFile(null); // Clear the selected file after upload attempt
      setSelectedStage(''); // Clear the selected stage
      setSelectedStudyType(''); // Clear the selected study type
    }
  };

  const handleExportToExcel = async () => {
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

      // Build query parameters for filtering
      const params = new URLSearchParams();
      if (exportStageFilter) params.append('stage', exportStageFilter);
      if (exportStudyTypeFilter) params.append('study_type', exportStudyTypeFilter);

      const response = await axios.get(`${API_URL}/api/students/export_students?${params.toString()}`, { headers });
      
      if (response.data.students && response.data.students.length > 0) {
        // Get current academic year
        const academicYear = getAcademicYear();
        
        // Prepare data for Excel and sort by name alphabetically
        const excelData = response.data.students
          .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
          .map(student => ({
            'الرقم الجامعي': student.student_id,
            'الاسم': student.name,
            'الشعبة': student.section,
            'المجموعة': student.group_name || '',
            'المرحلة': student.academic_stage,
            'نوع الدراسة': student.study_type || '',
            'القسم': departments.find(dept => dept.id === student.department_id)?.name || '',
            'السنة الدراسية': academicYear
          }));

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        // Set column widths
        const colWidths = [
          { wch: 15 }, // الرقم الجامعي
          { wch: 25 }, // الاسم
          { wch: 10 }, // الشعبة
          { wch: 10 }, // المجموعة
          { wch: 8 },  // المرحلة
          { wch: 12 }, // نوع الدراسة
          { wch: 20 }, // القسم
          { wch: 15 }  // السنة الدراسية
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'الطلاب');
        
        // Generate filename with academic year
        const filename = `قائمة_الطلاب_${academicYear}.xlsx`;
        
        XLSX.writeFile(wb, filename);
      } else {
        setError('لا توجد بيانات للتصدير');
      }
    } catch (error) {
      setError('فشل في تصدير البيانات: ' + (error.response?.data?.error || error.message));
    }
  };

  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'department_head',
    department_id: ''
  });

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

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

      if (editingUser) {
        // Partial update: only send changed/non-empty fields
        const payload = {};
        const orig = editingUser || {};

        // helper to get original department id
        const origDeptId = orig.department_id || (orig.department ? String(orig.department.id) : '');

        if (userForm.username && userForm.username !== orig.username) payload.username = userForm.username;
        if (userForm.email && userForm.email !== orig.email) payload.email = userForm.email;
        if (userForm.full_name && userForm.full_name !== orig.full_name) payload.full_name = userForm.full_name;
        if (userForm.role && userForm.role !== orig.role) payload.role = userForm.role;
        if (userForm.department_id && String(userForm.department_id) !== String(origDeptId)) payload.department_id = userForm.department_id;
        if (userForm.password && userForm.password.trim() !== '') payload.password = userForm.password; // only include password if set

        if (Object.keys(payload).length === 0) {
          setError('لم يتم إجراء أي تغييرات. الرجاء تعديل حقل واحد على الأقل قبل الحفظ.');
          setLoading(false);
          return;
        }

        try {
          const response = await axios.patch(`${API_URL}/api/dean/users/${editingUser.id}`, payload, { headers });
          if (response.data.success) {
            setSuccess('تم تحديث المستخدم بنجاح');
            fetchData();
            setShowModal(false);
            resetForm();
          } else {
            setError(response.data.message || 'فشل في تحديث المستخدم');
          }
        } catch (err) {
          // If backend doesn't support update yet, show graceful message
          const serverMsg = err.response?.data?.message || err.response?.data || err.message;
          setError(serverMsg || 'فشل في تحديث المستخدم. ربما التحديث غير متاح على الخادم حالياً.');
        }

      } else {
        const response = await axios.post(`${API_URL}/api/dean/users`, userForm, { headers });
        if (response.data.success) {
          setSuccess('تم إنشاء المستخدم بنجاح');
          fetchData();
        }
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      setError(error.response?.data?.message || 'فشل في حفظ المستخدم');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
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
        
        const response = await axios.delete(`${API_URL}/api/dean/users/${userId}`, { headers });
        if (response.data.success) {
          setSuccess('تم حذف المستخدم بنجاح');
          fetchData();
        }
      } catch (error) {
        setError(error.response?.data?.message || 'فشل في حذف المستخدم');
      }
    }
  };

  // Add edit handler to prefill form and open modal
  const handleEdit = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username || '',
      email: user.email || '',
      password: '', // keep password empty for security; user can set a new password
      full_name: user.full_name || '',
      role: user.role || 'department_head',
      department_id: user.department_id || user.department?.id || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setUserForm({
      username: '',
      email: '',
      password: '',
      full_name: '',
      role: 'department_head',
      department_id: ''
    });
    setEditingUser(null);
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'dean': return 'عميد الكلية';
      case 'department_head': return 'رئيس قسم';
      case 'supervisor': return 'مشرف';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'dean': return 'danger';
      case 'department_head': return 'primary';
      case 'supervisor': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <h2>إدارة المستخدمين</h2>
          
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
        </Col>
      </Row>

      {/* إظهار بطاقات الطلاب لرئيس القسم والمشرف فقط */}
      {(userRole === 'department_head' || userRole === 'supervisor') && (
        <Row className="mt-4">
          <Col>
            <Card>
              <Card.Header>
                <h5>رفع بيانات الطلاب من Excel</h5>
              </Card.Header>
            <Card.Body>
              {uploadError && <Alert variant="danger" dismissible onClose={() => setUploadError('')}>{uploadError}</Alert>}
              {uploadMessage && <Alert variant="success" dismissible onClose={() => setUploadMessage('')}>{uploadMessage}</Alert>}
              <Alert variant="info" className="mb-3">
                <div className="modern-info-card">
  <div className="card-header">
    <div className="header-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
    <h4 className="card-title">📊 مثال على الأعمدة المطلوبة في ملف Excel</h4>
  </div>
  
  <div className="card-content">
    <p className="intro-text">
      يجب أن يحتوي ملف Excel على الأعمدة التالية (يمكن استخدام الأسماء العربية أو الإنجليزية):
    </p>
    
    <div className="columns-grid">
      <div className="column-item required">
        <div className="column-badge required-badge">مطلوب</div>
        <div className="column-info">
          <div className="column-names">
            <code className="code-primary">name</code>
          </div>
          <div className="column-icon"><Icon name="user" /></div>
        </div>
      </div>

      <div className="column-item required">
        <div className="column-badge required-badge">مطلوب</div>
        <div className="column-info">
          <div className="column-names">
            <code className="code-primary">section</code>
          
          </div>
          <div className="column-icon"><Icon name="book" /></div>
        </div>
      </div>

      <div className="column-item required">
        <div className="column-badge required-badge">مطلوب</div>
        <div className="column-info">
          <div className="column-names">
            <code className="code-primary">group</code>
          
          </div>
          <div className="column-icon"><Icon name="users" /></div>
        </div>
      </div>

     

     

     
    </div>

    <div className="note-section">
      <div className="note-icon">💡</div>
      <div className="note-content">
        <strong>ملاحظة مهمة:</strong>
        <span>سيتم استخدام "المرحلة" و "نوع الدراسة" المحددين في النموذج لجميع الطلاب في الملف إذا لم يتم توفيرها في Excel.</span>
      </div>
    </div>
  </div>
</div>

</Alert>

<style>{`
  .modern-info-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 24px;
    padding: 0;
    margin-bottom: 2rem;
    box-shadow: 0 20px 40px rgba(102, 126, 234, 0.15);
    overflow: hidden;
    position: relative;
  }

  .modern-info-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%);
    pointer-events: none;
  }

  .card-header {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px);
    padding: 1.5rem 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    backdrop-filter: blur(10px);
  }

  .card-title {
    color: white;
    margin: 0;
    font-size: 1.4rem;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    font-family: 'Cairo', sans-serif;
  }

  .card-content {
    background: white;
    padding: 2rem;
    position: relative;
  }

  .intro-text {
    color: #4a5568;
    font-size: 1.1rem;
    font-weight: 500;
    margin-bottom: 2rem;
    line-height: 1.6;
    font-family: 'Cairo', sans-serif;
  }

  .columns-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .column-item {
    background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
    border: 2px solid #e2e8f0;
    border-radius: 20px;
    padding: 1.5rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .column-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }

  .column-item:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(102, 126, 234, 0.15);
    border-color: #667eea;
  }

  .column-item:hover::before {
    transform: scaleX(1);
  }

  .column-item.required {
    border-left: 4px solid #e53e3e;
  }

  .column-item.optional {
    border-left: 4px solid #38a169;
  }

  .column-badge {
    position: absolute;
    top: 1rem;
    left: 1rem;
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .required-badge {
    background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
    color: #c53030;
  }

  .optional-badge {
    background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
    color: #2f855a;
  }

  .column-info {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    margin-top: 1rem;
  }

  .column-names {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }

  .code-primary, .code-secondary {
    padding: 0.4rem 0.8rem;
    border-radius: 8px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.9rem;
    font-weight: 600;
    display: inline-block;
  }

  .code-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .code-secondary {
    background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%);
    color: #2d3748;
    border: 1px solid #cbd5e0;
  }

  .separator {
    color: #a0aec0;
    font-size: 0.9rem;
    font-weight: 500;
    margin: 0.2rem 0;
    text-align: center;
  }

  .column-icon {
    font-size: 2rem;
    opacity: 0.8;
    margin-right: 1rem;
  }

  .column-description {
    color: #718096;
    font-size: 0.9rem;
    font-style: italic;
    line-height: 1.4;
    margin-top: 0.5rem;
  }

  .note-section {
    background: linear-gradient(135deg, #fff5b7 0%, #fef5e7 100%);
    border: 2px solid #f6e05e;
    border-radius: 16px;
    padding: 1.5rem;
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }

  .note-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .note-content {
    color: #744210;
    line-height: 1.6;
    font-family: 'Cairo', sans-serif;
  }

  .note-content strong {
    color: #975a16;
    font-weight: 700;
    display: block;
    margin-bottom: 0.5rem;
  }

  /* الاستجابة للموبايل */
  @media (max-width: 768px) {
    .card-header {
      padding: 1rem 1.5rem;
      flex-direction: column;
      text-align: center;
      gap: 0.75rem;
    }

    .card-title {
      font-size: 1.2rem;
    }

    .card-content {
      padding: 1.5rem;
    }

    .columns-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .column-item {
      padding: 1.25rem;
    }

    .column-info {
      flex-direction: column;
      gap: 0.75rem;
    }

    .column-icon {
      align-self: flex-start;
      margin-right: 0;
    }

    .note-section {
      padding: 1.25rem;
      flex-direction: column;
      text-align: center;
    }
  }

  /* تأثيرات إضافية */
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  .header-icon {
    animation: float 3s ease-in-out infinite;
  }

  .column-item:nth-child(even) {
    animation-delay: 0.1s;
  }

  .column-item:nth-child(odd) {
    animation-delay: 0.2s;
  }
`}</style>
              <Form>
                <Form.Group controlId="formStage" className="mb-3">
                  <Form.Label>المرحلة</Form.Label>
                  <Form.Select
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value)}
                    required
                  >
                    <option value="">اختر المرحلة</option>
                    <option value="1">المرحلة الأولى</option>
                    <option value="2">المرحلة الثانية</option>
                    <option value="3">المرحلة الثالثة</option>
                    <option value="4">المرحلة الرابعة</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group controlId="formStudyType" className="mb-3">
                  <Form.Label>نوع الدراسة</Form.Label>
                  <Form.Select
                    value={selectedStudyType}
                    onChange={(e) => setSelectedStudyType(e.target.value)}
                    required
                  >
                    <option value="">اختر نوع الدراسة</option>
                    <option value="صباحي">صباحي</option>
                    <option value="مسائي">مسائي</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group controlId="formFile" className="mb-3">
                  <Form.Label>اختر ملف Excel لرفع بيانات الطلاب</Form.Label>
                  <Form.Control type="file" onChange={handleFileChange} accept=".xlsx, .xls" />
                </Form.Group>
                <Button variant="success" onClick={handleFileUpload} disabled={loadingUpload}>
                  {loadingUpload ? 'جاري الرفع...' : 'رفع البيانات'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      )}

      {/* إظهار بطاقة البحث عن الطلاب لرئيس القسم والمشرف فقط */}
      {(userRole === 'department_head' || userRole === 'supervisor') && (
        <Row className="mt-4">
          <Col>
            <Card>
              <Card.Header>
                <h5>البحث عن الطلاب</h5>
              </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group controlId="formStudentSearch" className="mb-3">
                  <Form.Label>البحث بالاسم أو الرقم الجامعي</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="أدخل اسم الطالب أو الرقم الجامعي"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </Form.Group>
                {(userRole === 'department_head' || userRole === 'supervisor') && (
                  <div className="mb-3 text-muted small">نتائج البحث محددة لقسمك تلقائياً.</div>
                )}
                <div className="d-flex gap-2">
                  <Button variant="primary" onClick={handleSearchStudents} disabled={loadingSearch}>
                    {loadingSearch ? 'جاري البحث...' : 'بحث'}
                  </Button>
                  <Dropdown>
                    <Dropdown.Toggle variant="success" id="export-dropdown">
                      تصدير إلى Excel
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <div className="p-3" style={{ minWidth: '250px' }}>
                        <Form.Group className="mb-3">
                          <Form.Label>تصفية حسب المرحلة</Form.Label>
                          <Form.Select
                            value={exportStageFilter}
                            onChange={(e) => setExportStageFilter(e.target.value)}
                          >
                            <option value="">جميع المراحل</option>
                            <option value="1">المرحلة الأولى</option>
                            <option value="2">المرحلة الثانية</option>
                            <option value="3">المرحلة الثالثة</option>
                            <option value="4">المرحلة الرابعة</option>
                          </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>تصفية حسب نوع الدراسة</Form.Label>
                          <Form.Select
                            value={exportStudyTypeFilter}
                            onChange={(e) => setExportStudyTypeFilter(e.target.value)}
                          >
                            <option value="">جميع الأنواع</option>
                            <option value="صباحي">صباحي</option>
                            <option value="مسائي">مسائي</option>
                          </Form.Select>
                        </Form.Group>
                        <Button 
                          variant="outline-success" 
                          onClick={handleExportToExcel}
                          className="w-100"
                        >
                          تصدير البيانات
                        </Button>
                      </div>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </Form>

              {searchError && <Alert variant="danger" className="mt-3" dismissible onClose={() => setSearchError('')}>{searchError}</Alert>}
              {searchResults.length > 0 && (
                <div className="mt-4">
                  <h6>نتائج البحث:</h6>
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>الرقم الجامعي</th>
                        <th>الاسم</th>
                        <th>الشعبة</th>
                        <th>المرحلة</th>
                        <th>نوع الدراسة</th>
                        <th>القسم</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map(student => (
                        <tr key={student.student_id}>
                          <td>{student.student_id}</td>
                          <td>{student.name}</td>
                          <td>{student.section}</td>
                          <td>{student.academic_stage}</td>
                          <td>{student.study_type || 'غير محدد'}</td>
                          <td>{departments.find(dept => dept.id === student.department_id)?.name || 'غير محدد'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}

              {hasSearched && searchQuery && searchResults.length === 0 && !loadingSearch && !searchError && (
                <Alert variant="info" className="mt-3">
                  لا توجد نتائج للبحث عن "{searchQuery}".
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      )}

      {/* إظهار بطاقة إضافة المستخدمين للعميد فقط */}
      {userRole === 'dean' && (
        <Row>
          <Col>
            <Card>
              <Card.Header className="d-flex justify-content-between">
                <h5 className="text-dark">قائمة المستخدمين</h5>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                >
                  إضافة مستخدم جديد
                </Button>
              </Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>الاسم الكامل</th>
                    <th>اسم المستخدم</th>
                    <th>البريد الإلكتروني</th>
                    <th>الدور</th>
                    <th>الشعبة</th>
                    <th>الحالة</th>
                    <th>تاريخ الإنشاء</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td><strong>{user.full_name}</strong></td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <Badge bg={getRoleBadgeVariant(user.role)}>
                          {getRoleText(user.role)}
                        </Badge>
                      </td>
                      <td>{user.department?.name || user.department_name || 'غير محدد'}</td>
                      <td>
                        <Badge bg={user.is_active ? 'success' : 'danger'}>
                          {user.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </td>
                      <td>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('ar-SA') : '-'}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            تعديل
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                          >
                            حذف
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {users.length === 0 && (
                <div className="text-center text-muted py-4">
                  <h5>لا يوجد مستخدمون</h5>
                  <p>ابدأ بإضافة مستخدمين جدد للنظام</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      )}

      {/* مودال إضافة/تعديل المستخدم - للعميد فقط */}
      {userRole === 'dean' && (
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>الاسم الكامل *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.full_name}
                    onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                    required={!editingUser}
                    placeholder="الاسم الكامل للمستخدم"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>اسم المستخدم *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                    required
                    placeholder="اسم المستخدم للدخول"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>البريد الإلكتروني *</Form.Label>
                  <Form.Control
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    required={!editingUser}
                    placeholder="example@college.edu"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>كلمة المرور {editingUser ? '(اختياري)' : '*'}</Form.Label>
                  <Form.Control
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    required={!editingUser}
                    placeholder={editingUser ? 'اتركه فارغاً إذا لا تريد تغييره' : 'كلمة مرور قوية'}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>الدور {editingUser ? '(اختياري)' : '*'}</Form.Label>
                  <Form.Select
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                    required={!editingUser}
                  >
                    <option value="department_head">رئيس قسم</option>
                    <option value="supervisor">مشرف</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>القسم</Form.Label>
                  <Form.Select
                    value={userForm.department_id}
                    onChange={(e) => setUserForm({...userForm, department_id: e.target.value})}
                  >
                    <option value="">اختر القسم (اختياري)</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Alert variant="info">
              <small>
                <strong>ملاحظات:</strong>
                <ul className="mb-0 mt-2">
                  <li>رئيس القسم يمكنه إدارة قاعات وجداول قسمه وإضافة مشرفين</li>
                  <li>المشرف يمكنه إدارة الجداول فقط ضمن قسمه</li>
                  <li>يُنصح بربط المستخدمين بأقسامهم المناسبة</li>
                </ul>
              </small>
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              إلغاء
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : (editingUser ? 'تحديث' : 'إنشاء')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      )}
    </Container>
  );
};

export default ManageUsers;
