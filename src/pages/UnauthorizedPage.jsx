import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { logout } from '../utils/auth';
import Footer from '../components/Footer';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Card className="text-center shadow-lg" style={{ maxWidth: '500px' }}>
          <Card.Body className="p-5">
            <div className="mb-4">
              <i className="fas fa-shield-alt text-danger" style={{ fontSize: '4rem' }}></i>
            </div>
            <h2 className="text-danger mb-3">🚫 غير مصرح لك</h2>
            <p className="lead mb-4">
              يجب تسجيل الدخول أولاً للوصول إلى هذه الصفحة
            </p>
          <p className="text-muted mb-4">
            النظام محمي بالكامل ويتطلب مصادقة صحيحة لجميع الصفحات
          </p>
          <Button 
            variant="primary" 
            size="lg" 
            onClick={handleLogout}
            className="w-100"
          >
            <i className="fas fa-sign-in-alt me-2"></i>
            الذهاب لتسجيل الدخول
          </Button>
        </Card.Body>
      </Card>
    </Container>
    
    {/* Footer Component */}
    <Footer />
    </div>
  );
};

export default UnauthorizedPage;
