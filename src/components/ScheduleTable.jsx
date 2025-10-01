import React from 'react';
import { Table, Badge } from 'react-bootstrap';
import CountdownTimer from './CountdownTimer';
import Icon from './Icon';

const ScheduleTable = ({ scheduleData, studyType }) => {
  const days = {
    sunday: 'الأحد',
    monday: 'الاثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت'
  };

  const stages = {
    first: 'المرحلة الأولى',
    second: 'المرحلة الثانية',
    third: 'المرحلة الثالثة',
    fourth: 'المرحلة الرابعة'
  };

  const studyTypeText = studyType === 'morning' ? 'الدراسة الصباحية' : 'الدراسة المسائية';

  const getVariant = (stage) => {
    switch (stage) {
      case 'first': return 'primary';
      case 'second': return 'success';
      case 'third': return 'warning';
      case 'fourth': return 'danger';
      default: return 'secondary';
    }
  };

  const formatTo12Hour = React.useCallback((timeStr) => {
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return timeStr || '';
    const [hhStr, mmStr] = timeStr.split(':');
    let hh = parseInt(hhStr, 10);
    const mm = parseInt(mmStr, 10);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return timeStr;

    const ampm = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12;
    hh = hh === 0 ? 12 : hh; // the hour '0' should be '12'
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')} ${ampm}`;
  }, []);

  const getStageColor = (stage) => {
    const stageColors = {
      first: '#0d6efd',   // primary
      second: '#198754',  // success
      third: '#ffc107',   // warning
      fourth: '#dc3545'   // danger
    };
    return stageColors[stage] || '#6c757d';
  };

  const getStageBackgroundColor = (stage) => {
    const stageBackgrounds = {
      first: '#e7f1ff',   // tint of primary
      second: '#e8f5ec',  // tint of success
      third: '#fff7d6',   // tint of warning
      fourth: '#fde2e4'   // tint of danger
    };
    return stageBackgrounds[stage] || '#f8f9fa';
  };

  const getStageGradientBackground = (stage) => {
    const gradients = {
      first: ['#e7f1ff', '#ffffff'],
      second: ['#e8f5ec', '#ffffff'],
      third: ['#fff7d6', '#ffffff'],
      fourth: ['#fde2e4', '#ffffff']
    };
    const [c1, c2] = gradients[stage] || ['#f7f9fc', '#ffffff'];
    return `linear-gradient(145deg, ${c1} 0%, ${c2} 100%)`;
  };

  const subjectStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #e5eaf2',
    borderRadius: '14px',
    padding: '16px',
    margin: '10px 0',
    fontSize: '14px',
    lineHeight: 1.7,
    boxShadow: '0 10px 20px rgba(17, 24, 39, 0.06)'
  };

  const subjectHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8
  };

  const stageBadgeBaseStyle = {
    backgroundColor: '#eef2ff',
    color: '#1e3a8a',
    padding: '2px 10px',
    borderRadius: 9999,
    fontSize: 12,
    fontWeight: 700,
    border: '1px solid #dbe4f3'
  };

  const dividerStyle = {
    borderTop: '1px solid #eef2f7',
    margin: '10px 0'
  };

  return (
    <div className="schedule-table-container">
      <div className="text-center mb-4">
        <h4>{studyTypeText}</h4>
        <Badge bg="info" className="fs-6">{scheduleData.room?.name} - {scheduleData.room?.department?.name || scheduleData.room?.department_name || 'غير محدد'}</Badge>
      </div>

      {Object.entries(days).map(([dayKey, dayName]) => {
        const daySchedules = scheduleData.schedule?.[dayKey];
        const hasSchedules = daySchedules && Object.values(daySchedules).some(stageSchedules => stageSchedules.length > 0);

        if (!hasSchedules) return null;

        return (
          <div key={dayKey} className="mb-4">
            <h5 className="text-primary border-bottom pb-2">{dayName}</h5>
            
            {Object.entries(stages).map(([stageKey, stageName]) => {
              const stageSchedules = daySchedules[stageKey] || [];
              
              if (stageSchedules.length === 0) return null;

              return (
                <div key={stageKey} className="mb-3">
                  <Badge bg={getVariant(stageKey)} className="mb-2">{stageName}</Badge>
                  
                  <div className="lecture-cards-container">
                      {stageSchedules.map((schedule, index) => (
                        <div key={index} style={{
                          ...subjectStyle,
                          borderRight: `6px solid ${getStageColor(stageKey)}`,
                          background: getStageGradientBackground(stageKey)
                        }}>
                          <div style={subjectHeaderStyle}>
                            <div style={{ fontWeight: 900, color: '#111827', fontSize: 15 }}>
                              {schedule.subject_name || '—'}
                            </div>
                            <div style={{
                              ...stageBadgeBaseStyle,
                              backgroundColor: getStageBackgroundColor(stageKey),
                              color: '#111827',
                              borderColor: '#e5e7eb'
                            }}>
                              {stages[stageKey]} {/* Display stage name */}
                            </div>
                          </div>
                          <div style={dividerStyle}></div>
                          
                          {/* عداد المحاضرة */}
                          <CountdownTimer 
                            startTime={schedule.start_time} 
                            endTime={schedule.end_time} 
                            dayOfWeek={dayKey}
                          />
                          
                          <div style={{ fontSize: 13, color: '#374151' }}>
                            الوقت: {formatTo12Hour(schedule.start_time)} - {formatTo12Hour(schedule.end_time)}
                          </div>
                          {/* Display multiple doctors if available */}
                          {schedule.has_multiple_doctors ? (
                            <div style={{ fontSize: 13, color: '#374151' }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                <Icon name="users" className="me-2" /> المدرّسون:
                              </div>
                              {schedule.multiple_doctors_names?.map((name, index) => (
                                <div key={index} style={{ 
                                  marginBottom: '2px',
                                  fontWeight: name === schedule.primary_doctor_name ? 'bold' : 'normal',
                                  color: name === schedule.primary_doctor_name ? '#198754' : '#374151'
                                }}>
                                  {name === schedule.primary_doctor_name && <Icon name="star" className="me-1 text-warning" />}
                                  {name}
                                  {name === schedule.primary_doctor_name && ' (أساسي)'}
                                </div>
                              ))}
                            </div>
                          ) : (
                            (schedule.doctors?.name || schedule.instructor_name) && (
                              <div style={{ fontSize: 13, color: '#374151' }}>
                                <Icon name="teacher" className="me-2" /> المدرّس: {schedule.doctors?.name || schedule.instructor_name}
                              </div>
                            )
                          )}
                          {schedule.notes && (
                            <div style={{ fontSize: 13, color: '#374151' }}>
                              ملاحظات: {schedule.notes}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {!Object.values(scheduleData.schedule || {}).some(day => 
        Object.values(day).some(stage => stage.length > 0)
      ) && (
        <div className="text-center text-muted mt-5">
          <h5>لا توجد جداول محددة لهذا النوع من الدراسة</h5>
        </div>
      )}
    </div>
  );
};

export default ScheduleTable;
