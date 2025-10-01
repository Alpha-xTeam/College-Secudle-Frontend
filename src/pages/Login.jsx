import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';
import { setAuthToken, setUser, isAuthenticated, logout } from '../utils/auth';
import { getMainLogo } from '../config/teamConfig';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // إذا كان المستخدم مسجل دخول، إعادة توجيهه مباشرة للداشبورد
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
    // Apply body helper class to ensure page background for login
    document.body.classList.add('login-page-body');
    return () => {
      document.body.classList.remove('login-page-body');
    };
  }, [navigate]);

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    window.location.reload(); // إعادة تحميل الصفحة لتحديث الحالة
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData);
      
      if (response.success) {
        setAuthToken(response.data.access_token);
        setUser(response.data.user);
        // إطلاق storage event للإشعار بتحديث المصادقة
        window.dispatchEvent(new Event('storage'));
        // تأخير قصير ثم التنقل
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
      } else {
        setError(response.message || 'فشل في تسجيل الدخول');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="login-container d-flex align-items-center justify-content-center">
      <Row className="justify-content-center w-100">
        <Col xs={12} sm={10} md={6} lg={5} xl={4}>
          <Card className="shadow border-0 animate__animated animate__fadeIn login-card">
            {/* Logo & Header */}
            <div className="login-header">
              <div style={{ marginBottom: 12 }}>
                {(() => {
                  const logo = getMainLogo();
                  return logo.type === 'image' ? (
                    <img src={logo.src} alt={logo.alt} className="login-logo" />
                  ) : (
                    <span className="login-logo" aria-hidden>{logo.icon}</span>
                  );
                })()}
              </div>
              <h2 className="mb-1 fw-bold" style={{ letterSpacing: 1 }}>نظام إدارة الجداول</h2>
              <p className="mb-0 opacity-90" style={{ fontSize: 15 }}>تسجيل الدخول إلى النظام</p>
            </div>
            <Card.Body className="login-body">
              {currentUser && (
                <Alert variant="info" className="rounded-4 border-0 shadow-sm mb-4">
                  <div className="text-center">
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👋</div>
                    <h5 className="text-dark mb-3">مرحباً! أنت مسجل دخولك بالفعل</h5>
                    <p className="mb-3">دورك في النظام: <strong>{currentUser.role === 'dean' ? 'عميد' : 'رئيس قسم'}</strong></p>
                    <div className="d-flex gap-2 justify-content-center">
                      <Button 
                        variant="primary" 
                        onClick={handleGoToDashboard}
                        className="fw-bold"
                        style={{
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          border: 'none'
                        }}
                      >
                        🏠 الذهاب للداشبورد
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        onClick={handleLogout}
                        className="fw-bold"
                        style={{
                          borderRadius: '10px'
                        }}
                      >
                        🚪 تسجيل خروج
                      </Button>
                    </div>
                  </div>
                </Alert>
              )}

              {error && (
                <Alert variant="danger" className="rounded-4 border-0 shadow-sm mb-4">
                  <div className="d-flex align-items-center">
                    <div style={{ fontSize: '1.2rem' }} className="me-3">⚠️</div>
                    <div>{error}</div>
                  </div>
                </Alert>
              )}

              {/* Login Form */}
              {!currentUser && (
                <Form onSubmit={handleSubmit} autoComplete="off">
                  <div className="text-center mb-4">
                    <h4 className="text-dark fw-bold" style={{ letterSpacing: 0.5 }}>تسجيل الدخول</h4>
                    <p className="text-muted" style={{ fontSize: 15 }}>ادخل بياناتك للوصول إلى النظام</p>
                  </div>
                  <Form.Group className="mb-4">
                    <Form.Label className="input-label mb-2">اسم المستخدم أو البريد الإلكتروني</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="input-icon" aria-hidden>
                        <i className="fas fa-user" />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        placeholder="أدخل اسم المستخدم"
                        className="form-control form-control-custom"
                        autoComplete="username"
                        aria-label="اسم المستخدم أو البريد الإلكتروني"
                      />
                    </InputGroup>
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Label className="input-label mb-2">كلمة المرور</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="input-icon" aria-hidden>
                        <i className="fas fa-lock" />
                      </InputGroup.Text>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        placeholder="أدخل كلمة المرور"
                        className="form-control form-control-custom"
                        autoComplete="current-password"
                        aria-label="كلمة المرور"
                      />
                    </InputGroup>
                  </Form.Group>
                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="btn-primary-custom w-100 fw-bold"
                    disabled={loading}
                    aria-busy={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        جاري تسجيل الدخول...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-rocket" aria-hidden /> دخول النظام
                      </>
                    )}
                  </Button>
                </Form>
              )}
            </Card.Body>
            
          </Card>
         </Col>
       </Row>
     </Container>
   );
 };
 
 export default Login;
