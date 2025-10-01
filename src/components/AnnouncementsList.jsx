import React from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';
import AnnouncementCard from './AnnouncementCard';
import '../styles/announcements.css';

const AnnouncementsList = ({ 
  announcements, 
  loading, 
  error, 
  showActions = false,
  onEdit,
  onDelete,
  title = "الإعلانات",
  emptyMessage = "لا توجد إعلانات حالياً"
}) => {
  if (loading) {
    return (
      <div className="announcements-loading">
        <i className="fas fa-spinner"></i>
        <p>جاري تحميل الإعلانات...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="announcements-error">
        <i className="fas fa-exclamation-triangle"></i>
        {error}
      </div>
    );
  }

  return (
    <div className="announcements-section">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="announcement-section-title">
          <i className="fas fa-bullhorn"></i>
          {title}
        </h4>
        <Badge className="announcement-badge">
          {announcements.length} إعلان
        </Badge>
      </div>
      
      {announcements.length > 0 ? (
        <div className="announcements-container">
          <Row className="g-4">
            {announcements.map((announcement) => (
              <Col xs={12} key={announcement.id}>
                <AnnouncementCard 
                  ann={announcement}
                  showActions={showActions}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </Col>
            ))}
          </Row>
        </div>
      ) : (
        <div className="announcements-empty">
          <i className="fas fa-inbox"></i>
          <h5>{emptyMessage}</h5>
          <p>ابدأ بإضافة إعلان جديد</p>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsList;
