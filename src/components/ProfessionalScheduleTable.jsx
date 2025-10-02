import React, { useState } from 'react';
import { Table, Modal, Button, Alert, Form } from 'react-bootstrap';
import axios from 'axios';
import { getAuthHeaders } from '../utils/auth';
import CountdownTimer from './CountdownTimer';
import Icon from './Icon';

import './ProfessionalScheduleTable.css';
import '../styles/mobile-schedule-responsive.css';

const ProfessionalScheduleTable = ({ scheduleData, studyType, onShowWeeklySchedule }) => {
  // زر تصفية الجدول حسب رقم الطالب
  const [studentIdInput, setStudentIdInput] = useState('');
  const [showStudentFilterModal, setShowStudentFilterModal] = useState(false);
  const [studentFilterError, setStudentFilterError] = useState('');
  const [filteredScheduleData, setFilteredScheduleData] = useState(null);
  const [studentModalSchedule, setStudentModalSchedule] = useState(null);

  // Effect to filter schedule when student ID changes
  React.useEffect(() => {
    const filterScheduleByStudent = async () => {
      if (!studentIdInput.trim()) {
        setStudentFilterError('');
        setFilteredScheduleData(null);
        setStudentModalSchedule(null);
        return;
      }
      
      if (studentIdInput.length !== 4 || !/^\d+$/.test(studentIdInput)) {
        setStudentFilterError('الرقم الجامعي يجب أن يتكون من 4 أرقام فقط.');
        setFilteredScheduleData(null);
        setStudentModalSchedule(null);
        return;
      }

      setStudentFilterError('');
      try {
        const defaultOrigin = (() => {
          try {
            const origin = window.location.origin || `${window.location.protocol}//${window.location.hostname}`;
            return origin.replace(/:\d+$/, ':5000');
          } catch (e) {
            return 'http://127.0.0.1:5000';
          }
        })();
        const API_URL = process.env.REACT_APP_API_URL || defaultOrigin;
        // إذا كان لديك توكن مصادقة أضفه هنا
        const headers = getAuthHeaders();

        // جلب بيانات الطالب
        const studentRes = await axios.get(`${API_URL}/api/students/get_student_by_id/${studentIdInput}`, { headers });
        const student = studentRes.data;

        if (!student) {
          setStudentFilterError('لم يتم العثور على طالب بهذا الرقم الجامعي.');
          setFilteredScheduleData(null);
          setStudentModalSchedule(null);
          return;
        }

        // جلب جدول الطالب مباشرة من الواجهة الخلفية
        const studentScheduleRes = await axios.get(`${API_URL}/api/students/get_student_full_schedule/${studentIdInput}`, { headers });
        const studentScheduleData = studentScheduleRes.data.student_schedule;

        if (studentScheduleData) {
          // Organize student schedule data by day
          const organizedStudentSchedule = {};
          const daysOrder = [
            'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
          ];
          daysOrder.forEach(day => {
            organizedStudentSchedule[day] = studentScheduleData.filter(s => s.day_of_week === day);
          });
          setStudentModalSchedule(organizedStudentSchedule);
        } else {
          setStudentModalSchedule({}); // No schedule found
        }
      } catch (error) {
        setStudentFilterError('حدث خطأ أثناء تصفية الجدول.');
        setFilteredScheduleData(null);
        setStudentModalSchedule(null);
      }
    };

    filterScheduleByStudent();
  }, [studentIdInput, scheduleData]);

  const handleShowWeeklySchedule = () => {
    if (onShowWeeklySchedule) {
      onShowWeeklySchedule(selectedStage, selectedWeeklyStudyType);
    }
    setShowWeeklyModal(false);
  };
  
  const [showPostponementModal, setShowPostponementModal] = useState(false);
  const [selectedPostponement, setSelectedPostponement] = useState(null);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState('first');
  const [selectedWeeklyStudyType, setSelectedWeeklyStudyType] = useState('morning');

  

  // تسميات الأيام (شامل كل الأيام)
  const dayLabels = {
    sunday: 'الأحد',
    monday: 'الاثنين',
    tuesday: 'الثلاثاء', 
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت'
  };

  // Map dates to day names for future relocations
  const getDayNameFromDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  const timeSlots = React.useMemo(() => ([
    { start: '08:30', end: '10:30' },
    { start: '10:30', end: '12:30' },
    { start: '12:30', end: '02:30' },
    { start: '02:30', end: '04:30' },
    { start: '04:30', end: '06:30' }
  ]), []);

  const studyTypeText = studyType === 'morning' ? 'الدراسة الصباحية' : 'الدراسة المسائية';
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  // تنسيق الوقت إلى صيغة 12 ساعة (01:00 - 12:59)
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

  // بناء فترات زمنية ديناميكية من بيانات اليوم الحالي
  const highlightKey = scheduleData?.highlightDayKey || null;
      const dynamicTimeSlots = React.useMemo(() => {
      if (!highlightKey || !scheduleData?.schedule || !scheduleData.schedule[highlightKey]) return [];
      const dayData = scheduleData.schedule[highlightKey];
      const pairSet = new Set();
      Object.values(dayData).forEach((stageList) => {
        (stageList || []).forEach((s) => {
          // Use temporary times for temporary schedules
          const startTime = s.is_temporary_schedule ? s.temporary_start_time : s.start_time;
          const endTime = s.is_temporary_schedule ? s.temporary_end_time : s.end_time;
          if (startTime && endTime) {
            pairSet.add(`${startTime}-${endTime}`);
          }
        });
      });
      const toMinutes = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      const arr = Array.from(pairSet).map((k) => {
        const [start, end] = k.split('-');
        return { start, end };
      });
      arr.sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
      return arr;
    }, [highlightKey, scheduleData]);

  // الفترات المستخدمة فعلياً (ديناميكية وإلا افتراضية)
  const visibleTimeSlots = React.useMemo(() => (
    dynamicTimeSlots.length > 0 ? dynamicTimeSlots : timeSlots
  ), [dynamicTimeSlots, timeSlots]);

  // تنظيم البيانات في شبكة زمنية بالاعتماد على الفترات المختارة
  const organizedData = React.useMemo(() => {
    const data = {};
    const sourceData = scheduleData.schedule; // Always use the original scheduleData.schedule for the main table

    const daysFromData = Object.keys(sourceData || {});
    daysFromData.forEach((day) => {
      data[day] = {};
      visibleTimeSlots.forEach((slot) => {
        data[day][`${slot.start}-${slot.end}`] = [];
      });
    });

    // Add schedules
    if (sourceData) {
      Object.entries(sourceData).forEach(([dayKey, dayData]) => {
        Object.entries(dayData).forEach(([stageKey, stageSchedules]) => {
          (stageSchedules || []).forEach((s) => {
            const key = `${s.start_time}-${s.end_time}`;
            if (data[dayKey] && data[dayKey][key]) {
              data[dayKey][key].push({ ...s, stage: stageKey });
            }
          });
        });
      });
    }

    return data;
  }, [visibleTimeSlots, scheduleData]);

  const getStageText = (stage) => {
    switch (stage) {
      case 'first': return 'المرحلة الأولى';
      case 'second': return 'المرحلة الثانية';
      case 'third': return 'المرحلة الثالثة';
      case 'fourth': return 'المرحلة الرابعة';
      default: return '';
    }
  };

  const getStageColor = (stage) => {
    const stageColors = {
      first: '#007BFF',
      second: '#007BFF',
      third: '#007BFF',
      fourth: '#007BFF'
    };
    return stageColors[stage] || '#1A2B4C';
  };

  const getStageBackgroundColor = (stage) => {
    const stageBackgrounds = {
      first: '#EBF5FF',
      second: '#EBF5FF',
      third: '#EBF5FF',
      fourth: '#EBF5FF'
    };
    return stageBackgrounds[stage] || '#F8F9FA';
  };

  // خلفية متدرجة لطيفة لبطاقة المادة حسب المرحلة
  const getStageGradientBackground = (stage) => {
    const gradients = {
      first: ['#EBF5FF', '#FFFFFF'],
      second: ['#EBF5FF', '#FFFFFF'],
      third: ['#EBF5FF', '#FFFFFF'],
      fourth: ['#EBF5FF', '#FFFFFF']
    };
    const [c1, c2] = gradients[stage] || ['#F8F9FA', '#FFFFFF'];
    return `linear-gradient(145deg, ${c1} 0%, ${c2} 100%)`;
  };

  const tableStyle = {
    width: '100%',
    border: '2px solid #ADD8E6',
    borderCollapse: 'collapse',
    fontSize: 'clamp(12px, 2vw, 14px)',
    fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif",
    boxShadow: '0 6px 14px rgba(0, 123, 255, 0.06)',
    backgroundColor: '#F8F9FA',
    minWidth: '100%',
    overflowX: 'auto'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #007BFF 0%, #0056B3 100%)',
    color: '#FFFFFF',
    border: '1px solid #ADD8E6',
    textAlign: 'center',
    padding: 'clamp(10px, 2vw, 14px) clamp(6px, 1.5vw, 10px)',
    fontWeight: 700,
    fontSize: 'clamp(12px, 2.2vw, 15px)',
    letterSpacing: '0.2px',
    whiteSpace: 'nowrap'
  };

  const dayHeaderStyle = {
    background: 'linear-gradient(135deg, #007BFF 0%, #0056B3 100%)',
    color: '#FFFFFF',
    border: '1px solid #ADD8E6',
    textAlign: 'center',
    padding: 'clamp(12px, 2.5vw, 16px) clamp(6px, 1.5vw, 10px)',
    fontWeight: 800,
    verticalAlign: 'middle',
    fontSize: 'clamp(13px, 2.5vw, 15px)',
    whiteSpace: 'nowrap',
    minWidth: '80px'
  };

  const cellStyle = {
    border: '1px solid #F8F9FA',
    padding: 'clamp(8px, 1.5vw, 12px)',
    textAlign: 'center',
    verticalAlign: 'top',
    minHeight: 'clamp(90px, 15vw, 110px)',
    backgroundColor: '#FFFFFF',
    minWidth: 'clamp(150px, 20vw, 200px)'
  };

  const subjectStyle = {
    backgroundColor: '#FFFFFF',
    border: '1px solid #ADD8E6',
    borderRadius: 'clamp(10px, 2vw, 14px)',
    padding: 'clamp(10px, 2.5vw, 16px)',
    margin: 'clamp(6px, 1.5vw, 10px) 0',
    fontSize: 'clamp(12px, 2vw, 14px)',
    lineHeight: 1.7,
    boxShadow: '0 10px 20px rgba(0, 123, 255, 0.06)',
    wordBreak: 'break-word',
    hyphens: 'auto'
  };

  const stageCellStyle = {
    backgroundColor: '#EBF5FF',
    color: '#1A2B4C',
    fontWeight: 800,
    border: '1px solid #ADD8E6',
    textAlign: 'center',
    padding: 'clamp(8px, 2vw, 12px)',
    whiteSpace: 'nowrap',
    fontSize: 'clamp(11px, 1.8vw, 13px)',
    minWidth: '80px'
  };

  // Removed unused text style constants to satisfy linter

  const subjectHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
    color: '#1A2B4C' // Added color for consistency
  };

  const stageBadgeBaseStyle = {
    backgroundColor: '#EBF5FF',
    color: '#1A2B4C',
    padding: 'clamp(2px, 0.5vw, 4px) clamp(6px, 1.5vw, 10px)',
    borderRadius: 9999,
    fontSize: 'clamp(10px, 1.5vw, 12px)',
    fontWeight: 700,
    border: '1px solid #ADD8E6',
    whiteSpace: 'nowrap'
  };

  const typeBadgeStyle = {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: 12,
    fontWeight: 800,
    fontSize: 'clamp(11px, 1.6vw, 13px)',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    textAlign: 'center',
    boxShadow: '0 4px 10px rgba(2,6,23,0.06)'
  };

  const dividerStyle = {
    borderTop: '1px solid #F8F9FA',
    margin: '10px 0'
  };

  const cardStyles = {
    theoretical: {
      backgroundColor: '#FFFFFF',
      border: '1px solid #ADD8E6',
      borderRadius: 'clamp(10px, 2vw, 14px)',
      padding: 'clamp(10px, 2.5vw, 16px)',
      margin: 'clamp(6px, 1.5vw, 10px) 0',
      fontSize: 'clamp(12px, 2vw, 14px)',
      lineHeight: 1.7,
      boxShadow: '0 10px 20px rgba(0, 123, 255, 0.06)',
      wordBreak: 'break-word',
      hyphens: 'auto',
      borderLeft: '6px solid #0dcaf0' // info color for theoretical
    },
    practical: {
      backgroundColor: '#FFFFFF',
      border: '1px solid #ADD8E6',
      borderRadius: 'clamp(10px, 2vw, 14px)',
      padding: 'clamp(10px, 2.5vw, 16px)',
      margin: 'clamp(6px, 1.5vw, 10px) 0',
      fontSize: 'clamp(12px, 2vw, 14px)',
      lineHeight: 1.7,
      boxShadow: '0 10px 20px rgba(0, 123, 255, 0.06)',
      wordBreak: 'break-word',
      hyphens: 'auto',
      borderLeft: '6px solid #28a745' // success color for practical
    }
  };

  // Function to get lecture type description
  const getLectureTypeDescription = (schedule) => {
    if (schedule.lecture_type === 'نظري' || schedule.lecture_type === 'theoretical') {
      return `نظري - شعبة ${schedule.section || schedule.section_number || '-'}`;
    } else if (schedule.lecture_type === 'عملي' || schedule.lecture_type === 'practical') {
      return `عملي - كروب ${schedule.group || schedule.group_letter || '-'}`;
    }
    return 'غير محدد';
  };

  

  // Function to open postponement modal
  const openPostponementModal = (postponementData) => {
    setSelectedPostponement(postponementData);
    setShowPostponementModal(true);
  };

  // Function to close postponement modal
  const closePostponementModal = () => {
    setShowPostponementModal(false);
    setSelectedPostponement(null);
  };

  return (
    <>
      <div style={{ padding: '20px', backgroundColor: '#FFFFFF', borderRadius: '8px' }}>
      {/* عنوان الجدول */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '16px',
        background: 'linear-gradient(135deg, #007BFF 0%, #0056B3 100%)',
        color: 'white',
        padding: 'clamp(12px, 3vw, 16px)',
        borderRadius: 'clamp(8px, 2vw, 10px)',
        boxShadow: '0 6px 14px rgba(0, 123, 255, 0.12)'
      }}>
        <h3 style={{ margin: 0, color: 'white', fontSize: '20px', fontWeight: 800 }}>
          جدول قاعة {scheduleData.room?.name || scheduleData.room?.code || ''} — {studyTypeText}
        </h3>
        <div style={{ opacity: 0.9, marginTop: 6, fontSize: 13 }}>
          العام الدراسي {currentYear}-{nextYear}
        </div>
      </div>

      {/* الجدول الرئيسي - مخفي على الهواتف المحمولة */}
      <div 
        className="desktop-table-container d-none d-md-block"
        style={{ 
          overflowX: 'auto', 
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0, 123, 255, 0.1)',
          border: '1px solid #E5E7EB',
          backgroundColor: 'white'
        }}
      >
        <Table style={tableStyle} className="desktop-schedule-table d-none d-md-table">
        <thead>
          <tr>
            <th style={headerStyle}>اليوم</th>
            {visibleTimeSlots.map((slot, index) => (
              <th key={index} style={headerStyle}>
                <div style={{ textAlign: 'center' }}>
                  <div>{formatTo12Hour(slot.start)}</div>
                  <div>{formatTo12Hour(slot.end)}</div>
                  <div style={{ fontSize: '10px', fontWeight: 'normal', color: '#e6efff' }}>الوقت</div>
                </div>
              </th>
            ))}
            <th style={headerStyle}>المرحلة</th>
          </tr>
        </thead>
        <tbody>
          {(highlightKey ? [highlightKey] : Object.keys(organizedData)).map((dayKey) => (
            <tr key={dayKey}>
              <td style={dayHeaderStyle}>
                {dayLabels[dayKey] || dayKey}
              </td>
              {visibleTimeSlots.map((slot, timeIndex) => {
                const timeKey = `${slot.start}-${slot.end}`;
                const cellSchedules = organizedData[dayKey][timeKey] || [];
                
                return (
                  <td key={timeIndex} style={cellStyle}>
                    {cellSchedules.length > 0 ? (
                      <div>
                        
                        {cellSchedules.map((schedule, scheduleIndex) => (
                          <div
                            key={scheduleIndex}
                            className={"subject-card " + ((schedule.lecture_type === 'عملي' || schedule.lecture_type === 'practical') ? 'practical' : 'theoretical')}
                            style={{
                              ...(schedule.lecture_type === 'عملي' || schedule.lecture_type === 'practical' ? cardStyles.practical : cardStyles.theoretical)
                            }}
                          >
                            <div style={subjectHeaderStyle}>
                              <div 
                                className="subject-header mobile-header-text arabic-text"
                                style={{ 
                                  fontWeight: 900, 
                                  color: '#111827', 
                                  fontSize: 'clamp(13px, 2.5vw, 15px)',
                                  lineHeight: '1.3',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                  whiteSpace: 'normal',
                                  textAlign: 'center'
                                }}
                              >
                                {schedule.subject_name || '—'}
                                {schedule.is_postponed && (
                                  <span style={{
                                    backgroundColor: '#fef3c7',
                                    color: '#92400e',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    marginRight: '6px'
                                  }}>
                                    مؤجل
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                <div style={{
                                  ...stageBadgeBaseStyle,
                                  backgroundColor: getStageBackgroundColor(schedule.stage),
                                  color: '#111827',
                                  borderColor: '#e5e7eb'
                                }}>
                                  {getStageText(schedule.stage)}
                                </div>

                                {/* Lecture type badge (desktop) */}
                                <div
                                  className={`lecture-type-badge ${ (schedule.lecture_type === 'عملي' || schedule.lecture_type === 'practical') ? 'practical' : 'theoretical' }`}
                                  style={{
                                    ...typeBadgeStyle,
                                    background: (schedule.lecture_type === 'عملي' || schedule.lecture_type === 'practical') ? 'linear-gradient(90deg,#ecfdf5,#dcfce7)' : 'linear-gradient(90deg,#ebf8ff,#e6f7ff)',
                                    color: (schedule.lecture_type === 'عملي' || schedule.lecture_type === 'practical') ? '#065f46' : '#065f9e',
                                    border: (schedule.lecture_type === 'عملي' || schedule.lecture_type === 'practical') ? '1px solid #bbf7d0' : '1px solid #bfefff'
                                  }}
                                >
                                  {schedule.lecture_type && (schedule.lecture_type === 'عملي' || schedule.lecture_type === 'practical')
                                    ? `عملي — الكروب ${schedule.group || schedule.group_letter || '-'}`
                                    : `نظري — الشعبة ${schedule.section || schedule.section_number || '-'}`}
                                </div>

                              </div>
                            </div>

                            <div style={dividerStyle}></div>
                            
                            {/* عداد المحاضرة */}
                            <CountdownTimer 
                              startTime={schedule.start_time} 
                              endTime={schedule.end_time} 
                              dayOfWeek={dayKey}
                            />
                            
                            <div style={{ fontSize: 'clamp(11px, 1.8vw, 13px)', color: '#1A2B4C', marginBottom: 4 }}>
                              <span style={{ marginRight: '5px' }}>🕒</span> {formatTo12Hour(schedule.start_time)} - {formatTo12Hour(schedule.end_time)}
                            </div>
                            <div style={{ fontSize: 'clamp(10px, 1.6vw, 12px)', color: '#1f2937', marginBottom: 6 }}>
                              <span style={{ marginRight: '5px' }}>📍</span> القاعة: {
                                schedule.is_postponed && schedule.postponed_to_room_id
                                  ? `القاعة المؤقتة (${schedule.postponed_to_room_id})`
                                  : (scheduleData.room?.name || scheduleData.room?.code || '—')
                              }
                              {schedule.is_postponed && (
                                <span style={{
                                  backgroundColor: '#fef3c7',
                                  color: '#92400e',
                                  padding: '2px 4px',
                                  borderRadius: '3px',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  marginRight: '4px',
                                  marginLeft: '4px'
                                }}>
                                  مؤجلة
                                </span>
                              )}
                            </div>
                            {/* Multiple doctors display */}
                            {schedule.has_multiple_doctors ? (
                              <div style={{ fontSize: 'clamp(11px, 1.8vw, 13px)', color: '#374151' }}>
                                <div style={{ marginBottom: 4 }}><span style={{ marginRight: '5px' }}>👥</span> المدرّسون:</div>
                                {schedule.multiple_doctors_names?.map((name, index) => (
                                  <div key={index} style={{ 
                                    marginBottom: '2px',
                                    fontWeight: name === schedule.primary_doctor_name ? 'bold' : 'normal',
                                    color: name === schedule.primary_doctor_name ? '#198754' : '#374151',
                                    fontSize: 'clamp(10px, 1.6vw, 12px)',
                                    lineHeight: '1.3'
                                  }}>
                                    {name === schedule.primary_doctor_name && '⭐ '}
                                    {name}
                                    {name === schedule.primary_doctor_name && ' (أساسي)'}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              schedule.instructor_name && (
                                schedule.instructor_name.includes(' + ')
                                  ? (
                                    <div style={{ fontSize: 'clamp(11px, 1.8vw, 13px)', color: '#374151' }}>
                                      <div style={{ marginBottom: 4 }}><span style={{ marginRight: '5px' }}>👨‍🏫</span> المدرّسون:</div>
                                      {schedule.instructor_name.split(' + ').map((name, index) => (
                                        <div key={index} style={{ 
                                          marginBottom: '1px',
                                          fontSize: 'clamp(10px, 1.6vw, 12px)',
                                          lineHeight: '1.3'
                                        }}>
                                          {name}
                                        </div>
                                      ))}
                                    </div>
                                  )
                                  : (
                                    <div style={{ fontSize: 'clamp(11px, 1.8vw, 13px)', color: '#374151' }}>
                                      <span style={{ marginRight: '5px' }}>👨‍🏫</span> المدرّس: {schedule.doctors?.name || schedule.instructor_name || 'غير محدد'}
                                    </div>
                                  )
                              )
                            )}
                            {schedule.notes && (
                              <div style={{ 
                                fontSize: 'clamp(10px, 1.6vw, 12px)', 
                                color: '#555', 
                                marginTop: 6, 
                                fontStyle: 'italic',
                                lineHeight: '1.4',
                                wordBreak: 'break-word'
                              }}>
                                <span style={{ marginRight: '5px' }}>📝</span> ملاحظات: {schedule.notes}
                              </div>
                            )}
                            {schedule.is_postponed && (
                              <div style={{ 
                                fontSize: 11, 
                                color: '#92400e', 
                                backgroundColor: '#fffbec',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                marginTop: '6px',
                                border: '1px dashed #facc15'
                              }}>
                                <div><strong>تم تأجيل هذه المحاضرة</strong></div>
                                {schedule.postponed_date && (
                                  <div>التاريخ: {schedule.postponed_date}</div>
                                )}
                                <div>الوقت المؤقت: {schedule.postponed_start_time} - {schedule.postponed_end_time}</div>
                                {schedule.postponed_to_room_id && (
                                  <div>القاعة المؤقتة: {schedule.postponed_room_name || schedule.postponed_to_room_id}</div>
                                )}
                                <div>السبب: {schedule.postponed_reason}</div>
                              </div>
                            )}
                            {/* Temporarily moved indicator for admin panel */}
                            {schedule.is_postponed && window.location.pathname.includes('/admin') && (
                              <div 
                                style={{
                                  marginTop: '8px',
                                  padding: '6px 10px',
                                  backgroundColor: '#fff3cd',
                                  border: '1px solid #ffeaa7',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  color: '#856404',
                                  cursor: 'pointer',
                                  textAlign: 'center'
                                }}
                                onClick={() => openPostponementModal(schedule)}
                              >
                                <strong>Temporarily moved</strong>
                                <div style={{ fontSize: '10px', marginTop: '2px' }}>
                                  انقر لعرض التفاصيل
                                </div>
                              </div>
                            )}
                            {schedule.is_moved_in_display && (
                              <div style={{ 
                                fontSize: 11, 
                                color: '#0f766e', 
                                backgroundColor: '#f0fdfa',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                marginTop: '6px',
                                border: '1px dashed #2dd4bf'
                              }}>
                                <div><strong>تم نقل هذه المحاضرة بشكل مؤقت من:</strong></div>
                                <div>القاعة الأصلية: {schedule.original_room_name || schedule.original_room_id}</div>
                                {schedule.original_booking_date && (
                                  <div>التاريخ الأصلي: {schedule.original_booking_date}</div>
                                )}
                                {schedule.original_start_time && schedule.original_end_time && (
                                  <div>الوقت الأصلي: {formatTo12Hour(schedule.original_start_time)} - {formatTo12Hour(schedule.original_end_time)}</div>
                                )}
                                {schedule.move_reason && (
                                  <div>السبب: {schedule.move_reason}</div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </td>
                );
              })}
              {/* عمود المرحلة لليوم المحدد: إذا وجد أكثر من مرحلة يعرضها كلها */}
              <td style={stageCellStyle}>
                {(() => {
                  const stagesSet = new Set();
                  visibleTimeSlots.forEach((slot) => {
                    const key = `${slot.start}-${slot.end}`;
                    const list = organizedData[dayKey][key] || [];
                    // Add temporary schedule stages as well
                    Object.values(organizedData[dayKey] || {}).forEach(timeSlotSchedules => {
                      timeSlotSchedules.forEach((s) => {
                        if (s.is_temporary_schedule) {
                          const tempTimeKey = `${s.temporary_start_time}-${s.temporary_end_time}`;
                          if (tempTimeKey === key) {
                            stagesSet.add(getStageText(s.stage));
                          }
                        }
                      });
                    });
                    list.forEach((s) => stagesSet.add(getStageText(s.stage)));
                  });
                  const stages = Array.from(stagesSet);
                  return stages.length > 0 ? stages.join(', ') : '-';
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      </div>

      {/* Mobile Cards Layout - Only visible on mobile devices */}
      <div className="mobile-room-schedule-cards d-block d-md-none">
        {/* Show only current day (highlighted day) */}
        {highlightKey && organizedData[highlightKey] && (
          <div key={highlightKey} className="mobile-room-card">
            <div className="mobile-room-card-header">
              <h6 className="mobile-room-card-day">
                {dayLabels[highlightKey] || highlightKey}
              </h6>
            </div>
            <div className="mobile-room-card-body">
              {visibleTimeSlots.map((slot, index) => {
                const timeKey = `${slot.start}-${slot.end}`;
                const cellSchedules = organizedData[highlightKey][timeKey] || [];
                
                return (
                  <div key={index}>
                    {cellSchedules.length > 0 ? (
                      cellSchedules.map((schedule, scheduleIndex) => (
                        <div key={scheduleIndex} className={`mobile-room-schedule-item ${ (schedule.lecture_type === 'عملي' || schedule.lecture_type === 'practical') ? 'practical' : 'theoretical' }`}>
                          <div className="mobile-room-subject-header">
                            <i className="fas fa-book"></i>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <div className="mobile-subject-title" style={{ fontWeight: 800, fontSize: 'clamp(14px, 4vw, 16px)', lineHeight: 1.2 }}>
                                {schedule.subject_name || '—'}
                              </div>
                              <div className="mobile-lecture-type" style={{ fontSize: '12px', color: '#374151', fontWeight: 700 }}>
                                {getLectureTypeDescription(schedule)}
                              </div>
                            </div>
                          </div>

                          <div className="mobile-room-info-grid">
                            {/* عداد المحاضرة للموبايل */}
                            <CountdownTimer 
                              startTime={slot.start} 
                              endTime={slot.end} 
                              dayOfWeek={highlightKey}
                            />
                            
                            <div className="mobile-room-info-item">
                              <div className="mobile-room-info-label">
                                <Icon name="clock" className="me-1" />
                                الوقت
                              </div>
                              <div className="mobile-room-info-value">
                                {formatTo12Hour(slot.start)} - {formatTo12Hour(slot.end)}
                              </div>
                            </div>
                            
                            <div className="mobile-room-info-item">
                              <div className="mobile-room-info-label">
                                <Icon name="university" className="me-1" />
                                القاعة
                              </div>
                              <div className="mobile-room-info-value">
                                <strong className="text-primary">{schedule.rooms?.name || schedule.rooms?.code}</strong>
                              </div>
                            </div>
                            
                            {/* عرض الشعبة فقط للمحاضرات النظرية */}
                            {(schedule.lecture_type === 'theoretical' || schedule.lecture_type === 'نظري') && (
                              <div className="mobile-room-info-item">
                                <div className="mobile-room-info-label">
                                  <Icon name="tag" className="me-1" />
                                  الشعبة
                                </div>
                                <div className="mobile-room-info-value">
                                  <strong className="text-warning">{schedule.section || schedule.section_number || 'غير محدد'}</strong>
                                </div>
                              </div>
                            )}
                            
                            {/* عرض الكروب فقط للمحاضرات العملية */}
                            {(schedule.lecture_type === 'practical' || schedule.lecture_type === 'عملي') && (
                              <div className="mobile-room-info-item">
                                <div className="mobile-room-info-label">
                                  <Icon name="users" className="me-1" />
                                  الكروب
                                </div>
                                <div className="mobile-room-info-value">
                                  <strong className="text-info">{schedule.group || schedule.group_letter || 'غير محدد'}</strong>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {schedule.has_multiple_doctors ? (
                            <div className="mobile-doctor-list">
                              <div className="mobile-schedule-info-label">
                                <Icon name="teacher" className="me-1" />
                                المحاضر
                              </div>
                              <div className="mobile-schedule-info-value">
                                {schedule.has_multiple_doctors ? (
                                  <div className="mobile-doctor-list">
                                    {schedule.multiple_doctors_names?.map((name, nameIndex) => (
                                      <div 
                                        key={nameIndex} 
                                        className={`mobile-doctor-item ${
                                          name === schedule.primary_doctor_name ? 'mobile-primary-doctor' : ''
                                        }`}
                                      >
                                        <strong className={name === schedule.primary_doctor_name ? 'text-success' : 'text-dark'}>
                                          {name === schedule.primary_doctor_name && <Icon name="star" className="me-1 text-warning" />}
                                          {name}
                                          {name === schedule.primary_doctor_name && ' (أساسي)'}
                                        </strong>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <strong className="text-success">
                                    {schedule.doctors?.name || schedule.instructor_name || 'غير محدد'}
                                  </strong>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="mobile-doctor-list">
                              <div className="mobile-schedule-info-label">
                                <Icon name="teacher" className="me-1" />
                                المحاضر
                              </div>
                              <div className="mobile-schedule-info-value">
                                {schedule.has_multiple_doctors ? (
                                  <div className="mobile-doctor-list">
                                    {schedule.multiple_doctors_names?.map((name, nameIndex) => (
                                      <div 
                                        key={nameIndex} 
                                        className={`mobile-doctor-item ${
                                          name === schedule.primary_doctor_name ? 'mobile-primary-doctor' : ''
                                        }`}
                                      >
                                        <strong className={name === schedule.primary_doctor_name ? 'text-success' : 'text-dark'}>
                                          {name === schedule.primary_doctor_name && <Icon name="star" className="me-1 text-warning" />}
                                          {name}
                                          {name === schedule.primary_doctor_name && ' (أساسي)'}
                                        </strong>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <strong className="text-success">
                                    {schedule.doctors?.name || schedule.instructor_name || 'غير محدد'}
                                  </strong>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {schedule.is_postponed && (
                            <div className="mobile-room-postponed-indicator">
                              ⚠️ محاضرة مؤجلة
                            </div>
                          )}
                          
                          {schedule.is_temporary_move_in && (
                            <div className="mobile-room-moved-indicator">
                              🔄 محاضرة منقولة مؤقتاً
                            </div>
                          )}
                        </div>
                      ))
                    ) : null}
                  </div>
                );
              })}
              
              {/* Show empty message if no schedules for the day */}
              {!visibleTimeSlots.some(slot => {
                const timeKey = `${slot.start}-${slot.end}`;
                return organizedData[highlightKey][timeKey] && organizedData[highlightKey][timeKey].length > 0;
              }) && (
                <div className="mobile-room-empty-slot">
                  <i className="fas fa-coffee"></i>
                  لا توجد محاضرات في هذا اليوم
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Show message if no highlighted day */}
        {!highlightKey && (
          <div className="mobile-room-card">
            <div className="mobile-room-card-body">
              <div className="mobile-room-empty-slot">
                <i className="fas fa-calendar-times"></i>
                لا توجد بيانات لعرضها
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal for postponement details */}
      <Modal show={showPostponementModal} onHide={closePostponementModal} size="lg" centered>
        <Modal.Header 
          closeButton
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderBottom: 'none',
            borderRadius: '12px 12px 0 0',
            padding: '20px 25px'
          }}
        >
          <Modal.Title style={{
            color: 'white',
            fontWeight: '700',
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            letterSpacing: '0.5px',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            تفاصيل التأجيل
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body style={{ 
          padding: 'clamp(20px, 4vw, 35px)',
          backgroundColor: '#fafbfc'
        }}>
          {selectedPostponement && (
            <div>
              <h6 style={{
                color: '#2c3e50',
                fontWeight: '700',
                marginBottom: '20px',
                fontSize: 'clamp(15px, 2.2vw, 18px)',
                borderBottom: '3px solid #667eea',
                paddingBottom: '12px'
              }}>
                <i className="fas fa-info-circle me-2" style={{ color: '#667eea' }}></i>
                تفاصيل المحاضرة المؤجلة:
              </h6>
              
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e1e8ed'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#2c3e50' }}>المادة:</strong> 
                  <span style={{ marginRight: '8px', color: '#495057' }}>{selectedPostponement.subject_name}</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#2c3e50' }}>التاريخ الأصلي:</strong> 
                  <span style={{ marginRight: '8px', color: '#495057' }}>{selectedPostponement.postponed_date}</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#2c3e50' }}>الوقت الأصلي:</strong> 
                  <span style={{ marginRight: '8px', color: '#495057' }}>{selectedPostponement.postponed_start_time} - {selectedPostponement.postponed_end_time}</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#2c3e50' }}>القاعة المؤقتة:</strong> 
                  <span style={{ marginRight: '8px', color: '#495057' }}>{selectedPostponement.postponed_room_name || selectedPostponement.postponed_to_room_id}</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#2c3e50' }}>السبب:</strong> 
                  <span style={{ marginRight: '8px', color: '#495057' }}>{selectedPostponement.postponed_reason}</span>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer style={{
          background: 'linear-gradient(135deg, #f8faff 0%, #e8f2ff 100%)',
          borderTop: '2px solid #e1e8ed',
          padding: 'clamp(15px, 3vw, 25px) clamp(20px, 4vw, 35px)',
          borderRadius: '0 0 12px 12px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Button 
            variant="secondary" 
            onClick={closePostponementModal}
            style={{
              padding: 'clamp(10px, 2vw, 14px) clamp(20px, 4vw, 30px)',
              fontWeight: '600',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
              borderColor: 'transparent',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              fontSize: 'clamp(13px, 1.8vw, 15px)',
              boxShadow: '0 4px 12px rgba(108, 117, 125, 0.3)',
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              minWidth: 'clamp(100px, 15vw, 120px)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(108, 117, 125, 0.4)';
              e.target.style.background = 'linear-gradient(135deg, #5a6268 0%, #495057 100%)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.3)';
              e.target.style.background = 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)';
            }}
          >
            <i className="fas fa-times me-2"></i>
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>

      </div>
    </>
  );
};

export default ProfessionalScheduleTable;