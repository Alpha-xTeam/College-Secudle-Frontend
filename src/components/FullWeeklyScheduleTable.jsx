import React, { useState, useMemo, useEffect } from 'react';
import { Table, Card, Badge, Button, Spinner, Form, Modal, Alert } from 'react-bootstrap';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getAuthHeaders } from '../utils/auth';
import CountdownTimer from './CountdownTimer';
import Icon from './Icon';
import '../styles/mobile-schedule-responsive.css';

const useMediaQuery = (query) => {
  const getMatches = (q) =>
    typeof window !== 'undefined' ? window.matchMedia(q).matches : false;

  const [matches, setMatches] = useState(getMatches(query));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia(query);
    const listener = (e) => setMatches(e.matches);

    try {
      media.addEventListener('change', listener);
    } catch {
      media.addListener(listener);
    }
    return () => {
      try {
        media.removeEventListener('change', listener);
      } catch {
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
};

const getStyles = (isMobile) => ({
  container: {
    margin: isMobile ? '0.5rem 0' : '2rem 0',
    direction: 'rtl',
    fontFamily: 'Cairo, Arial, sans-serif',
  },
  card: {
    border: 'none',
    borderRadius: isMobile ? '12px' : '20px',
    overflow: 'hidden',
    backgroundColor: 'white',
    boxShadow: isMobile ? '0 8px 25px rgba(0, 102, 204, 0.12)' : '0 15px 35px rgba(0, 102, 204, 0.15)',
  },
  header: {
    background: 'linear-gradient(135deg, #0066cc 0%, #004499 100%)',
    border: 'none',
    padding: isMobile ? '1rem 0.75rem' : '2rem',
    color: 'white',
  },
  headerContent: {
    textAlign: 'center',
  },
  title: {
    margin: 0,
    fontWeight: 'bold',
    fontSize: isMobile ? 'clamp(1.2rem, 4vw, 1.6rem)' : '2.2rem',
    marginBottom: isMobile ? '0.75rem' : '1.5rem',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
    lineHeight: isMobile ? '1.2' : '1.3',
  },
  badgesContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: isMobile ? '0.5rem' : '1.5rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  badge: {
    fontSize: isMobile ? 'clamp(0.8rem, 2.5vw, 0.95rem)' : '1.1rem',
    padding: isMobile ? '0.4rem 0.7rem' : '0.8rem 1.6rem',
    borderRadius: '25px',
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
    whiteSpace: 'nowrap',
  },
  downloadBtnWrap: {
    position: isMobile ? 'static' : 'absolute',
    top: isMobile ? 'auto' : '1.5rem',
    left: isMobile ? 'auto' : '1.5rem',
    width: isMobile ? '100%' : 'auto',
    marginTop: isMobile ? '0.5rem' : 0,
    display: isMobile ? 'none' : 'block', // إخفاء الزر على الموبايل
    justifyContent: isMobile ? 'center' : 'flex-start',
  },
  downloadBtn: {
    fontWeight: 'bold',
    width: isMobile ? '90%' : 'auto',
    fontSize: isMobile ? 'clamp(0.8rem, 2.2vw, 0.9rem)' : '1rem',
    padding: isMobile ? '0.6rem 1rem' : '0.8rem 1.2rem',
  },

  tableContainer: {
    overflow: 'auto',
    maxHeight: isMobile ? 'unset' : '80vh',
    WebkitOverflowScrolling: 'touch',
    overscrollBehaviorX: 'contain',
    borderTop: '1px solid #e6f2ff',
    borderRadius: isMobile ? '0 0 12px 12px' : '0 0 20px 20px',
  },
  table: {
    backgroundColor: 'white',
    marginBottom: 0,
    fontSize: isMobile ? 'clamp(0.8rem, 2.2vw, 0.9rem)' : '0.95rem',
    borderCollapse: 'separate',
    borderSpacing: 0,
    minWidth: isMobile ? '100%' : 'auto',
  },
  tableHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerCell: {
    background: 'linear-gradient(135deg, #004499 0%, #002266 100%)',
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: isMobile ? 'clamp(0.7rem, 2vw, 0.9rem) clamp(0.4rem, 1.5vw, 0.6rem)' : '1.5rem 1rem',
    fontSize: isMobile ? 'clamp(0.8rem, 2.2vw, 0.95rem)' : '1.1rem',
    border: '1px solid #003366',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    whiteSpace: isMobile ? 'normal' : 'nowrap',
    lineHeight: isMobile ? '1.2' : '1.4',
  },
  dayCell: {
    background: 'linear-gradient(135deg, #0066cc 0%, #004499 100%)',
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    verticalAlign: 'middle',
    border: '1px solid #004499',
    width: isMobile ? 'clamp(70px, 15vw, 88px)' : '120px',
    minWidth: isMobile ? 'clamp(70px, 15vw, 88px)' : '120px',
    padding: isMobile ? 'clamp(0.6rem, 2vw, 0.75rem) clamp(0.3rem, 1vw, 0.5rem)' : '1rem 0.5rem',
    position: 'sticky',
    right: 0,
    zIndex: 5,
    fontSize: isMobile ? 'clamp(0.8rem, 2.2vw, 0.9rem)' : '1rem',
    lineHeight: isMobile ? '1.1' : '1.3',
  },
  timeHeaderCell: {
    background: 'linear-gradient(135deg, #002266 0%, #001133 100%)',
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: isMobile ? 'clamp(0.7rem, 2vw, 0.9rem) clamp(0.4rem, 1.5vw, 0.6rem)' : '1.5rem 1rem',
    fontSize: isMobile ? 'clamp(0.85rem, 2.3vw, 1rem)' : '1.1rem',
    border: '1px solid #003366',
    minWidth: isMobile ? 'clamp(100px, 20vw, 120px)' : '150px',
    position: 'sticky',
    top: 0,
    right: 0,
    zIndex: 15,
    lineHeight: isMobile ? '1.2' : '1.4',
  },
  scheduleCell: {
    padding: isMobile ? 'clamp(0.5rem, 1.5vw, 0.6rem)' : '0.8rem',
    verticalAlign: 'top',
    border: '1px solid #e6f2ff',
    minHeight: isMobile ? 'clamp(50px, 12vw, 64px)' : '120px',
    backgroundColor: '#fafcff',
    minWidth: isMobile ? 'clamp(140px, 30vw, 160px)' : '200px',
    maxWidth: isMobile ? 'clamp(180px, 35vw, 220px)' : 'none',
  },
  row: {
    transition: 'background-color 0.3s ease',
  },
  subjectCard: {
    backgroundColor: '#ffffff',
    border: isMobile ? '1.5px solid #cce0ff' : '2px solid #cce0ff',
    borderRadius: isMobile ? '8px' : '12px',
    padding: isMobile ? 'clamp(0.6rem, 1.8vw, 0.75rem)' : '1rem',
    marginBottom: isMobile ? 'clamp(0.4rem, 1.2vw, 0.6rem)' : '0.8rem',
    boxShadow: isMobile
      ? '0 2px 6px rgba(0, 102, 204, 0.08)'
      : '0 4px 12px rgba(0, 102, 204, 0.1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  },
  subjectHeader: {
    borderBottom: isMobile ? '1.5px solid #e6f2ff' : '2px solid #e6f2ff',
    paddingBottom: isMobile ? 'clamp(0.4rem, 1.2vw, 0.5rem)' : '0.6rem',
    marginBottom: isMobile ? 'clamp(0.4rem, 1.2vw, 0.6rem)' : '0.8rem',
  },
  subjectName: {
    color: '#0056b3',
    fontSize: isMobile ? 'clamp(0.85rem, 2.5vw, 1rem)' : '1.05rem',
    fontWeight: 'bold',
    margin: 0,
    lineHeight: isMobile ? '1.2' : '1.4',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
  },
  detailsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: isMobile ? 'clamp(0.25rem, 0.8vw, 0.35rem)' : '0.5rem',
  },
  detailRow: {
    display: 'flex',
    alignItems: isMobile ? 'flex-start' : 'center',
    gap: isMobile ? '0.25rem' : '0.4rem',
    fontSize: isMobile ? 'clamp(0.75rem, 2.2vw, 0.85rem)' : '0.9rem',
    color: '#555',
    flexWrap: 'wrap',
    lineHeight: isMobile ? '1.2' : '1.4',
  },
  label: {
    fontWeight: 'bold',
    color: '#0066cc',
    minWidth: isMobile ? '70px' : '80px',
    marginLeft: isMobile ? '0.25rem' : '0.5rem',
    fontSize: isMobile ? 'clamp(0.7rem, 2vw, 0.8rem)' : '0.9rem',
  },
  value: {
    color: '#333',
    fontWeight: '500',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
    fontSize: isMobile ? 'clamp(0.75rem, 2.2vw, 0.85rem)' : '0.9rem',
    flex: 1,
  },
  emptySlot: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: isMobile ? 'clamp(50px, 12vw, 64px)' : '100px',
    color: '#999',
    fontSize: isMobile ? 'clamp(0.75rem, 2.2vw, 0.85rem)' : '0.9rem',
    fontStyle: 'italic',
    backgroundColor: '#f8f9fa',
    borderRadius: isMobile ? '6px' : '8px',
    border: isMobile ? '1.5px dashed #dee2e6' : '2px dashed #dee2e6',
    fontWeight: isMobile ? '500' : 'normal',
  },
  roomBadge: {
    backgroundColor: '#0066cc',
    color: 'white',
    fontSize: isMobile ? 'clamp(0.65rem, 1.8vw, 0.75rem)' : '0.8rem',
    padding: isMobile ? '0.25rem 0.5rem' : '0.3rem 0.6rem',
    borderRadius: isMobile ? '12px' : '15px',
    fontWeight: 'bold',
    marginTop: isMobile ? '0.2rem' : '0.3rem',
    display: 'inline-block',
    boxShadow: isMobile ? '0 1px 3px rgba(0, 102, 204, 0.3)' : '0 2px 4px rgba(0, 102, 204, 0.3)',
    whiteSpace: 'nowrap',
  },
  sectionGroupBadge: {
    display: 'inline-block',
    padding: isMobile ? '6px 10px' : '6px 12px',
    borderRadius: 14,
    fontWeight: 800,
    fontSize: isMobile ? '0.9rem' : '0.95rem',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    textAlign: 'center',
    minWidth: '36px',
    boxShadow: '0 4px 8px rgba(2,6,23,0.06)',
    overflowWrap: 'anywhere'
  },
  sectionGroupValue: {
    display: 'inline-block',
    padding: isMobile ? '6px 10px' : '6px 10px',
    borderRadius: 12,
    fontWeight: 800,
    fontSize: isMobile ? '0.95rem' : '0.95rem',
    lineHeight: 1,
    minWidth: '40px',
    textAlign: 'center',
    overflowWrap: 'anywhere'
  },

  // Mobile & badge styles (new) - ensure all keys referenced in the mobile render exist
  lectureTypeBadge: {
    display: 'inline-block',
    position: isMobile ? 'relative' : 'absolute',
    top: isMobile ? 'auto' : 12,
    right: isMobile ? 'auto' : 12,
    marginBottom: isMobile ? '0.5rem' : 0,
    padding: isMobile ? '6px 10px' : '8px 12px',
    borderRadius: 12,
    fontWeight: 800,
    textAlign: 'center',
    whiteSpace: 'nowrap'
  },

  lectureTypeBadgeDesktop: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 20,
  },

  // Mobile container wrappers used only in the mobile render path
  mobileContainer: {
    padding: isMobile ? '0.5rem 0.75rem' : '2rem 0',
    margin: isMobile ? '0' : '0',
  },
  mobileDaySelector: {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: '0.5rem',
    alignItems: 'stretch',
    marginBottom: '1rem',
    justifyContent: 'flex-end'
  },
  mobileDaySelectorLabel: {
    fontWeight: 700,
    color: '#004499',
    marginBottom: isMobile ? '0.25rem' : 0,
    textAlign: 'right'
  },
  mobileDaySelectorDropdown: {
    width: '100%',
    maxWidth: isMobile ? '100%' : '320px',
    padding: '0.45rem 0.6rem',
    borderRadius: 8,
  },

  mobileScheduleCard: {
    display: 'block',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: isMobile ? '0.75rem' : '1rem',
    marginBottom: '1rem',
    boxShadow: '0 6px 18px rgba(2,6,23,0.06)'
  },

  mobileTimeSlotHeader: {
    fontWeight: 800,
    fontSize: isMobile ? 'clamp(0.85rem, 2.6vw, 1rem)' : '1rem',
    color: '#0066cc',
    marginBottom: '0.5rem',
    textAlign: 'right'
  },

  mobileSubjectGrid: {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
    gap: '0.6rem'
  },

  mobileEmptySlot: {
    padding: '0.9rem',
    textAlign: 'center',
    borderRadius: 8,
    backgroundColor: '#fbfdff',
    color: '#666'
  },
});

// Helper function to check if device is mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

// Helper to build badge text and colors
const getLectureTypeBadge = (schedule) => {
  const ltRaw = schedule.lecture_type || schedule.lecture_type_display || schedule.lecture_type_db || schedule.lecture_type_original || '';
  const lt = String(ltRaw).toLowerCase();

  const hasGroup = !!(schedule.group || schedule.group_letter);
  const hasSection = !!(schedule.section || schedule.section_number);
  const roomName = String(schedule.room_name || schedule.room_code || '').toLowerCase();
  const subjectName = String(schedule.subject_name || '').toLowerCase();

  const explicitIsPractical = lt.includes('عم') || lt === 'practical' || lt === 'عملي';

  let inferredScore = 0;
  if (hasGroup) inferredScore += 3;
  if (hasSection) inferredScore -= 3;

  if (roomName.includes('lab') || roomName.includes('مختبر') || roomName.includes('معمل')) {
    inferredScore += 4;
  }

  if (subjectName.includes('lab') || subjectName.includes('عملي') || subjectName.includes('practical')) {
    inferredScore += 2;
  }
  if (subjectName.includes('نظري') || subjectName.includes('theory') || subjectName.includes('lecture')) {
    inferredScore -= 2;
  }

  const inferredIsPractical = inferredScore > 0;

  let finalIsPractical;
  const explicitProvided = ltRaw && ltRaw.trim().length > 0;
  if (explicitProvided) {
    if ((explicitIsPractical && !inferredIsPractical && Math.abs(inferredScore) >= 3) || (!explicitIsPractical && inferredIsPractical && Math.abs(inferredScore) >= 3)) {
      finalIsPractical = inferredIsPractical;
      console.warn('Overriding explicit lecture_type with inferred value due to strong signals', {
        id: schedule.id || null,
        subject: schedule.subject_name,
        explicit: ltRaw,
        inferredScore,
        inferredIsPractical,
        roomName: schedule.room_name || schedule.room_code,
        group: schedule.group || schedule.group_letter,
        section: schedule.section || schedule.section_number,
      });
    } else {
      finalIsPractical = explicitIsPractical;
    }
  } else {
    finalIsPractical = inferredIsPractical;
  }

  const groupValueCandidates = [
    { key: 'group', val: schedule.group },
    { key: 'group_letter', val: schedule.group_letter },
    { key: 'group_name', val: schedule.group_name },
    { key: 'group_code', val: schedule.group_code },
    { key: 'group_label', val: schedule.group_label },
    { key: 'group_id', val: schedule.group_id },
    // nested possibilities
    { key: 'group.name', val: schedule.group && schedule.group.name },
    { key: 'group.letter', val: schedule.group && (schedule.group.letter || schedule.group.label) },
    { key: 'group.display', val: schedule.group && (schedule.group.display || schedule.group.value) }
  ];

  const sectionValueCandidates = [
    { key: 'section', val: schedule.section },
    { key: 'section_number', val: schedule.section_number },
    { key: 'section_name', val: schedule.section_name },
    { key: 'section_code', val: schedule.section_code },
    { key: 'section_label', val: schedule.section_label },
    { key: 'section_id', val: schedule.section_id },
    // nested possibilities
    { key: 'section.name', val: schedule.section && schedule.section.name },
    { key: 'section.number', val: schedule.section && (schedule.section.number || schedule.section.value) },
    { key: 'section.display', val: schedule.section && (schedule.section.display || schedule.section.label) }
  ];

  let groupValue = '';
  let groupSource = null;
  for (const c of groupValueCandidates) {
    try {
      if (c.val !== undefined && c.val !== null && String(c.val).toString().trim() !== '') {
        groupValue = String(c.val);
        groupSource = c.key;
        break;
      }
    } catch (e) {
      // ignore
    }
  }

  let sectionValue = '';
  let sectionSource = null;
  for (const c of sectionValueCandidates) {
    try {
      if (c.val !== undefined && c.val !== null && String(c.val).toString().trim() !== '') {
        sectionValue = String(c.val);
        sectionSource = c.key;
        break;
      }
    } catch (e) {
      // ignore
    }
  }

  // If both are empty, print a concise diagnostic to help identify API shape
  if ((!groupValue || groupValue.trim() === '') && (!sectionValue || sectionValue.trim() === '')) {
    try {
      const keys = Object.keys(schedule).slice(0, 40);
      console.warn('FullWeeklyScheduleTable: no group/section found for schedule', {
        id: schedule.id || schedule.schedule_id || null,
        subject: schedule.subject_name || schedule.subject || null,
        topKeys: keys,
        groupObjKeys: schedule.group ? Object.keys(schedule.group) : null,
        sectionObjKeys: schedule.section ? Object.keys(schedule.section) : null
      });
    } catch (e) {
      // ignore logging errors
    }
  }

  // normalize empty values to '-'
  if (!groupValue) groupValue = '';
  if (!sectionValue) sectionValue = '';

  // Include section/group info in the badge text so users can see it at a glance
  const text = finalIsPractical ? `عملي` : `نظري`;

  const style = {
    background: finalIsPractical ? 'linear-gradient(90deg,#ecfdf5,#dcfce7)' : 'linear-gradient(90deg,#ebf8ff,#e6f7ff)',
    color: finalIsPractical ? '#065f46' : '#065f9e',
    border: finalIsPractical ? '1px solid #bbf7d0' : '1px solid #bfefff',
    padding: finalIsPractical ? '8px 10px' : '6px 10px',
    borderRadius: 12,
    fontWeight: 800,
    textAlign: 'center'
  };

  return {
    text,
    style,
    explicitRaw: ltRaw,
    explicitIsPractical,
    inferredIsPractical,
    finalIsPractical,
    hasGroup,
    hasSection,
    inferredScore,
    groupValue,
    sectionValue,
    groupSource,
    sectionSource
  };
};

const FullWeeklyScheduleTable = ({ weeklyScheduleData, stage, studyType }) => {
  // تعريف اسم القسم حسب المرحلة أو البيانات (هنا ثابت كمثال، ويمكن ربطه ببيانات ديناميكية)
  let departmentName = 'Cyber Security';
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedMobileDay, setSelectedMobileDay] = useState('');
  const isMobile = useMediaQuery('(max-width: 768px)');
  const styles = getStyles(isMobile);

  // طباعة البيانات المستلمة للتشخيص
  useEffect(() => {
    console.log('FullWeeklyScheduleTable - البيانات المستلمة:', weeklyScheduleData);
    console.log('FullWeeklyScheduleTable - المرحلة:', stage);
    console.log('FullWeeklyScheduleTable - نوع الدراسة:', studyType);
    
    if (weeklyScheduleData) {
      console.log('عدد الأيام في البيانات:', Object.keys(weeklyScheduleData).length);
      Object.entries(weeklyScheduleData).forEach(([day, schedules]) => {
        console.log(`اليوم ${day}: ${schedules.length} محاضرة`);
      });
    }
  }, [weeklyScheduleData, stage, studyType]);

  // تعيين اليوم الحالي عند التحميل للموبايل
  useEffect(() => {
    if (isMobile && !selectedMobileDay) {
      const today = new Date();
      const dayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysMapping = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDay = daysMapping[dayIndex];
      
      // التأكد من أن اليوم ضمن أيام الأسبوع (السبت إلى الخميس)
      const weekDays = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
      if (weekDays.includes(currentDay)) {
        setSelectedMobileDay(currentDay);
      } else {
        // إذا كان اليوم جمعة، اختر السبت كافتراضي
        setSelectedMobileDay('saturday');
      }
    }
  }, [isMobile, selectedMobileDay]);

  // Extract unique room names
  const dynamicRoomNames = useMemo(() => {
    const uniqueRooms = new Set();
    if (weeklyScheduleData) {
      Object.values(weeklyScheduleData).forEach((daySchedules) => {
        daySchedules.forEach((schedule) => {
          if (schedule.room_name) {
            uniqueRooms.add(schedule.room_name);
          }
        });
      });
    }
    return Array.from(uniqueRooms).sort();
  }, [weeklyScheduleData]);

  // Extract unique time slots and filter out the specified ones
  const dynamicTimeSlots = useMemo(() => {
    const uniqueTimePairs = new Set();
    if (weeklyScheduleData) {
      Object.values(weeklyScheduleData).forEach((daySchedules) => {
        daySchedules.forEach((schedule) => {
          // إذا كانت المحاضرة مؤجلة استخدم وقت التأجيل
          const isPostponed = schedule.is_postponed && schedule.postponed_start_time && schedule.postponed_end_time;
          const timeSlot = isPostponed
            ? `${schedule.postponed_start_time}-${schedule.postponed_end_time}`
            : `${schedule.start_time}-${schedule.end_time}`;
          if (timeSlot !== '14:30-15:30' && timeSlot !== '15:00-16:30') {
            uniqueTimePairs.add(timeSlot);
          }
        });
      });
    }

    const sortedTimePairs = Array.from(uniqueTimePairs)
      .sort((a, b) => {
        const [aStart] = a.split('-');
        const [bStart] = b.split('-');
        return aStart.localeCompare(bStart);
      })
      .map((pair) => {
        const [start, end] = pair.split('-');
        return { start, end };
      });

    return sortedTimePairs;
  }, [weeklyScheduleData]);

  const dayLabels = {
    saturday: 'السبت',
    sunday: 'الأحد',
    monday: 'الاثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
  };

  // تصفية الأيام - إظهار السبت فقط إذا كان له بيانات
  const days = useMemo(() => {
    if (!weeklyScheduleData) return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
    
    const filteredDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']; // الأيام الأساسية
    
    // فحص إذا كان يوم السبت يحتوي على بيانات
    if (weeklyScheduleData.saturday && weeklyScheduleData.saturday.length > 0) {
      filteredDays.unshift('saturday'); // إضافة السبت في بداية القائمة
    }
    
    return filteredDays;
  }, [weeklyScheduleData]);

  // أيام الأسبوع للموبايل فقط
  const mobileDayOptions = [
    { value: 'saturday', label: (<><Icon name="calendar" className="me-1" />السبت</>) },
    { value: 'sunday', label: (<><Icon name="sun" className="me-1 text-warning" />الأحد</>) },
    { value: 'monday', label: (<><Icon name="book" className="me-1 text-primary" />الاثنين</>) },
    { value: 'tuesday', label: (<><Icon name="group" className="me-1 text-success" />الثلاثاء</>) },
    { value: 'wednesday', label: (<><Icon name="graduation" className="me-1 text-info" />الأربعاء</>) },
    { value: 'thursday', label: (<><Icon name="tag" className="me-1 text-secondary" />الخميس</>) }
  ];

  const getStageText = (stage) => {
    // Normalize null/undefined
    if (stage === null || stage === undefined) return '';

    const s = String(stage).trim().toLowerCase();

    const map = {
      '1': 'المرحلة الأولى',
      '2': 'المرحلة الثانية',
      '3': 'المرحلة الثالثة',
      '4': 'المرحلة الرابعة',
      'first': 'المرحلة الأولى',
      'second': 'المرحلة الثانية',
      'third': 'المرحلة الثالثة',
      'fourth': 'المرحلة الرابعة'
    };

    return map[s] || '';
  };

  // Organize data by time slot, then day, then room (excluding filtered time slots)
  const organizedDataByTime = useMemo(() => {
    const data = {};
    // Define all days here for internal data organization (including friday for internal processing)
    const internalDays = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    dynamicTimeSlots.forEach((slot) => {
      const timeKey = `${slot.start}-${slot.end}`;
      data[timeKey] = {};
      internalDays.forEach((day) => { // Use internalDays here
        data[timeKey][day] = [];
      });
    });

    if (weeklyScheduleData) {
      // دالة لتحويل تاريخ إلى اسم اليوم بالإنجليزي
      const getDayOfWeekFromDate = (dateStr) => {
        if (!dateStr) return null;
        const dateObj = new Date(dateStr);
        const daysArr = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return daysArr[dateObj.getDay()];
      };

      Object.entries(weeklyScheduleData).forEach(([day, schedules]) => {
        schedules.forEach((schedule) => {
          // التعامل مع المحاضرات المؤجلة
          if (schedule.is_postponed && schedule.postponed_date && schedule.postponed_start_time && schedule.postponed_end_time) {
            // أضفها فقط لليوم المؤجل
            const timeKey = `${schedule.postponed_start_time}-${schedule.postponed_end_time}`;
            const targetDay = getDayOfWeekFromDate(schedule.postponed_date);
            if (timeKey !== '14:30-15:30' && timeKey !== '15:00-16:30' && targetDay) {
              if (data[timeKey] && data[timeKey][targetDay]) {
                // استخدم معلومات القاعة المؤجلة إذا كانت متوفرة
                const scheduleToAdd = {
                  ...schedule,
                  start_time: schedule.postponed_start_time,
                  end_time: schedule.postponed_end_time,
                  day_of_week: targetDay,
                  room_name: schedule.postponed_room_name || schedule.room_name,
                  room_code: schedule.postponed_room_code || schedule.room_code
                };
                data[timeKey][targetDay].push(scheduleToAdd);
              }
            }
          } else {
            // المحاضرات العادية غير المؤجلة
            const timeKey = `${schedule.start_time}-${schedule.end_time}`;
            if (timeKey !== '14:30-15:30' && timeKey !== '15:00-16:30') {
              if (data[timeKey] && data[timeKey][day]) {
                data[timeKey][day].push(schedule);
              }
            }
          }
        });
      });
    }
    console.log('organizedDataByTime - النتيجة النهائية:', data);
    return data;
  }, [weeklyScheduleData, dynamicTimeSlots]);

  // تصفية البيانات للموبايل حسب اليوم المختار
  const mobileFilteredData = useMemo(() => {
    if (!isMobile || !selectedMobileDay || !organizedDataByTime) return {};
    
    const filtered = {};
    Object.entries(organizedDataByTime).forEach(([timeKey, timeData]) => {
      if (timeData[selectedMobileDay] && timeData[selectedMobileDay].length > 0) {
        filtered[timeKey] = timeData[selectedMobileDay];
      }
    });
    return filtered;
  }, [isMobile, selectedMobileDay, organizedDataByTime]);

  const handleDownloadPDF = () => {
    const cardElement = document.getElementById('full-schedule-card');
    if (!cardElement) {
      console.error('Element to capture not found!');
      return;
    }

    setIsDownloading(true);

    html2canvas(cardElement, {
      scale: 1, // إن احتجت دقة أعلى على الجوال: جرّب scale: 2
      useCORS: true,
      backgroundColor: '#ffffff',
      onclone: (document) => {
        const tableContainer = document.getElementById('table-container-for-pdf');
        if (tableContainer) {
          tableContainer.style.maxHeight = 'none';
          tableContainer.style.overflow = 'visible';
        }
      },
    })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasAspectRatio = canvas.width / canvas.height;

        let renderWidth = pdfWidth;
        let renderHeight = pdfWidth / canvasAspectRatio;
        if (renderHeight > pdfHeight) {
          renderHeight = pdfHeight;
          renderWidth = pdfHeight * canvasAspectRatio;
        }
        const xOffset = (pdfWidth - renderWidth) / 2;

        pdf.addImage(imgData, 'PNG', xOffset, 0, renderWidth, renderHeight);
        pdf.save(`جدول-${getStageText(stage)}-${studyType === 'morning' ? 'صباحي' : 'مسائي'}.pdf`);
        setIsDownloading(false);
      })
      .catch((err) => {
        console.error('Error generating PDF:', err);
        setIsDownloading(false);
      });
  };

  const formatTo12Hour = (timeStr) => {
    if (!timeStr) return '';
    const [hh, mm] = timeStr.split(':');
    const hour = parseInt(hh, 10);
    const minute = parseInt(mm, 10);
    const ampm = hour >= 12 ? 'م' : 'ص';
    const formattedHour = hour % 12 || 12;
    return `${String(formattedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;
  };

  // عرض خاص بالموبايل
  if (isMobile) {
    return (
      <div style={styles.mobileContainer}>
        <Card style={styles.card}>
          <Card.Header style={styles.header}>
            <div style={styles.headerContent}>
              <h3 style={styles.title}><Icon name="calendar" className="me-2" /> الجدول الأسبوعي</h3>
              <div style={styles.badgesContainer}>
                <Badge style={styles.badge}><Icon name="graduation" className="me-1" /> {getStageText(stage)}</Badge>
                <Badge style={styles.badge}>
                  <Icon name={studyType === 'morning' ? 'sun' : 'moon'} className="me-1" /> {studyType === 'morning' ? 'صباحي' : 'مسائي'}
                </Badge>
              </div>
            </div>
          </Card.Header>

          <Card.Body>
            {/* اختيار اليوم للموبايل */}
            <div style={styles.mobileDaySelector}>
              <label style={styles.mobileDaySelectorLabel}>اختر اليوم:</label>
              <Form.Select
                value={selectedMobileDay}
                onChange={(e) => setSelectedMobileDay(e.target.value)}
                style={styles.mobileDaySelectorDropdown}
              >
                <option value="">-- اختر اليوم --</option>
                {mobileDayOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </div>

            {/* عرض جدول اليوم المختار */}
            {selectedMobileDay && (
              <div>
                <h4 style={{ 
                  textAlign: 'center', 
                  marginBottom: '1rem', 
                  color: '#0066cc',
                  fontWeight: 'bold'
                }}>
                  📅 جدول يوم {dayLabels[selectedMobileDay]}
                </h4>
                
                {Object.keys(mobileFilteredData).length > 0 ? (
                  Object.entries(mobileFilteredData).map(([timeKey, schedules]) => (
                    <div key={timeKey} style={styles.mobileScheduleCard}>
                      <div style={styles.mobileTimeSlotHeader}>
                        <Icon name="clock" className="me-1" /> {formatTo12Hour(timeKey.split('-')[0])} - {formatTo12Hour(timeKey.split('-')[1])}
                      </div>
                      
                      {schedules && schedules.length > 0 ? (
                        <div style={styles.mobileSubjectGrid}>
                          {schedules.map((schedule, index) => {
                            const debugKey = schedule.id || `${timeKey}-${index}`;
                            return (
                              <React.Fragment key={schedule.id || index}>
                                <div style={styles.subjectCard}>
                                  <div style={styles.subjectHeader}>
                                    <h6 style={styles.subjectName}><Icon name="book" className="me-1 text-primary" /> {schedule.subject_name}</h6>
                                  </div>
                                  
                                  {/* عداد المحاضرة للموبايل */}
                                  <CountdownTimer 
                                    startTime={schedule.start_time} 
                                    endTime={schedule.end_time} 
                                    dayOfWeek={selectedMobileDay}
                                  />
                                  
                                  {/* Lecture type badge for mobile (full width stacked) */}
                                  <div style={{ ...styles.lectureTypeBadge, ...(isMobile ? {} : styles.lectureTypeBadgeDesktop), ...(getLectureTypeBadge(schedule).style) }}>
                                    {getLectureTypeBadge(schedule).text}
                                  </div>

                                  <div style={styles.detailsContainer}>
                                    {/* Multiple doctors display */}
                                    {schedule.has_multiple_doctors ? (
                                      <div style={styles.detailRow}>
                                        <span aria-hidden="true" style={{ marginInlineStart: 0 }}><Icon name="users" /></span>
                                        <div style={styles.value}>
                                          {schedule.multiple_doctors_names?.map((name, docIndex) => (
                                            <div key={docIndex} style={{
                                              marginBottom: '2px',
                                              fontWeight: name === schedule.primary_doctor_name ? 'bold' : 'normal',
                                              color: name === schedule.primary_doctor_name ? '#198754' : 'inherit'
                                            }}>
                                              {name === schedule.primary_doctor_name && <Icon name="star" className="me-1 text-warning" />}
                                              {name}
                                              {name === schedule.primary_doctor_name && ' (أساسي)'}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div style={styles.detailRow}>
                                        <span aria-hidden="true" style={{ marginInlineStart: 0 }}><Icon name="teacher" /></span>
                                        <span style={styles.value}>{schedule.doctors?.name || schedule.instructor_name || 'غير محدد'}</span>
                                      </div>
                                    )}

                                    {(schedule.room_name || schedule.room_code) && (
                                      <div style={styles.detailRow}>
                                        <span aria-hidden="true" style={{ marginInlineStart: 0 }}><Icon name="university" /></span>
                                        <span style={styles.value}>{schedule.room_name || schedule.room_code}</span>
                                      </div>
                                    )}

                                    {/* Section / Group pill badge (mobile) */}
                                    {(() => {
                                      const badge = getLectureTypeBadge(schedule);
                                      const isPractical = badge.finalIsPractical;
                                      const label = isPractical ? 'الكروب' : 'الشعبة';
                                      const value = isPractical ? (badge.groupValue || '-') : (badge.sectionValue || '-');
                                      const pillStyle = {
                                        ...styles.sectionGroupValue,
                                        background: isPractical ? 'linear-gradient(90deg,#ecfdf5,#dcfce7)' : 'linear-gradient(90deg,#ebf8ff,#e6f7ff)',
                                        color: isPractical ? '#065f46' : '#065f9e',
                                        border: isPractical ? '1px solid #bbf7d0' : '1px solid #bfefff'
                                      };

                                      const titleText = value && value !== '-' ? `القيمة: ${value} — المصدر: ${isPractical ? (badge.groupSource || 'unknown') : (badge.sectionSource || 'unknown')}` : 'لا توجد بيانات متاحة';
                                      const displayValue = value && value !== '' ? value : '-';
                                      return (
                                        <div style={{ ...styles.detailRow, alignItems: 'center' }}>
                                          <span aria-hidden="true" style={{ marginInlineStart: 0, fontWeight: 700 }}><Icon name="tag" /></span>
                                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <div style={{ fontWeight: 700, color: '#0066cc', minWidth: 60 }}>{label}:</div>
                                            <div style={pillStyle} title={titleText}>{displayValue}</div>
                                          </div>
                                        </div>
                                      );
                                     })()}

                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={styles.mobileEmptySlot}><Icon name="coffee" className="me-2" /> لا توجد محاضرات في هذا الوقت</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={styles.mobileEmptySlot}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                    لا توجد محاضرات في يوم {dayLabels[selectedMobileDay]}
                  </div>
                )}
              </div>
            )}

            {!selectedMobileDay && (
              <div style={styles.mobileEmptySlot}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                يرجى اختيار اليوم لعرض الجدول
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    );
  }

  // عرض سطح المكتب (الأصلي)
  return (
    <>
      <div style={styles.container}>
        <Card style={styles.card} id="full-schedule-card">
          <Card.Header style={{ ...styles.header, position: 'relative' }}>
            <div style={styles.headerContent}>
              <h3 style={styles.title}>📅 الجدول الأسبوعي الكامل</h3>
              <div style={styles.badgesContainer}>
                <Badge style={styles.badge}>🎓 {getStageText(stage)}</Badge>
                <Badge style={styles.badge}>
                  {studyType === 'morning' ? '🌅' : '🌙'} نوع الدراسة: {studyType === 'morning' ? 'صباحي' : 'مسائي'}
                </Badge>
                <Badge style={styles.badge}>🔐 {departmentName === 'Cyber Security' ? 'أمن سيبراني' : departmentName}</Badge>
              </div>
            </div>

            <div style={styles.downloadBtnWrap}>
              <Button
                variant="light"
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                style={styles.downloadBtn}
              >
                {isDownloading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />{' '}
                    جاري التحميل...
                  </>
                ) : (
                  <><Icon name="download" className="me-1" /> تحميل PDF</>
                )}
              </Button>
            </div>
          </Card.Header>

          <Card.Body className="p-0">
            <div id="table-container-for-pdf" style={styles.tableContainer}>
              <Table style={styles.table}>
                <thead style={styles.tableHeader}>
                  <tr>
                    <th style={styles.timeHeaderCell}><Icon name="clock" className="me-1" /> الأيام / الأوقات</th>
                    {dynamicTimeSlots.map((slot, index) => (
                      <th key={index} style={styles.headerCell}>
                        <div>
                          <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{formatTo12Hour(slot.start)}</div>
                          <div style={{ fontSize: '0.8rem', opacity: 0.8, margin: '0.2rem 0' }}>إلى</div>
                          <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{formatTo12Hour(slot.end)}</div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <tr
                      key={day}
                      style={styles.row}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f8ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={styles.dayCell}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{dayLabels[day]}</div>
                      </td>

                      {dynamicTimeSlots.map((slot, index) => {
                        const timeKey = `${slot.start}-${slot.end}`;
                        // تصفية المحاضرات المؤجلة من اليوم الأصلي
                        const schedules = organizedDataByTime[timeKey][day];
                        console.log(`اليوم ${day}, الوقت ${timeKey}: عدد المحاضرات = ${schedules.length}`);
                        schedules.forEach((schedule, idx) => {
                          console.log(`  المحاضرة ${idx + 1}: ${schedule.subject_name} - ${schedule.room_name}`);
                        });
                        return (
                          <td key={index} style={styles.scheduleCell}>
                            {schedules &&
                              schedules.map((s, i) => {
                                const debugKey = s.id || `${timeKey}-${i}`;
                                const badge = getLectureTypeBadge(s);
                                return (
                                  <React.Fragment key={s.id || i}>
                                    <div
                                      style={styles.subjectCard}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 102, 204, 0.2)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow =
                                          isMobile
                                            ? '0 2px 8px rgba(0, 102, 204, 0.1)'
                                            : '0 4px 12px rgba(0, 102, 204, 0.1)';
                                      }}
                                    >
                                      {/* Desktop badge (top-right) */}
                                      <div style={{ ...styles.lectureTypeBadge, ...styles.lectureTypeBadgeDesktop, ...badge.style }}>
                                        {badge.text}
                                      </div>

                                      <div style={styles.subjectHeader}>
                                        <h6 style={styles.subjectName}><Icon name="book" className="me-1 text-primary" /> {s.subject_name}</h6>
                                      </div>
                                      
                                      {/* عداد المحاضرة لسطح المكتب */}
                                      <CountdownTimer 
                                        startTime={s.start_time} 
                                        endTime={s.end_time} 
                                        dayOfWeek={day}
                                      />
                                      
                                      <div style={styles.detailsContainer}>
                                        {/* Multiple doctors display */}
                                        {s.has_multiple_doctors ? (
                                          <div style={styles.detailRow}>
                                            {isMobile ? (
                                              <span aria-hidden="true" style={{ marginInlineStart: 0 }}>
                                                <Icon name="users" />
                                              </span>
                                            ) : (
                                              <span style={styles.label}><Icon name="users" className="me-1" /> المدرّسون:</span>
                                            )}
                                            <div style={styles.value}>
                                              {s.multiple_doctors_names?.map((name, index) => (
                                                <div key={index} style={{
                                                  marginBottom: '2px',
                                                  fontWeight: name === s.primary_doctor_name ? 'bold' : 'normal',
                                                  color: name === s.primary_doctor_name ? '#198754' : 'inherit'
                                                }}>
                                                  {name === s.primary_doctor_name && <Icon name="star" className="me-1 text-warning" />}
                                                  {name}
                                                  {name === s.primary_doctor_name && ' (أساسي)'}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <div style={styles.detailRow}>
                                            {isMobile ? (
                                              <span aria-hidden="true" style={{ marginInlineStart: 0 }}>
                                                <Icon name="teacher" />
                                              </span>
                                            ) : (
                                              <span style={styles.label}><Icon name="teacher" className="me-1" /> الدكتور:</span>
                                            )}
                                            <span style={styles.value}>{s.doctors?.name || s.instructor_name || 'غير محدد'}</span>
                                          </div>
                                        )}

                                        {(s.room_name || s.room_code) && (
                                          <div style={styles.detailRow}>
                                            {isMobile ? (
                                              <span aria-hidden="true" style={{ marginInlineStart: 0 }}>
                                                <Icon name="university" />
                                              </span>
                                            ) : (
                                              <span style={styles.label}><Icon name="university" className="me-1" /> القاعة:</span>
                                            )}
                                            <span style={styles.value}>{s.room_name || s.room_code}</span>
                                          </div>
                                        )}

                                        {/* Section/Group pill badge for desktop */}
                                        {(() => {
                                          const isPractical = badge.finalIsPractical;
                                          const label = isPractical ? 'الكروب' : 'الشعبة';
                                          const value = isPractical ? (badge.groupValue || '-') : (badge.sectionValue || '-');
                                          const pillStyle = {
                                            ...styles.sectionGroupValue,
                                            background: isPractical ? 'linear-gradient(90deg,#ecfdf5,#dcfce7)' : 'linear-gradient(90deg,#ebf8ff,#e6f7ff)',
                                            color: isPractical ? '#065f46' : '#065f9e',
                                            border: isPractical ? '1px solid #bbf7d0' : '1px solid #bfefff'
                                          };

                                          const displayValueDesktop = value && value !== '' ? value : '-';
                                          const titleTextDesktop = displayValueDesktop !== '-' ? `القيمة: ${displayValueDesktop} — المصدر: ${isPractical ? (badge.groupSource || 'unknown') : (badge.sectionSource || 'unknown')}` : 'لا توجد بيانات متاحة';
                                          return (
                                            <div style={styles.detailRow}>
                                              <span style={styles.label}><Icon name="tag" className="me-1" /> {label}:</span>
                                              <span style={styles.value}>
                                                <span style={pillStyle} title={titleTextDesktop}>{displayValueDesktop}</span>
                                              </span>
                                            </div>
                                          );
                                        })()}

                                      </div>
                                    </div>
                                  </React.Fragment>
                                );
                              })}

                            {(!schedules || schedules.length === 0) && <div style={styles.emptySlot}>☕ استراحة</div>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default FullWeeklyScheduleTable;