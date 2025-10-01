import React, { useState } from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import './AnnouncementCard.css';
import Icon from './Icon';

const AnnouncementCard = ({ ann, showActions = false, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // تحديد نوع الإعلان
  const getAnnouncementType = () => {
    if (ann.title.includes('تأجيل') || ann.body.includes('تأجيل') || 
        ann.title.includes('مؤجل') || ann.body.includes('مؤجل')) {
      return 'postponement';
    }
    if (ann.title.includes('إلغاء') || ann.body.includes('إلغاء')) {
      return 'cancellation';
    }
    if (ann.title.includes('تغيير') || ann.body.includes('تغيير')) {
      return 'change';
    }
    return 'general';
  };

  const announcementType = getAnnouncementType();

  // إعدادات التصميم حسب نوع الإعلان
  const typeConfig = {
    postponement: {
      iconName: 'calendar',
      color: '#ffc107',
      bgGradient: 'linear-gradient(135deg, #fff3cd 0%, #ffffff 100%)',
      borderColor: '#ffc107',
      textColor: '#856404'
    },
    cancellation: {
      iconName: 'times-circle',
      color: '#dc3545',
      bgGradient: 'linear-gradient(135deg, #f8d7da 0%, #ffffff 100%)',
      borderColor: '#dc3545',
      textColor: '#721c24'
    },
    change: {
      iconName: 'sync-alt',
      color: '#17a2b8',
      bgGradient: 'linear-gradient(135deg, #d1ecf1 0%, #ffffff 100%)',
      borderColor: '#17a2b8',
      textColor: '#0c5460'
    },
    general: {
      iconName: 'bullhorn',
      color: '#007bff',
      bgGradient: 'linear-gradient(135deg, #d1edff 0%, #ffffff 100%)',
      borderColor: '#007bff',
      textColor: '#004085'
    }
  };

  const config = typeConfig[announcementType];

  // تحليل محتوى إعلان التأجيل
  const parsePostponementInfo = (body) => {
    const info = {};
    if (body.includes('تم تأجيل محاضرة')) {
      try {
        info.subject = body.split('محاضرة ')[1]?.split(' للمدرس')[0];
        info.teacher = body.split('للمدرس ')[1]?.split(' التي كانت')[0];
        info.originalRoom = body.split('القاعة ')[1]?.split(' يوم')[0];
        info.originalDay = body.split('يوم ')[1]?.split(' من الساعة')[0];
        info.originalTime = body.split('الساعة ')[1]?.split('. الموعد الجديد')[0];
        info.newSchedule = body.split('الموعد الجديد: ')[1]?.split(' في القاعة')[0];
        info.newRoom = body.split('في القاعة ')[1]?.split(' من الساعة')[0];
        info.newTime = body.split('من الساعة ')[2]?.split('. السبب')[0];
        info.reason = body.split('السبب: ')[1]?.split('.')[0];
      } catch (e) {
        // في حالة فشل التحليل، استخدم النص الكامل
      }
    }
    return info;
  };

  const postponementInfo = announcementType === 'postponement' ? parsePostponementInfo(ann.body) : null;

  return (
    <Card 
      className={`announcement-card modern-card ${announcementType}-announcement`}
      style={{
        background: config.bgGradient,
        borderLeft: `6px solid ${config.borderColor}`,
        borderRadius: '15px',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}
    >
      <Card.Body className="p-4">
        {/* Header */}
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div className="d-flex align-items-center gap-3">
            <div 
              className="announcement-icon"
              style={{
                fontSize: '2.5rem',
                color: config.color,
                background: `${config.color}20`,
                padding: '12px',
                borderRadius: '12px',
                lineHeight: 1
              }}
            >
              <Icon name={config.iconName} />
            </div>
            <div>
              <h4 
                className="announcement-title mb-1"
                style={{ 
                  color: config.textColor,
                  fontWeight: '700',
                  fontSize: '1.3rem',
                  lineHeight: '1.2'
                }}
              >
                {ann.title}
              </h4>
              <div className="d-flex align-items-center gap-2">
                <Badge 
                  bg={ann.is_active ? 'success' : 'secondary'}
                  className="d-flex align-items-center gap-1"
                  style={{ fontSize: '0.8rem' }}
                >
                  <i className={`fas ${ann.is_active ? 'fa-check-circle' : 'fa-pause-circle'}`}></i>
                  {ann.is_active ? 'نشط' : 'متوقف'}
                </Badge>
                <Badge bg="light" text="dark" style={{ fontSize: '0.75rem' }}>
                  {announcementType === 'postponement' ? 'تأجيل' : 
                   announcementType === 'cancellation' ? 'إلغاء' : 
                   announcementType === 'change' ? 'تغيير' : 'عام'}
                </Badge>
              </div>
            </div>
          </div>
          
          {showActions && (
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => onEdit?.(ann)}
                className="action-btn"
              >
                <i className="fas fa-edit"></i>
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => onDelete?.(ann)}
                className="action-btn"
              >
                <i className="fas fa-trash"></i>
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="announcement-content">
          {postponementInfo && Object.keys(postponementInfo).length > 0 ? (
            <div className="postponement-details">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="info-card original-info">
                    <h6 className="info-title">
                      <i className="fas fa-calendar-times text-warning me-2"></i>
                      المعلومات الأصلية
                    </h6>
                    <div className="info-grid">
                      {postponementInfo.subject && (
                        <div className="info-item">
                          <span className="info-label"><Icon name="book" className="me-1" /> المادة:</span>
                          <span className="info-value">{postponementInfo.subject}</span>
                        </div>
                      )}
                      {postponementInfo.teacher && (
                        <div className="info-item">
                          <span className="info-label"><Icon name="teacher" className="me-1" /> المدرس:</span>
                          <span className="info-value">{postponementInfo.teacher}</span>
                        </div>
                      )}
                      {postponementInfo.originalRoom && (
                        <div className="info-item">
                          <span className="info-label"><Icon name="university" className="me-1" /> القاعة:</span>
                          <span className="info-value">{postponementInfo.originalRoom}</span>
                        </div>
                      )}
                      {postponementInfo.originalDay && (
                        <div className="info-item">
                          <span className="info-label"><Icon name="calendar" className="me-1" /> اليوم:</span>
                          <span className="info-value">{postponementInfo.originalDay}</span>
                        </div>
                      )}
                      {postponementInfo.originalTime && (
                        <div className="info-item">
                          <span className="info-label"><Icon name="clock" className="me-1" /> الوقت:</span>
                          <span className="info-value">{postponementInfo.originalTime}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="info-card new-info">
                    <h6 className="info-title">
                      <i className="fas fa-calendar-check text-success me-2"></i>
                      الموعد الجديد
                    </h6>
                    <div className="info-grid">
                      {postponementInfo.newSchedule && (
                        <div className="info-item">
                          <span className="info-label"><Icon name="calendar" className="me-1" /> التاريخ:</span>
                          <span className="info-value new-value">{postponementInfo.newSchedule}</span>
                        </div>
                      )}
                      {postponementInfo.newRoom && (
                        <div className="info-item">
                          <span className="info-label"><Icon name="university" className="me-1" /> القاعة:</span>
                          <span className="info-value new-value">{postponementInfo.newRoom}</span>
                        </div>
                      )}
                      {postponementInfo.newTime && (
                        <div className="info-item">
                          <span className="info-label"><Icon name="clock" className="me-1" /> الوقت:</span>
                          <span className="info-value new-value">{postponementInfo.newTime}</span>
                        </div>
                      )}
                      {postponementInfo.reason && (
                        <div className="info-item">
                          <span className="info-label"><Icon name="tag" className="me-1" /> السبب:</span>
                          <span className="info-value">{postponementInfo.reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="general-content">
              <p 
                className={`announcement-body ${isExpanded ? 'expanded' : ''}`}
                style={{ 
                  color: config.textColor,
                  lineHeight: '1.6',
                  margin: 0
                }}
              >
                {ann.body}
              </p>
              {ann.body.length > 200 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-0 mt-2"
                  style={{ color: config.color }}
                >
                  {isExpanded ? 'عرض أقل' : 'عرض المزيد'}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {(ann.starts_at || ann.expires_at) && (
          <div className="announcement-footer mt-3 pt-3 border-top">
            <div className="d-flex flex-wrap gap-3 text-muted">
              {ann.starts_at && (
                <div className="d-flex align-items-center gap-1">
                  <i className="fas fa-play-circle text-success"></i>
                  <small>
                    <strong>يبدأ:</strong> {ann.starts_at.replace('T', ' ').slice(0, 16)}
                  </small>
                </div>
              )}
              {ann.expires_at && (
                <div className="d-flex align-items-center gap-1">
                  <i className="fas fa-stop-circle text-warning"></i>
                  <small>
                    <strong>ينتهي:</strong> {ann.expires_at.replace('T', ' ').slice(0, 16)}
                  </small>
                </div>
              )}
              <div className="d-flex align-items-center gap-1">
                <i className="fas fa-calendar-alt text-primary"></i>
                <small>
                  <strong>تاريخ الإنشاء:</strong> {new Date(ann.created_at).toLocaleDateString('ar-SA')}
                </small>
              </div>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default AnnouncementCard;
