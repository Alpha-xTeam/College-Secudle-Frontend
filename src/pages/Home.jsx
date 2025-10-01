import React from 'react';
import { Container, Row, Col, Button, Card, Alert, Navbar } from 'react-bootstrap';
// import { useNavigate } from 'react-router-dom';
import { TEAM_CONFIG, getMainLogo } from '../config/teamConfig';
import Footer from '../components/Footer';
import './Home.css';

const THEME = {
  primary: '#2a4dd7',
  accent: '#667eea',
  bg: '#ffffff',
  text: '#111425'
};

const Home = () => {
  // const navigate = useNavigate();

  const handleLoginClick = () => {
    // حذف بيانات الجلسة فقط بدون إعادة توجيه
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="home-page" style={{
      minHeight: '100vh',
      background: THEME.bg,
      fontFamily: 'Cairo, sans-serif'
    }}>
      {/* Header */}
      <Navbar expand="lg" className="site-navbar" dir="rtl" variant="dark">
        <Container fluid className="d-flex justify-content-between align-items-center flex-row-reverse">
          <Navbar.Brand className="d-flex align-items-center brand-wrapper">
            <div className="brand-logo" aria-hidden>
              <i className="fas fa-graduation-cap brand-icon" aria-hidden></i>
            </div>
            <span className="brand-text">نظام إدارة الجداول</span>
          </Navbar.Brand>

          <div className="nav-login-wrapper d-flex align-items-center">
            <Button onClick={handleLoginClick} className="fw-bold btn-login">
              🔐 تسجيل الدخول
            </Button>
          </div>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <Container className="py-5">
         {/* Team Alpha Branding */}
         <Row className="mb-5">
           <Col className="text-center">
            <div className="team-card">
               {/* Team Logo Placeholder */}
               <div className="mb-3" style={{
                 display: 'flex',
                 justifyContent: 'center',
                 alignItems: 'center'
               }}>
                {(() => {
                  const logoConfig = getMainLogo();
                  return (
                    <div className="team-logo" style={{
                      background: logoConfig.type === 'icon' ? 'rgba(255,255,255,0.06)' : 'transparent'
                    }}>
                      {logoConfig.type === 'image' ? (
                        <img 
                          src={logoConfig.src}
                          alt={logoConfig.alt}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <span style={logoConfig.style}>
                          {logoConfig.icon}
                        </span>
                      )}
                    </div>
                  );
                })()}
               </div>
                
              {/* Team Credit */}
              <h2 className="team-title">
                تم تصميم هذا النظام بواسطة {TEAM_CONFIG.teamNameArabic}
              </h2>
              
              <p className="team-sub">Designed & Developed by {TEAM_CONFIG.fullName}</p>
             </div>
           </Col>
         </Row>

         {/* Access Notice Alert */}
         <Row className="mb-4">
           <Col>
            <Alert variant="info" className="text-center border-0 access-alert">
              <i className="fas fa-lock me-2" aria-hidden></i> للوصول إلى النظام وإدارة الجداول، يرجى تسجيل الدخول أولاً
            </Alert>
           </Col>
         </Row>

         <Row className="align-items-center min-vh-100">
           <Col lg={6} className="text-center text-lg-start">
             <div className="hero-content" style={{ color: '#111' }}>
               <div className="hero-icon" aria-hidden>
                 <i className="fas fa-university"></i>
               </div>
               <h1 className="display-3 fw-bold mb-4" style={{
                 textShadow: 'none'
               }}>
                 نظام إدارة جداول الكلية
               </h1>
               <p className="lead mb-5" style={{
                 fontSize: '1.3rem',
                 color: '#111',
                 lineHeight: '1.6'
               }}>
                 منصة شاملة ومتطورة لإدارة الجداول الدراسية والأكاديمية بكفاءة عالية
                 <br />
                 💡 <strong>يرجى تسجيل الدخول للوصول إلى جميع ميزات النظام</strong>
                 <br />
                 نظام حديث يلبي احتياجات المؤسسات التعليمية
               </p>
              <Button 
                size="lg"
                onClick={handleLoginClick}
                className="fw-bold px-5 py-3 cta-button"
              >
                🚀 ابدأ الآن - تسجيل الدخول
              </Button>
             </div>
           </Col>
           
           <Col lg={6}>
             <Row className="g-4">
               {/* Feature Cards */}
               <Col md={6}>
                <Card className="h-100 shadow-lg feature-card">
                   <Card.Body className="text-center p-4">
                     <div className="feature-icon" aria-hidden>
                      <i className="fas fa-chart-bar"></i>
                     </div>
                     <h5 className="fw-bold text-dark mb-3">إدارة متقدمة</h5>
                     <p className="text-muted">
                       نظام إدارة شامل للجداول الدراسية والقاعات والأقسام الأكاديمية
                     </p>
                   </Card.Body>
                 </Card>
               </Col>
               
               <Col md={6}>
                <Card className="h-100 shadow-lg feature-card">
                   <Card.Body className="text-center p-4">
                     <div className="feature-icon" aria-hidden>
                      <i className="fas fa-bolt"></i>
                     </div>
                     <h5 className="fw-bold text-dark mb-3">سرعة وكفاءة</h5>
                     <p className="text-muted">
                       أداء سريع وواجهة سهلة الاستخدام لتحسين الإنتاجية
                     </p>
                   </Card.Body>
                 </Card>
               </Col>
               
               <Col md={6}>
                <Card className="h-100 shadow-lg feature-card">
                   <Card.Body className="text-center p-4">
                     <div className="feature-icon" aria-hidden>
                      <i className="fas fa-lock"></i>
                     </div>
                     <h5 className="fw-bold text-dark mb-3">أمان عالي</h5>
                     <p className="text-muted">
                       حماية متقدمة للبيانات مع صلاحيات متعددة المستويات
                     </p>
                   </Card.Body>
                 </Card>
               </Col>
               
               <Col md={6}>
                <Card className="h-100 shadow-lg feature-card">
                   <Card.Body className="text-center p-4">
                     <div className="feature-icon" aria-hidden>
                      <i className="fas fa-bullseye"></i>
                     </div>
                     <h5 className="fw-bold text-dark mb-3">دقة في التنظيم</h5>
                     <p className="text-muted">
                       تنظيم دقيق للمواعيد والجداول مع تجنب التضارب
                     </p>
                   </Card.Body>
                 </Card>
               </Col>
             </Row>
           </Col>
         </Row>
       </Container>

       {/* Features Section */}
       <Container className="py-5">
         <Row>
           <Col lg={12} className="text-center mb-5">
             <h2 className="display-5 fw-bold section-title" style={{ marginBottom: '1rem' }}>
               مميزات النظام
             </h2>
             <p className="lead" style={{ color: '#111', opacity: 0.75 }}>
               نظام متكامل يوفر جميع الأدوات اللازمة لإدارة الجداول الأكاديمية
             </p>
           </Col>
         </Row>
         
         <Row className="g-4">
           <Col md={4}>
             <div className="text-center feature-item">
               <div className="feature-icon" aria-hidden>
                 <i className="fas fa-user-tie"></i>
               </div>
               <h4 className="fw-bold mb-3">لوحة تحكم العميد</h4>
               <p className="opacity-75">
                 إدارة شاملة للأقسام والمستخدمين والإعدادات العامة
               </p>
             </div>
           </Col>
           
           <Col md={4}>
             <div className="text-center feature-item">
               <div className="feature-icon"><i className="fas fa-clipboard-list" aria-hidden></i></div>
               <h4 className="fw-bold mb-3">إدارة الجداول</h4>
               <p className="opacity-75">
                 إنشاء وتعديل الجداول الدراسية مع تجنب التضارب في المواعيد
               </p>
             </div>
           </Col>
           
           <Col md={4}>
             <div className="text-center feature-item">
               <div className="feature-icon"><i className="fas fa-building" aria-hidden></i></div>
               <h4 className="fw-bold mb-3">إدارة القاعات</h4>
               <p className="opacity-75">
                 تنظيم القاعات والمختبرات مع متابعة الاستخدام والتوزيع
               </p>
             </div>
           </Col>
         </Row>
       </Container>

       {/* CTA Section */}
       <Container className="py-5">
         <Row>
           <Col lg={12}>
            <Card className="border-0 shadow-lg cta-card">
               <Card.Body className="text-center p-5">
                 <div style={{ fontSize: '3rem', marginBottom: '2rem' }} aria-hidden>
                  <i className="fas fa-star"></i>
                 </div>
                 <h3 className="fw-bold text-dark mb-4">
                   ابدأ رحلتك مع نظام إدارة الجداول الآن
                 </h3>
                 <p className="text-muted mb-4 fs-5">
                   انضم إلى المؤسسات التعليمية التي تثق في نظامنا لإدارة جداولها الأكاديمية
                 </p>
                 <Button 
                   size="lg"
                   onClick={handleLoginClick}
                   className="fw-bold px-5 py-3 cta-button"
                 >
                   <i className="fas fa-sign-in-alt me-2" aria-hidden></i> تسجيل الدخول للنظام
                 </Button>
               </Card.Body>
             </Card>
           </Col>
         </Row>
       </Container>

       {/* Footer Component */}
       <Footer />
     </div>
   );
 };
 
 export default Home;
