import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { TEAM_CONFIG, getFooterLogo } from '../config/teamConfig';
import '../styles/Footer.css';

const Footer = () => {
  // Default values (no context dependency)
  const isDark = false; // Default to light theme
  const version = '2.1.0';
  const companyName = 'نظام إدارة جداول الكلية';
  const buildTime = new Date().toISOString();
  const currentYear = new Date().getFullYear();

  // Format build time in Arabic locale with date and time
  const buildDateFormatted = new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(new Date(buildTime));

  // Team members data - Updated with new members and roles
  const teamMembers = [
    {
      name: 'حسين حيدر صبيح',
      imagePath: '/images/team/hussein-haidar.png',
      role: 'قائد فريق Alpha',
      bio: 'قائد فريق Alpha المسؤول عن إدارة الفريق وتطوير الحلول التقنية المبتكرة',
      color: '#dc2626', // Red
      gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
    },
    {
      name: 'حسن علي حسن صالح',
      imagePath: '/images/team/hassan-ali.png',
      role: 'عضو في فريق Alpha قسم التطوير',
      bio: 'عضو قسم التطوير المتخصص في بناء الحلول التقنية والواجهات التفاعلية',
      color: '#10b981', // Emerald
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    }
  ];

  // State for modal
  const [selectedMember, setSelectedMember] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Handle member click
  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setShowModal(true);
  };

  // Handle image click
  const handleImageClick = () => {
    setShowImageModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedMember(null);
  };

  // Close image modal
  const handleCloseImageModal = () => {
    setShowImageModal(false);
  };

  return (
    <footer 
      className={`footer${isDark ? ' footer--dark' : ''}`} 
      aria-label="تذييل الصفحة"
      style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderTop: '1px solid rgba(148, 163, 184, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Pattern */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)`,
          pointerEvents: 'none'
        }}
      />
      
      <div className="container py-5 position-relative">
        {/* معلومات الإصدار والشركة */}
        <div className="row mb-5">
          <div className="col-12">
            <div 
              className="p-4 rounded-4 shadow-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div 
                    className="d-flex align-items-center justify-content-center rounded-3"
                    style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: 'white'
                    }}
                  >
                    <i className="fas fa-graduation-cap fs-5"></i>
                  </div>
                  <div>
                    <h6 className="mb-1 fw-bold text-dark">{companyName}</h6>
                    <small className="text-muted">
                      &copy; {currentYear} — جميع الحقوق محفوظة
                    </small>
                  </div>
                </div>
                
                <div className="d-flex align-items-center flex-wrap gap-4">
                  <div className="d-flex align-items-center gap-2">
                    <span 
                      className="badge rounded-pill px-3 py-2"
                      style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        color: 'white'
                      }}
                    >
                      <i className="fas fa-code-branch me-1"></i>
                      الإصدار {version}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2 text-muted">
                    <i className="fas fa-clock"></i>
                    <small>آخر تحديث: {buildDateFormatted}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* قسم الفريق */}
        <div className="row">
          <div className="col-12">
            <div className="text-center mb-5">
              {/* شعار واسم الفريق */}
              <div className="d-flex align-items-center justify-content-center gap-4 mb-4">
                {(() => {
                  const logoConfig = getFooterLogo();
                  return (
                    <div 
                      className="d-flex align-items-center justify-content-center rounded-4 shadow-sm"
                      style={{
                        width: '80px',
                        height: '80px',
                        background: logoConfig.type === 'icon' 
                          ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
                          : 'transparent',
                        border: logoConfig.type === 'icon' ? 'none' : '3px solid rgba(99, 102, 241, 0.2)'
                      }}
                    >
                      {logoConfig.type === 'image' ? (
                        <img 
                          src={logoConfig.src}
                          alt={logoConfig.alt}
                          style={{
                            ...logoConfig.style,
                            borderRadius: '16px'
                          }}
                        />
                      ) : (
                        <span style={{
                          ...logoConfig.style,
                          fontSize: '32px',
                          color: 'white'
                        }}>
                          {logoConfig.icon}
                        </span>
                      )}
                    </div>
                  );
                })()}
                <div className="text-start">
                  <h3 
                    className="mb-2 fw-bold"
                    style={{
                      background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {TEAM_CONFIG.teamNameArabic}
                  </h3>
                  <p className="text-muted mb-0 fs-6">
                    {TEAM_CONFIG.fullName}
                  </p>
                </div>
              </div>

              <div className="mb-5">
                <h4 
                  className="fw-bold mb-3 d-flex align-items-center justify-content-center"
                  style={{
                    background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  <i className="fas fa-users team-section-icon me-2" aria-hidden></i>
                  فريق التطوير
                </h4>
                <p className="text-muted">
                  نخبة من المطورين المتخصصين في بناء الحلول التقنية المبتكرة
                </p>
              </div>

              <div className="row justify-content-center g-4">
                {teamMembers.map((member, index) => (
                  <div key={index} className="col-12 col-md-6 col-lg-5">
                    <div 
                      className="team-member-card h-100 p-4 rounded-4 shadow-sm position-relative overflow-hidden"
                      style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                      onClick={() => handleMemberClick(member)}
                    >
                      {/* Background Gradient */}
                      <div 
                        className="position-absolute top-0 start-0 w-100"
                        style={{
                          height: '4px',
                          background: member.gradient
                        }}
                      />
                      
                      {/* صورة العضو */}
                      <div className="mb-4 position-relative">
                        <div 
                          className="position-relative mx-auto"
                          style={{
                            width: '120px',
                            height: '120px'
                          }}
                        >
                          <img 
                            src={member.imagePath}
                            alt={member.name}
                            className="team-member-image rounded-circle w-100 h-100"
                            style={{
                              objectFit: 'cover',
                              border: `4px solid ${member.color}20`,
                              imageRendering: 'auto',
                              WebkitImageRendering: 'auto'
                            }}
                            onError={(e) => {
                              e.target.src = `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><defs><linearGradient id="grad${index}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${member.color};stop-opacity:1" /><stop offset="100%" style="stop-color:${member.color}80;stop-opacity:1" /></linearGradient></defs><circle cx="60" cy="60" r="55" fill="url(#grad${index})"/><circle cx="60" cy="45" r="18" fill="white" opacity="0.9"/><ellipse cx="60" cy="80" rx="25" ry="16" fill="white" opacity="0.9"/></svg>`;
                            }}
                          />
                          {/* Status Indicator */}
                          <div 
                            className="position-absolute bottom-0 end-0 rounded-circle border border-white"
                            style={{
                              width: '24px',
                              height: '24px',
                              background: member.color,
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                            }}
                          >
                            <i className="fas fa-check text-white" style={{ fontSize: '10px', lineHeight: '24px' }}></i>
                          </div>
                        </div>
                      </div>

                      <div className="text-center">
                        <h5 className="fw-bold text-dark mb-2">
                          {member.name}
                        </h5>
                        <span 
                          className="badge rounded-pill px-3 py-2 mb-3"
                          style={{
                            background: `${member.color}15`,
                            color: member.color,
                            border: `1px solid ${member.color}30`
                          }}
                        >
                          {member.role}
                        </span>
                        <p className="text-muted small mb-3 lh-base">
                          {member.bio}
                        </p>
                        <div className="d-flex align-items-center justify-content-center gap-2 text-muted">
                          <i className="fas fa-mouse-pointer" style={{ fontSize: '12px' }}></i>
                          <small>اضغط لعرض المزيد</small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* رسالة تحفيزية */}
              <div className="mt-5 pt-4">
                <div 
                  className="p-4 rounded-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                  }}
                >
                  <div className="d-flex align-items-center justify-content-center gap-4 flex-wrap">
                    <div className="d-flex align-items-center gap-2">
                      <i className="fas fa-graduation-cap footer-icon" aria-hidden></i>
                      <span className="text-muted">تم التطوير لخدمة التعليم العالي</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <i className="fas fa-rocket footer-icon" aria-hidden></i>
                      <span className="text-muted">نحو مستقبل تعليمي أفضل وأكثر تنظيماً</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <Modal 
          show={showModal} 
          onHide={handleCloseModal}
          size="lg"
          centered
          className="team-member-modal"
        >
          <Modal.Header 
            closeButton
            style={{
              background: selectedMember.gradient,
              color: 'white',
              border: 'none'
            }}
          >
            <Modal.Title className="fw-bold d-flex align-items-center gap-2">
              <i className="fas fa-user-circle"></i>
              معلومات العضو
            </Modal.Title>
          </Modal.Header>
          <Modal.Body 
            className="p-4"
            style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
            }}
          >
            <div className="row align-items-center">
              <div className="col-md-4 text-center mb-4 mb-md-0">
                <div className="position-relative d-inline-block">
                  <img 
                    src={selectedMember.imagePath}
                    alt={selectedMember.name}
                    className="rounded-4 shadow-lg"
                    style={{
                      width: '200px',
                      height: '200px',
                      objectFit: 'cover',
                      border: `4px solid ${selectedMember.color}`,
                      imageRendering: 'auto',
                      WebkitImageRendering: 'auto',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={handleImageClick}
                    onError={(e) => {
                      e.target.src = `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="modalGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${selectedMember.color};stop-opacity:1" /><stop offset="100%" style="stop-color:${selectedMember.color}80;stop-opacity:1" /></linearGradient></defs><rect width="200" height="200" rx="16" fill="url(#modalGrad)"/><circle cx="100" cy="80" r="30" fill="white" opacity="0.9"/><ellipse cx="100" cy="140" rx="40" ry="25" fill="white" opacity="0.9"/></svg>`;
                    }}
                  />
                  <div 
                    className="position-absolute bottom-0 end-0 rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: '40px',
                      height: '40px',
                      background: selectedMember.color,
                      border: '3px solid white',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <i className="fas fa-star text-white"></i>
                  </div>
                </div>
              </div>
              <div className="col-md-8">
                <div 
                  className="p-4 rounded-4 h-100"
                  style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <h3 
                    className="fw-bold mb-3"
                    style={{
                      color: selectedMember.color
                    }}
                  >
                    {selectedMember.name}
                  </h3>
                  
                  <div className="mb-4">
                    <span 
                      className="badge rounded-pill px-4 py-2 fs-6"
                      style={{
                        background: selectedMember.gradient,
                        color: 'white'
                      }}
                    >
                      <i className="fas fa-briefcase me-2"></i>
                      {selectedMember.role}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <h6 className="text-muted mb-2 fw-bold">
                      <i className="fas fa-info-circle me-2"></i>
                      نبذة تعريفية
                    </h6>
                    <p className="text-dark lh-lg mb-0">
                      {selectedMember.bio}
                    </p>
                  </div>
                  
                  <div className="d-flex align-items-center gap-3 pt-3 border-top">
                    <div 
                      className="d-flex align-items-center justify-content-center rounded-3"
                      style={{
                        width: '40px',
                        height: '40px',
                        background: `${selectedMember.color}15`,
                        color: selectedMember.color
                      }}
                    >
                      <i className="fas fa-users"></i>
                    </div>
                    <div>
                      <small className="text-muted d-block">عضو في</small>
                      <span className="fw-bold text-dark">فريق Alpha للتطوير</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer 
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: 'none'
            }}
          >
            <Button 
              variant="outline-secondary" 
              onClick={handleCloseModal}
              className="px-4 py-2 rounded-3"
            >
              <i className="fas fa-times me-2"></i>
              إغلاق
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Image Zoom Modal */}
      {selectedMember && (
        <Modal 
          show={showImageModal} 
          onHide={handleCloseImageModal}
          centered
          className="image-zoom-modal"
          dialogClassName="image-modal-dialog"
          style={{
            backdropFilter: 'blur(20px)'
          }}
        >
          <Modal.Body className="p-0 position-relative">
            <button
              type="button"
              className="btn position-absolute top-0 end-0 m-3 rounded-circle d-flex align-items-center justify-content-center image-modal-close"
              onClick={handleCloseImageModal}
              aria-label="إغلاق"
            >
              <i className="fas fa-times"></i>
            </button>
            
            <div 
              className="d-flex justify-content-center align-items-center" 
              style={{ 
                minHeight: '500px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                padding: '40px',
                margin: '20px',
                boxShadow: '0 25px 80px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <div className="text-center">
                <img 
                  src={selectedMember.imagePath}
                  alt={selectedMember.name}
                  className="rounded-4 shadow-lg modal-zoom-image"
                  style={{
                    width: '450px',
                    height: '450px',
                    objectFit: 'cover',
                    imageRendering: 'auto',
                    WebkitImageRendering: 'auto',
                    border: `6px solid ${selectedMember.color}`
                  }}
                  onError={(e) => {
                    e.target.src = `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="450" height="450" viewBox="0 0 450 450"><defs><linearGradient id="zoomGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${selectedMember.color};stop-opacity:1" /><stop offset="100%" style="stop-color:${selectedMember.color}80;stop-opacity:1" /></linearGradient></defs><rect width="450" height="450" rx="20" fill="url(#zoomGrad)"/><circle cx="225" cy="180" r="60" fill="white" opacity="0.9"/><ellipse cx="225" cy="300" rx="80" ry="50" fill="white" opacity="0.9"/></svg>`;
                  }}
                />
                <div className="mt-4">
                  <h4 
                    className="fw-bold mb-2"
                    style={{ color: selectedMember.color }}
                  >
                    {selectedMember.name}
                  </h4>
                  <span 
                    className="badge rounded-pill px-3 py-2"
                    style={{
                      background: selectedMember.gradient,
                      color: 'white'
                    }}
                  >
                    {selectedMember.role}
                  </span>
                </div>
              </div>
            </div>
          </Modal.Body>
        </Modal>
      )}
    </footer>
  );
};

export default Footer;