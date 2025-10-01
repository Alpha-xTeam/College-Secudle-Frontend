import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { roomsAPI } from '../api/rooms';
import api from '../api/rooms';
import { doctorsAPI } from '../api/doctors';
import { getUserRole } from '../utils/auth';

const EditSchedule = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPostponementModal, setShowPostponementModal] = useState(false); // New state for postponement modal
  const [postponingSchedule, setPostponingSchedule] = useState(null); // New state for the schedule being postponed
  const [postponementForm, setPostponementForm] = useState({ // New state for postponement form
    postponed_date: '',
    postponed_to_room_id: '',
    postponed_reason: '',
    postponed_start_time: '',
    postponed_end_time: ''
  });
  const [allRooms, setAllRooms] = useState([]); // State to store all rooms
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictingScheduleDetails, setConflictingScheduleDetails] = useState(null);
  const [newOriginalScheduleTime, setNewOriginalScheduleTime] = useState('');
  const [newOriginalScheduleRoom, setNewOriginalScheduleRoom] = useState('');
  const [temporaryBookingDate, setTemporaryBookingDate] = useState('');
  const [pendingTemporaryScheduleData, setPendingTemporaryScheduleData] = useState(null);
  const [isTemporarySubmissionAttempt, setIsTemporarySubmissionAttempt] = useState(false);
  const [showTemporaryMoveDetailsModal, setShowTemporaryMoveDetailsModal] = useState(false); // New state for showing temporary move details
  const [temporaryMoveDetails, setTemporaryMoveDetails] = useState(null); // New state to store temporary move details
  const [showUploadResults, setShowUploadResults] = useState(false); // State for showing upload results
  const [uploadResults, setUploadResults] = useState(null); // State for storing upload results
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false); // State for delete all confirmation modal
  const [deleteAllLoading, setDeleteAllLoading] = useState(false); // State for delete all loading
  const [doctors, setDoctors] = useState([]); // New state for doctors
  const [doctorAvailability, setDoctorAvailability] = useState({}); // Track doctor availability
  const [allSchedules, setAllSchedules] = useState([]); // All schedules from all rooms

  // Filtered doctors list - now always shows all doctors without department filter
  const filteredDoctorsByDept = doctors;

  const [scheduleForm, setScheduleForm] = useState({
    study_type: 'morning',
    academic_stage: 'first',
    day_of_week: 'sunday',
    start_time: '',
    end_time: '',
    subject_name: '',
    doctor_id: '', // Single doctor (legacy support)
    doctor_ids: [], // Multiple doctors
    primary_doctor_id: '', // Primary doctor when multiple selected
    use_multiple_doctors: false, // Toggle between single and multiple
    notes: '',
    lecture_type: 'نظري', // New field: نوع المحاضرة - default to theoretical
    section: 1, // New field: الشعبة (للنظري) - default to 1
    group: 'A', // New field: الكروب (للعملي) - default to A
  });

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

  const studyTypes = {
    morning: 'صباحي',
    evening: 'مسائي'
  };

  // دالة للتحقق من توفر الدكتور في الوقت المحدد مع إرجاع تفاصيل التعارض من جميع القاعات
  const checkDoctorAvailability = useCallback((doctorId, dayOfWeek, startTime, endTime, studyType, academicStage) => {
    if (!doctorId || !dayOfWeek || !startTime || !endTime) return { available: true, conflict: null };
    
    // البحث عن تعارضات في جميع الجداول من جميع القاعات
    const conflictingSchedule = allSchedules.find(schedule => {
      // تجاهل الجدول الحالي عند التعديل
      if (editingSchedule && schedule.id === editingSchedule.id) return false;
      
      // فحص إذا كان هذا الجدول يحتوي على الدكتور
      let scheduleHasDoctor = false;
      if (schedule.has_multiple_doctors && schedule.schedule_doctors) {
        scheduleHasDoctor = schedule.schedule_doctors.some(sd => sd.doctor_id === doctorId);
      } else if (schedule.doctor_id) {
        scheduleHasDoctor = schedule.doctor_id === doctorId;
      }
      
      if (!scheduleHasDoctor) return false;
      
      // فحص التعارض في نفس اليوم ونوع الدراسة
      if (schedule.day_of_week !== dayOfWeek || schedule.study_type !== studyType) return false;
      
      // فحص تداخل الوقت
      const scheduleStart = schedule.start_time;
      const scheduleEnd = schedule.end_time;
      
      const hasTimeConflict = (
        (startTime >= scheduleStart && startTime < scheduleEnd) ||
        (endTime > scheduleStart && endTime <= scheduleEnd) ||
        (startTime <= scheduleStart && endTime >= scheduleEnd)
      );
      
      return hasTimeConflict;
    });
    
    if (conflictingSchedule) {
      return {
        available: false,
        conflict: {
          subject: conflictingSchedule.subject_name,
          stage: stages[conflictingSchedule.academic_stage] || conflictingSchedule.academic_stage,
          time: `${conflictingSchedule.start_time} - ${conflictingSchedule.end_time}`,
          room: conflictingSchedule.room_name || conflictingSchedule.room_code || `قاعة ${conflictingSchedule.room_id}`,
          day: days[conflictingSchedule.day_of_week] || conflictingSchedule.day_of_week
        }
      };
    }
    
    return { available: true, conflict: null };
  }, [allSchedules, editingSchedule, stages, days]);

  const fetchRoomAndSchedules = useCallback(async () => {
    try {
      // جلب معلومات القاعة
      const roomResponse = await roomsAPI.getRoom(roomId);
      if (roomResponse.success) {
        setRoom(roomResponse.data);
      }

      // جلب جداول القاعة
      const schedulesResponse = await roomsAPI.getRoomSchedules(roomId);
      if (schedulesResponse.success) {
        setSchedules(schedulesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching room and schedules:', error);
      setError('فشل في جلب بيانات القاعة وجداولها: ' + error.message);
    }
  }, [roomId]);

  // دالة جديدة لجلب جميع الجداول من جميع القاعات
  const fetchAllSchedules = useCallback(async () => {
    try {
      const response = await roomsAPI.getAllRooms();
      if (response.success && response.data) {
        const allSchedulesPromises = response.data.map(async (room) => {
          try {
            const roomSchedulesResponse = await roomsAPI.getRoomSchedules(room.id);
            if (roomSchedulesResponse.success) {
              return roomSchedulesResponse.data.map(schedule => ({
                ...schedule,
                room_name: room.name,
                room_code: room.code
              }));
            }
          } catch (error) {
            console.warn(`Failed to fetch schedules for room ${room.id}:`, error);
          }
          return [];
        });

        const allSchedulesArrays = await Promise.all(allSchedulesPromises);
        const flattenedSchedules = allSchedulesArrays.flat();
        setAllSchedules(flattenedSchedules);
      }
    } catch (error) {
      console.warn('Failed to fetch all schedules:', error);
    }
  }, []);

  useEffect(() => {
    fetchRoomAndSchedules();
    fetchAllSchedules();

    const fetchAllRooms = async () => {
      try {
        const response = await roomsAPI.getAllRooms();
        if (response.success) {
          setAllRooms(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch all rooms:", error);
      }
    };
    fetchAllRooms();

    const fetchDoctors = async () => {
        try {
            const response = await doctorsAPI.getAllDoctors();
            setDoctors(response);
        } catch (error) {
            console.error("Failed to fetch doctors:", error);
            setError('فشل في جلب قائمة المدرسين: ' + error.message);
        }
    };
    fetchDoctors();

    // fetch departments for doctor filtering if available
    // Note: department filtering has been removed for security reasons.
    // We intentionally do not call the /doctors/departments endpoint to avoid permission errors (403).
  }, [fetchRoomAndSchedules, fetchAllSchedules]);

  // تحسين الأداء باستخدام useMemo لتجنب حسابات مكررة
  const formDependencies = useMemo(() => ({
    day: scheduleForm.day_of_week,
    start: scheduleForm.start_time,
    end: scheduleForm.end_time,
    study: scheduleForm.study_type,
    stage: scheduleForm.academic_stage
  }), [scheduleForm.day_of_week, scheduleForm.start_time, scheduleForm.end_time, scheduleForm.study_type, scheduleForm.academic_stage]);

  // تحديث حالة توفر الدكاترة عند تغيير البيانات
  useEffect(() => {
    if (doctors.length === 0) return;
    
    const availability = {};
    let hasChanges = false;
    
    doctors.forEach(doctor => {
      const availabilityCheck = checkDoctorAvailability(
        doctor.id,
        formDependencies.day,
        formDependencies.start,
        formDependencies.end,
        formDependencies.study,
        formDependencies.stage
      );
      availability[doctor.id] = availabilityCheck;
      
      // فحص إذا كان هناك تغيير فعلي
      const oldAvailability = doctorAvailability[doctor.id];
      if (!oldAvailability || 
          oldAvailability.available !== availabilityCheck.available ||
          JSON.stringify(oldAvailability.conflict) !== JSON.stringify(availabilityCheck.conflict)) {
        hasChanges = true;
      }
    });
    
    // تحديث فقط إذا كان هناك تغييرات فعلية
    if (hasChanges) {
      setDoctorAvailability(availability);
    }
  }, [doctors, allSchedules, formDependencies]);

  const fetchSchedules = useCallback(async () => {
    try {
      const response = await roomsAPI.getRoomSchedules(roomId);
      if (response.success) {
        console.log('DEBUG: Received schedules:', response.data); // Debug log
        setSchedules(response.data);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setError('فشل في جلب جداول القاعة: ' + error.message);
    }
  }, [roomId]);

  // دالة منفصلة لتحديث الجداول بعد التعديل
  const refreshAllData = useCallback(async () => {
    try {
      await Promise.all([
        fetchSchedules(),
        fetchAllSchedules()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [fetchSchedules, fetchAllSchedules]);

  // Function to handle Excel file upload
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset input
    e.target.value = null;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await roomsAPI.uploadWeeklySchedule(roomId, formData);

      if (response.success) {
        setUploadResults(response.data);
        setShowUploadResults(true);
        setSuccess(response.message);
        fetchSchedules(); // Refresh schedules
      } else {
        setError(response.message || 'فشل في تحميل الجدول الأسبوعي');
      }
    } catch (error) {
      console.error('Error uploading Excel file:', error);
      setError(error.response?.data?.message || 'فشل في تحميل ملف Excel');
    } finally {
      setLoading(false);
    }
  };

  // Function to open the delete all schedules confirmation modal
  const handleDeleteAllSchedules = () => {
    setShowDeleteAllModal(true);
  };

  // Function to confirm and delete all schedules for the room
  const handleConfirmDeleteAll = async () => {
    setDeleteAllLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await roomsAPI.deleteAllSchedulesByRoomId(roomId);
      if (response.success) {
        setSuccess('تم حذف جميع الجداول بنجاح.');
        fetchSchedules(); // Refresh schedules
      } else {
        setError(response.message || 'فشل في حذف جميع الجداول.');
      }
    } catch (error) {
      console.error('Error deleting all schedules:', error);
      setError(error.response?.data?.message || error.message || 'فشل في حذف جميع الجداول.');
    } finally {
      setDeleteAllLoading(false);
      setShowDeleteAllModal(false);
    }
  };

  // دالة معالجة تغيير الوقت
  const handleTimeChange = (field, value) => {
    // تنسيق الوقت للتأكد من صحته
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (value === '' || timeRegex.test(value)) {
      setScheduleForm({...scheduleForm, [field]: value});
    }
  };

  // دالة معالجة إدخال الوقت يدوياً
  const handleManualTimeChange = (field, value) => {
    // إزالة أي أحرف غير مسموح بها
    let cleanValue = value.replace(/[^\d:]/g, '');
    
    // التحقق من أن القيمة لا تحتوي على أكثر من نقطتين
    const colonCount = (cleanValue.match(/:/g) || []).length;
    if (colonCount > 1) {
      cleanValue = cleanValue.replace(/:/g, (match, index) => 
        index === cleanValue.indexOf(':') ? ':' : ''
      );
    }
    
    // تنسيق الوقت تلقائياً
    if (cleanValue.length >= 1) {
      // إذا كان رقم واحد أو رقمين، نعتبرهما الساعة
      if (cleanValue.length === 1 || cleanValue.length === 2) {
        const hour = cleanValue.padStart(2, '0');
        if (parseInt(hour) <= 23) {
          cleanValue = hour + ':';
        }
      } else if (cleanValue.length === 3 && !cleanValue.includes(':')) {
        // إذا كان ثلاثة أرقام بدون نقطتين، الأول أو الأولين للساعة والباقي للدقائق
        const hour = cleanValue.substring(0, 2);
        const minute = cleanValue.substring(2, 3);
        if (parseInt(hour) <= 23) {
          cleanValue = hour + ':' + minute;
        }
      } else if (cleanValue.length >= 4 && !cleanValue.includes(':')) {
        // إذا كان أربعة أرقام أو أكثر بدون نقطتين
        const hour = cleanValue.substring(0, 2);
        const minute = cleanValue.substring(2, 4);
        if (parseInt(hour) <= 23 && parseInt(minute) <= 59) {
          cleanValue = hour + ':' + minute;
        }
      } else if (cleanValue.includes(':')) {
        // إذا كان يحتوي على نقطتين، تنسيق صحيح
        const parts = cleanValue.split(':');
        if (parts.length === 2) {
          const hour = parts[0].padStart(2, '0');
          const minute = parts[1].substring(0, 2).padEnd(2, '0');
          if (parseInt(hour) <= 23 && parseInt(minute) <= 59) {
            cleanValue = hour + ':' + minute;
          }
        }
      }
    }
    
    // التحقق من صحة التنسيق النهائي
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const partialTimeRegex = /^([0-1]?[0-9]|2[0-3]):?[0-5]?[0-9]?$/;
    
    if (cleanValue === '' || timeRegex.test(cleanValue) || partialTimeRegex.test(cleanValue)) {
      setScheduleForm({...scheduleForm, [field]: cleanValue});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // التحقق من أن المدرس محدد
    if (scheduleForm.use_multiple_doctors) {
      if (!scheduleForm.doctor_ids || scheduleForm.doctor_ids.length === 0) {
        setError('يجب اختيار مدرس واحد على الأقل');
        setLoading(false);
        return;
      }
    } else {
      if (!scheduleForm.doctor_id) {
        setError('يجب اختيار المدرس');
        setLoading(false);
        return;
      }
    }

    // التحقق من صحة الوقت
    if (!scheduleForm.start_time || !scheduleForm.end_time) {
      setError('يجب إدخال وقت البداية والنهاية');
      setLoading(false);
      return;
    }

    // التحقق من صيغة الوقت
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(scheduleForm.start_time) || !timeRegex.test(scheduleForm.end_time)) {
      setError('صيغة الوقت غير صحيحة. استخدم صيغة HH:MM (مثال: 08:30)');
      setLoading(false);
      return;
    }

    // التحقق من أن وقت البداية قبل وقت النهاية
    if (scheduleForm.start_time >= scheduleForm.end_time) {
      setError('وقت البداية يجب أن يكون قبل وقت النهاية');
      setLoading(false);
      return;
    }

    try {
      let commonScheduleData;
      
      if (scheduleForm.use_multiple_doctors) {
        commonScheduleData = {
          subject_name: scheduleForm.subject_name.trim(),
          doctor_ids: scheduleForm.doctor_ids,
          primary_doctor_id: scheduleForm.primary_doctor_id || scheduleForm.doctor_ids[0],
          use_multiple_doctors: true,
          notes: scheduleForm.notes.trim(),
          lecture_type: scheduleForm.lecture_type || 'نظري',
          section: (scheduleForm.lecture_type || 'نظري') === 'نظري' ? (scheduleForm.section || 1) : null,
          group: (scheduleForm.lecture_type || 'نظري') === 'عملي' ? (scheduleForm.group || 'A') : null,
        };
      } else {
        commonScheduleData = {
          subject_name: scheduleForm.subject_name.trim(),
          doctor_id: scheduleForm.doctor_id,
          notes: scheduleForm.notes.trim(),
          lecture_type: scheduleForm.lecture_type || 'نظري',
          section: (scheduleForm.lecture_type || 'نظري') === 'نظري' ? (scheduleForm.section || 1) : null,
          group: (scheduleForm.lecture_type || 'نظري') === 'عملي' ? (scheduleForm.group || 'A') : null,
        };
        
        // Add instructor_name for backward compatibility
        if (scheduleForm.doctor_id) {
          const selectedDoctor = doctors.find(d => d.id === parseInt(scheduleForm.doctor_id));
          if (selectedDoctor) {
            commonScheduleData.instructor_name = selectedDoctor.name;
          }
        }
      }

      let response;

      if (editingSchedule) {
        // Logic for updating an existing schedule (permanent or temporary)
        // This part needs careful consideration if editing a temporary schedule
        // For now, assuming editing only applies to permanent schedules via this flow
        // If editing a temporary schedule, it should go through update_temporary_schedule endpoint

        const formData = {
          ...scheduleForm,
          ...commonScheduleData,
        };

        const coreChanged = (
          editingSchedule.study_type !== formData.study_type ||
          editingSchedule.academic_stage !== formData.academic_stage ||
          editingSchedule.day_of_week !== formData.day_of_week
        );

        if (coreChanged) {
          const oldCopy = { ...editingSchedule };
          try {
            await roomsAPI.deleteSchedule(roomId, editingSchedule.id);
          } catch (delErr) {
            throw new Error('فشل حذف الجدول القديم: ' + (delErr?.response?.data?.message || delErr.message || ''));
          }

          try {
            // When recreating on coreChanged path, ensure lecture_type normalization
            const createPayload = {
              ...formData,
              lecture_type: normalizeLectureTypeForServer(formData.lecture_type),
              lecture_type_display: formData.lecture_type
            };
            const createRes = await roomsAPI.createSchedule(roomId, createPayload);
            if (!createRes.success) {
              try {
                // Create fallback with original data including instructor_name
                const fallbackData = {
                  study_type: oldCopy.study_type,
                  academic_stage: oldCopy.academic_stage,
                  day_of_week: oldCopy.day_of_week,
                  start_time: oldCopy.start_time,
                  end_time: oldCopy.end_time,
                  subject_name: oldCopy.subject_name,
                  notes: oldCopy.notes || ''
                };
                
                // Add instructor information based on available data
                if (oldCopy.instructor_name) {
                  fallbackData.instructor_name = oldCopy.instructor_name;
                }
                if (oldCopy.doctor_id) {
                  fallbackData.doctor_id = oldCopy.doctor_id;
                  // If we have doctor_id but no instructor_name, get it from doctors list
                  if (!fallbackData.instructor_name) {
                    const doctor = doctors.find(d => d.id === oldCopy.doctor_id);
                    if (doctor) {
                      fallbackData.instructor_name = doctor.name;
                    }
                  }
                }
                
                await roomsAPI.createSchedule(roomId, fallbackData);
              } catch (_) {}
              throw new Error(createRes.message || 'فشل في إنشاء الجدول الجديد');
            }
            setSuccess('تم نقل/تحديث الجدول بنجاح');
          } catch (createErr) {
            if (createErr?.message) throw createErr;
            throw new Error('فشل في نقل الجدول');
          }
        } else {
          // Use the appropriate update endpoint based on doctor mode
          const formData = {
            ...scheduleForm,
            ...commonScheduleData,
          };
          
          console.log('FormData being sent:', formData); // Debug log
          
          // Ensure lecture_type is always sent
          if (!formData.lecture_type) {
            formData.lecture_type = 'نظري';
            console.log('Added default lecture_type:', formData.lecture_type);
          }
          
          console.log('FormData after conversion:', formData); // Debug log
          
          // Normalize lecture_type for backend and include display label
          const updatePayload = {
            ...formData,
            lecture_type: normalizeLectureTypeForServer(formData.lecture_type),
            lecture_type_display: formData.lecture_type
          };
          
          response = await roomsAPI.updateSchedule(roomId, editingSchedule.id, updatePayload);
          
          if (response.success) {
            // Check if only lecture type was changed
            const onlyLectureTypeChanged = (
              editingSchedule.lecture_type !== (scheduleForm.lecture_type === 'نظري' ? 'theoretical' : 'practical') &&
              editingSchedule.subject_name === scheduleForm.subject_name &&
              editingSchedule.start_time === scheduleForm.start_time &&
              editingSchedule.end_time === scheduleForm.end_time
            );
            
            if (onlyLectureTypeChanged) {
              setSuccess('تم تحديث نوع المحاضرة بنجاح');
            } else {
              setSuccess(scheduleForm.use_multiple_doctors ? 'تم تحديث الجدول بعدة مدرسين بنجاح' : 'تم تحديث الجدول بنجاح');
            }
          }
        }
      } else {
        // Logic for creating a new schedule (permanent or temporary)
        if (scheduleForm.is_temporary) {
          // Validate temporary booking date
          if (!temporaryBookingDate) {
            setError('يرجى إدخال تاريخ الحجز المؤقت.');
            setLoading(false);
            return;
          }

          const temporarySchedulePayload = {
            original_schedule_id: conflictingScheduleDetails.id,
            room_id: parseInt(roomId),
            day_of_week: scheduleForm.day_of_week,
            temporary_start_time: scheduleForm.start_time,
            temporary_end_time: scheduleForm.end_time,
            subject_name: scheduleForm.subject_name.trim(),
            doctor_id: scheduleForm.doctor_id, // Changed from instructor_name
            notes: scheduleForm.notes.trim(),
            temporary_room_id: scheduleForm.temporary_room_id ? parseInt(scheduleForm.temporary_room_id) : null,
          };

          setIsTemporarySubmissionAttempt(true);
          response = await roomsAPI.createTemporarySchedule(temporarySchedulePayload);
          setIsTemporarySubmissionAttempt(false);

          if (response.success) {
            setSuccess('تم إنشاء الحجز المؤقت بنجاح.');
          }
        } else {
          // Create a permanent schedule
          let permanentSchedulePayload = {
            ...scheduleForm,
            ...commonScheduleData,
          };
          
          // Normalize lecture_type for server
          permanentSchedulePayload = {
            ...permanentSchedulePayload,
            lecture_type: normalizeLectureTypeForServer(permanentSchedulePayload.lecture_type),
            lecture_type_display: scheduleForm.lecture_type
          };
          
          if (scheduleForm.use_multiple_doctors) {
            // Use multiple doctors endpoint
            response = await roomsAPI.createScheduleWithMultipleDoctors(roomId, permanentSchedulePayload);
          } else {
            // Use single doctor endpoint
            response = await roomsAPI.createSchedule(roomId, permanentSchedulePayload);
          }
          
          if (response.success) {
            setSuccess(scheduleForm.use_multiple_doctors ? 'تم إنشاء الجدول بعدة مدرسين بنجاح' : 'تم إنشاء الجدول بنجاح');
          }
        }
      }

      setShowModal(false);
      resetForm();
      refreshAllData();
    } catch (error) {
      if (error.response && error.response.status === 409) {
        // Conflict detected
        const conflictData = error.response.data;
        setConflictingScheduleDetails(conflictData.conflicting_schedule);
        setNewOriginalScheduleTime(conflictData.conflicting_schedule.start_time + ' - ' + conflictData.conflicting_schedule.end_time);
        setNewOriginalScheduleRoom(conflictData.conflicting_schedule.room_id);
        setShowConflictModal(true);

        // Store the temporary schedule data if it was a temporary submission attempt
        if (scheduleForm.is_temporary && isTemporarySubmissionAttempt) {
          const temporarySchedulePayload = {
            original_schedule_id: conflictData.conflicting_schedule.id,
            room_id: parseInt(roomId),
            day_of_week: scheduleForm.day_of_week,
            temporary_start_time: scheduleForm.start_time,
            temporary_end_time: scheduleForm.end_time,
            subject_name: scheduleForm.subject_name.trim(),
            instructor_name: scheduleForm.instructor_name.trim(),
            notes: scheduleForm.notes.trim(),
            temporary_room_id: scheduleForm.temporary_room_id ? parseInt(scheduleForm.temporary_room_id) : null,
          };
          setPendingTemporaryScheduleData(temporarySchedulePayload);
        }
      } else {
        // Detailed error handling with specific error messages
        console.error('Error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });

        let errorMessage = 'فشل في حفظ الجدول';
        
        if (error.response?.status === 400) {
          // Handle 400 Bad Request errors with detailed messages
          const errorData = error.response.data;
          
          if (errorData.error && typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (errorData.message && typeof errorData.message === 'string') {
            errorMessage = errorData.message;
          } else if (errorData.detail && typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.join(', ');
          } else {
            // Default message for 400 errors
            if (scheduleForm.use_multiple_doctors) {
              errorMessage = 'خطأ في بيانات المدرسين المتعددين. تحقق من صحة البيانات المدخلة.';
            } else {
              errorMessage = 'خطأ في البيانات المرسلة. تحقق من صحة جميع الحقول.';
            }
          }
        } else if (error.response?.status === 409) {
          errorMessage = 'يوجد تعارض في الجدول المحدد';
        } else if (error.response?.status === 403) {
          errorMessage = 'لا يوجد لديك صلاحية لتنفيذ هذا الإجراء';
        } else if (error.response?.status === 404) {
          errorMessage = 'القاعة أو المدرس غير موجود';
        } else if (error.response?.status >= 500) {
          errorMessage = 'خطأ في الخادم. يرجى المحاولة مرة أخرى';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      setIsTemporarySubmissionAttempt(false); // Reset the flag
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    
    // تنسيق الوقت للتأكد من صحة الصيغة
    const formatTime = (timeStr) => {
      if (!timeStr) return '';
      
      // إذا كان الوقت يحتوي على ثواني، إزالتها
      if (timeStr.includes(':')) {
        const parts = timeStr.split(':');
        if (parts.length >= 2) {
          const hour = parts[0].padStart(2, '0');
          const minute = parts[1].substring(0, 2).padEnd(2, '0');
          return `${hour}:${minute}`;
        }
      }
      
      // إذا كان الوقت رقم فقط، تنسيقه
      if (/^\d+$/.test(timeStr)) {
        const hour = timeStr.padStart(2, '0');
        if (parseInt(hour) <= 23) {
          return hour + ':00';
        }
      }
      
      return timeStr;
    };
    
    // Check if schedule has multiple doctors
    const hasMultipleDoctors = schedule.schedule_doctors && schedule.schedule_doctors.length > 0;
    const doctorIds = hasMultipleDoctors ? 
      schedule.schedule_doctors.map(sd => sd.doctor_id) : 
      (schedule.doctor_id ? [schedule.doctor_id] : []);
    const primaryDoctorId = hasMultipleDoctors ? 
      schedule.schedule_doctors.find(sd => sd.is_primary)?.doctor_id || '' : 
      schedule.doctor_id;
    
    setScheduleForm({
      study_type: schedule.study_type,
      academic_stage: schedule.academic_stage,
      day_of_week: schedule.day_of_week,
      start_time: formatTime(schedule.start_time),
      end_time: formatTime(schedule.end_time),
      subject_name: schedule.subject_name,
      doctor_id: hasMultipleDoctors ? '' : (schedule.doctor_id || ''), // Single doctor mode
      doctor_ids: doctorIds, // Multiple doctors mode
      primary_doctor_id: primaryDoctorId || '',
      use_multiple_doctors: hasMultipleDoctors && doctorIds.length > 1,
      notes: schedule.notes || '',
      lecture_type: schedule.lecture_type === 'theoretical' ? 'نظري' : schedule.lecture_type === 'practical' ? 'عملي' : 'نظري',
      section: schedule.section_number || 1,
      group: schedule.group_letter || 'A',
      is_temporary: false,
      temporary_room_id: '',
      temporary_lecture_time: ''
    });
    
    setShowModal(true);
  };

  const handleDelete = async (scheduleId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الجدول؟')) {
      try {
        const response = await roomsAPI.deleteSchedule(roomId, scheduleId);
        if (response.success) {
          setSuccess('تم حذف الجدول بنجاح');
          refreshAllData();
        }
      } catch (error) {
        setError('فشل في حذف الجدول');
      }
    }
  };

  // New function to handle temporary relocation of schedules
  const handleTempRelocation = (schedule) => {
    setPostponingSchedule(schedule);
    
    // Debug log to see what time values we're getting
    console.log('Original schedule time values:', {
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      type_start: typeof schedule.start_time,
      type_end: typeof schedule.end_time
    });
    
    // Set default date to today in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Ensure time is in HH:MM format
    const formatTime = (timeStr) => {
      if (!timeStr) return '00:00';
      
      // If it's already in HH:MM format, return as is
      if (/^\d{2}:\d{2}$/.test(timeStr)) {
        return timeStr;
      }
      
      // If it has seconds or milliseconds, remove them
      if (timeStr.includes(':')) {
        // Remove any seconds or milliseconds
        const cleanTime = timeStr.split('.')[0]; // Remove milliseconds
        const parts = cleanTime.split(':');
        if (parts.length >= 2) {
          const hour = parts[0].padStart(2, '0');
          const minute = parts[1].substring(0, 2).padEnd(2, '0');
          // Ensure valid hour and minute
          const validHour = Math.min(23, Math.max(0, parseInt(hour) || 0)).toString().padStart(2, '0');
          const validMinute = Math.min(59, Math.max(0, parseInt(minute) || 0)).toString().padStart(2, '0');
          return `${validHour}:${validMinute}`;
        }
      }
      
      // Try to parse as a time string
      try {
        const date = new Date(`1970-01-01T${timeStr}`);
        if (!isNaN(date.getTime())) {
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          return `${hours}:${minutes}`;
        }
      } catch (e) {
        // Fall through to default
      }
      
      // Default fallback
      return '00:00';
    };
    
    const formattedStartTime = formatTime(schedule.start_time);
    const formattedEndTime = formatTime(schedule.end_time);
    
    console.log('Formatted time values:', {
      start_time: formattedStartTime,
      end_time: formattedEndTime
    });
    
    setPostponementForm({
      postponed_date: today,
      postponed_to_room_id: '',
      postponed_reason: 'امتحان',
      postponed_start_time: formattedStartTime,
      postponed_end_time: formattedEndTime
    });
    setShowPostponementModal(true);
  };

  // New function to submit temporary relocation
  const handleSubmitTempRelocation = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(postponementForm.postponed_date)) {
      setError('صيغة التاريخ غير صحيحة، يجب أن تكون بصيغة YYYY-MM-DD');
      setLoading(false);
      return;
    }
    
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(postponementForm.postponed_start_time) || !timeRegex.test(postponementForm.postponed_end_time)) {
      setError('صيغة الوقت غير صحيحة، يجب أن تكون بصيغة HH:MM');
      setLoading(false);
      return;
    }
    
    // Debug log to see what data is being sent
    console.log('Postponement form data being sent:', postponementForm);
    
    try {
      const response = await roomsAPI.postponeSchedule(
        roomId, 
        postponingSchedule.id, 
        postponementForm
      );
      
      if (response.success) {
        setSuccess('تم نقل الجدول مؤقتاً بنجاح');
        setShowPostponementModal(false);
        resetForm();
        refreshAllData();
      } else {
        setError(response.message || 'فشل في تنفيذ النقل المؤقت');
      }
    } catch (error) {
      console.error('Error in postponement:', error);
      setError('فشل في تنفيذ النقل المؤقت: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleResolveConflict = async () => {
    setLoading(true);
    setError('');

    try {
      // Create the temporary schedule with information about how to move the original schedule
      if (pendingTemporaryScheduleData) {
        // Prepare data for moving the original schedule
        const movedScheduleData = {
          room_id: newOriginalScheduleRoom,
          start_time: newOriginalScheduleTime.split(' - ')[0],
          end_time: newOriginalScheduleTime.split(' - ')[1],
          day_of_week: conflictingScheduleDetails.day_of_week
        };

        const createTemporaryResponse = await roomsAPI.createTemporarySchedule({
          ...pendingTemporaryScheduleData,
          moved_schedule_data: movedScheduleData
        });

        if (!createTemporaryResponse.success) {
          throw new Error(createTemporaryResponse.message || 'فشل في إنشاء الجدول المؤقت بعد حل التعارض.');
        }
        setPendingTemporaryScheduleData(null);
      }

      setSuccess('تم حل التعارض وإنشاء الجدول المؤقت بنجاح.');
      setShowConflictModal(false);
      resetForm();
      refreshAllData();

    } catch (error) {
      setError(error.response?.data?.message || error.message || 'فشل في حل التعارض.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setScheduleForm({
      study_type: 'morning',
      academic_stage: 'first',
      day_of_week: 'sunday',
      start_time: '',
      end_time: '',
      subject_name: '',
      doctor_id: '', // Single doctor (legacy support)
      doctor_ids: [], // Multiple doctors
      primary_doctor_id: '', // Primary doctor when multiple selected
      use_multiple_doctors: false, // Toggle between single and multiple
      notes: '',
      lecture_type: 'نظري', // Default to theoretical
      section: 1, // Default section
      group: 'A', // Default group
      is_temporary: false,
      temporary_room_id: '',
      temporary_lecture_time: ''
    });
    setEditingSchedule(null);
    setTemporaryBookingDate('');
    setPendingTemporaryScheduleData(null);
  };

  const getVariant = (stage) => {
    switch (stage) {
      case 'first': return 'primary';
      case 'second': return 'success';
      case 'third': return 'warning';
      case 'fourth': return 'danger';
      default: return 'secondary';
    }
  };

  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const key = `${schedule.study_type}-${schedule.day_of_week}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(schedule);
    return acc;
  }, {});

  const cardStyles = {
    theoretical: {
      background: '#ffffff',
      borderLeft: '4px solid #0dcaf0', // info color
      padding: '0.75rem',
      borderRadius: '8px'
    },
    practical: {
      background: '#ffffff',
      borderLeft: '4px solid #28a745', // success color
      padding: '0.75rem',
      borderRadius: '8px'
    }
  };

  // Helper: normalize lecture_type from Arabic UI to backend expected values
  const normalizeLectureTypeForServer = (value) => {
    if (!value) return 'theoretical';
    const v = String(value).trim().toLowerCase();
    if (v === 'عملي' || v === 'عم' || v === 'عملى' || v === 'practical' || v === 'عمليّ') {
      return 'practical';
    }
    // Default to theoretical for anything else
    return 'theoretical';
  };

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 style={{ color: '#111827' }}>إدارة جدول القاعة</h2>
              {room && (
                <p className="text-muted">
                  قاعة: {room.name} - رمز: {room.code}
                </p>
              )}
            </div>
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              العودة للرئيسية
            </Button>
          </div>
          
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between">
              <h5 style={{ color: '#111827' }}>جداول القاعة</h5>
              <div className="d-flex gap-2">
                <Button 
                  variant="danger" 
                  onClick={handleDeleteAllSchedules}
                  disabled={loading || deleteAllLoading}
                >
                  <i className="fas fa-trash-alt me-1"></i>
                  حذف جميع الجداول
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                >
                  إضافة جدول جديد
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {schedules.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <h5>لا توجد جداول محددة</h5>
                  <p>ابدأ بإضافة الجداول للقاعة</p>
                </div>
              ) : (
                Object.entries(groupedSchedules).map(([key, daySchedules]) => {
                  const [studyType, dayOfWeek] = key.split('-');
                  return (
                    <div key={key} className="mb-4">
                      <h6 className="text-primary border-bottom pb-2">
                        {days[dayOfWeek]} - {studyTypes[studyType]}
                      </h6>
                      
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>المرحلة</th>
                            <th>الوقت</th>
                            <th>المادة</th>
                            <th>النوع</th>
                            <th>المدرس</th>
                            <th>ملاحظات</th>
                            <th>الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {daySchedules
                            .sort((a, b) => {
                              // ترتيب حسب المرحلة ثم الوقت
                              const stageOrder = ['first', 'second', 'third', 'fourth'];
                              const stageA = stageOrder.indexOf(a.academic_stage);
                              const stageB = stageOrder.indexOf(b.academic_stage);
                              if (stageA !== stageB) return stageA - stageB;
                              return a.start_time.localeCompare(b.start_time);
                            })
                            .map(schedule => (
                            <tr key={schedule.id}>
                              <td>
                                <Badge bg={getVariant(schedule.academic_stage)}>
                                  {stages[schedule.academic_stage]}
                                </Badge>
                              </td>
                              <td>
                                {schedule.start_time} - {schedule.end_time}
                                {(schedule.is_moved_out || schedule.is_temporary_move_in) && (
                                  <div
                                    className="small text-warning mt-1"
                                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                    onClick={() => {
                                      setTemporaryMoveDetails(schedule);
                                      setShowTemporaryMoveDetailsModal(true);
                                    }}
                                  >
                                    <i className="fas fa-exclamation-circle me-1"></i>
                                    {schedule.is_moved_out ? 'تم نقلها مؤقتاً من هنا' : 'محاضرة مؤقتة'}
                                  </div>
                                )}
                              </td>
                              <td>
                                <div style={schedule.lecture_type === 'practical' ? cardStyles.practical : cardStyles.theoretical}>
                                  <div><strong>{schedule.subject_name}</strong></div>
                                  <div className="mt-2 small text-muted">
                                    نوع: {schedule.lecture_type === 'theoretical' ? `نظري — الشعبة ${schedule.section_number || '-'}` : `عملي — الكروب ${schedule.group_letter || '-'}`}
                                  </div>
                                  {(schedule.is_moved_out || schedule.is_temporary_move_in) && (
                                    <div>
                                      <Badge bg="warning" className="mt-1">
                                        <i className="fas fa-clock me-1"></i>
                                        {schedule.is_moved_out ? 'منقولة مؤقتاً' : 'مؤقتة'}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div>
                                  <Badge bg={schedule.lecture_type === 'theoretical' ? 'info' : schedule.lecture_type === 'practical' ? 'success' : 'secondary'}>
                                    {schedule.lecture_type === 'theoretical' ? 'نظري' : schedule.lecture_type === 'practical' ? 'عملي' : 'غير محدد'}
                                  </Badge>
                                  {schedule.lecture_type && (
                                    <div className="small text-muted mt-1">المخزن في قاعدة البيانات: {schedule.lecture_type}</div>
                                  )}
                                  {schedule.lecture_type === 'theoretical' && schedule.section_number && (
                                    <div className="small text-muted mt-1">
                                      الشعبة {schedule.section_number}
                                    </div>
                                  )}
                                  {schedule.lecture_type === 'practical' && schedule.group_letter && (
                                    <div className="small text-muted mt-1">
                                      كروب {schedule.group_letter}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                {/* Display multiple doctors if available */}
                                {schedule.has_multiple_doctors ? (
                                  <div>
                                    <div className="fw-bold text-primary mb-1">
                                      <i className="fas fa-users me-1"></i>
                                      عدة مدرسين:
                                    </div>
                                    <div className="small">
                                      {schedule.multiple_doctors_names?.map((name, index) => (
                                        <div key={index} className={name === schedule.primary_doctor_name ? 'fw-bold text-success' : ''}>
                                          {name === schedule.primary_doctor_name && <i className="fas fa-star me-1" title="مدرس أساسي"></i>}
                                          {name}
                                          {name === schedule.primary_doctor_name && <Badge bg="success" className="ms-1" style={{fontSize: '0.6em'}}>أساسي</Badge>}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <i className="fas fa-user me-1"></i>
                                    {schedule.doctors?.name || schedule.instructor_name || 'غير محدد'}
                                  </div>
                                )}
                              </td>
                              <td>{schedule.notes || '-'}</td>
                              <td>
                                <div className="d-flex gap-1">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleEdit(schedule)}
                                  >
                                    تعديل
                                  </Button>
                                  {(getUserRole() === 'department_head' || getUserRole() === 'supervisor') && (
                                    <Button
                                      variant="warning"
                                      size="sm"
                                      onClick={() => handleTempRelocation(schedule)}
                                    >
                                      <i className="fas fa-exchange-alt me-1"></i>
                                      نقل مؤقت
                                    </Button>
                                  )}
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDelete(schedule.id)}
                                  >
                                    حذف
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  );
                })
              )}

              </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* مودال إضافة/تعديل الجدول */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingSchedule ? 'تعديل الجدول' : 'إضافة جدول جديد'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Alert variant="info">
              أنت تقوم بـ {editingSchedule ? 'تعديل' : 'إضافة'} جدول ليوم: <strong>{days[scheduleForm.day_of_week]}</strong>
            </Alert>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>نوع الدراسة *</Form.Label>
                  <Form.Select
                    value={scheduleForm.study_type}
                    onChange={(e) => setScheduleForm({...scheduleForm, study_type: e.target.value})}
                    required
                  >
                    <option value="morning">صباحي</option>
                    <option value="evening">مسائي</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>المرحلة الدراسية *</Form.Label>
                  <Form.Select
                    value={scheduleForm.academic_stage}
                    onChange={(e) => setScheduleForm({...scheduleForm, academic_stage: e.target.value})}
                    required
                  >
                    <option value="first">المرحلة الأولى</option>
                    <option value="second">المرحلة الثانية</option>
                    <option value="third">المرحلة الثالثة</option>
                    <option value="fourth">المرحلة الرابعة</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>اليوم *</Form.Label>
                  <Form.Select
                    value={scheduleForm.day_of_week}
                    onChange={(e) => setScheduleForm({...scheduleForm, day_of_week: e.target.value})}
                    required
                  >
                    {Object.entries(days).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>وقت البداية *</Form.Label>
                  <Form.Control
                    type="time"
                    value={scheduleForm.start_time}
                    onChange={(e) => handleTimeChange('start_time', e.target.value)}
                    required
                    min="06:00"
                    max="22:00"
                    placeholder="08:30"
                    pattern="[0-2][0-9]:[0-5][0-9]"
                    onBlur={(e) => {
                      // تنظيف القيمة عند فقدان التركيز
                      const value = e.target.value;
                      if (value && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
                        setScheduleForm({...scheduleForm, start_time: ''});
                      }
                    }}
                  />
                  <div className="mt-1">
                    <small className="text-muted">أو أدخل يدوياً:</small>
                    <Form.Control
                      type="text"
                      value={scheduleForm.start_time}
                      onChange={(e) => handleManualTimeChange('start_time', e.target.value)}
                      placeholder="08:30"
                      size="sm"
                      className="mt-1"
                      maxLength="5"
                      onBlur={(e) => {
                        // تنظيف القيمة عند فقدان التركيز
                        const value = e.target.value;
                        if (value && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
                          setScheduleForm({...scheduleForm, start_time: ''});
                        }
                      }}
                    />
                  </div>
                  <Form.Text className="text-muted">
                    تنسيق الوقت: ساعة:دقيقة (مثال: 08:30)
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>وقت النهاية *</Form.Label>
                  <Form.Control
                    type="time"
                    value={scheduleForm.end_time}
                    onChange={(e) => handleTimeChange('end_time', e.target.value)}
                    required
                    min="06:00"
                    max="22:00"
                    placeholder="10:30"
                    pattern="[0-2][0-9]:[0-5][0-9]"
                    onBlur={(e) => {
                      // تنظيف القيمة عند فقدان التركيز
                      const value = e.target.value;
                      if (value && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
                        setScheduleForm({...scheduleForm, end_time: ''});
                      }
                    }}
                  />
                  <div className="mt-1">
                    <small className="text-muted">أو أدخل يدوياً:</small>
                    <Form.Control
                      type="text"
                      value={scheduleForm.end_time}
                      onChange={(e) => handleManualTimeChange('end_time', e.target.value)}
                      placeholder="10:30"
                      size="sm"
                      className="mt-1"
                      maxLength="5"
                      onBlur={(e) => {
                        // تنظيف القيمة عند فقدان التركيز
                        const value = e.target.value;
                        if (value && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
                          setScheduleForm({...scheduleForm, end_time: ''});
                        }
                      }}
                    />
                  </div>
                  <Form.Text className="text-muted">
                    تنسيق الوقت: ساعة:دقيقة (مثال: 10:30)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>اسم المادة *</Form.Label>
                  <Form.Control
                    type="text"
                    value={scheduleForm.subject_name}
                    onChange={(e) => setScheduleForm({...scheduleForm, subject_name: e.target.value})}
                    required
                    placeholder="مثال: الفيزياء العامة"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* نوع المحاضرة */}
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>نوع المحاضرة *</Form.Label>
                  <Form.Select
                    value={scheduleForm.lecture_type}
                    onChange={(e) => {
                      const lectureType = e.target.value;
                      setScheduleForm({
                        ...scheduleForm, 
                        lecture_type: lectureType,
                        // Reset section/group when changing type
                        section: lectureType === 'نظري' ? 1 : null,
                        group: lectureType === 'عملي' ? 'A' : null
                      });
                    }}
                    required
                  >
                    <option value="نظري">نظري</option>
                    <option value="عملي">عملي</option>
                  </Form.Select>
                  {editingSchedule && (
                    <Form.Text className="text-muted">المخزن في قاعدة البيانات: {editingSchedule.lecture_type || 'غير متوفر'}</Form.Text>
                  )}
                </Form.Group>
              </Col>

              {/* الشعبة - تظهر فقط للمحاضرات النظرية */}
              {scheduleForm.lecture_type === 'نظري' && (
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>الشعبة *</Form.Label>
                    <Form.Select
                      value={scheduleForm.section}
                      onChange={(e) => setScheduleForm({...scheduleForm, section: parseInt(e.target.value)})}
                      required
                    >
                      <option value={1}>الشعبة الأولى</option>
                      <option value={2}>الشعبة الثانية</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}

              {/* الكروب - تظهر فقط للمحاضرات العملية */}
              {scheduleForm.lecture_type === 'عملي' && (
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>الكروب *</Form.Label>
                    <Form.Select
                      value={scheduleForm.group}
                      onChange={(e) => setScheduleForm({...scheduleForm, group: e.target.value})}
                      required
                    >
                      <option value="A">كروب A</option>
                      <option value="B">كروب B</option>
                      <option value="C">كروب C</option>
                      <option value="D">كروب D</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <Form.Label className="mb-0">تعيين المدرسين *</Form.Label>
                    <Form.Check 
                      type="switch"
                      id="multiple-doctors-switch"
                      label="عدة مدرسين"
                      checked={scheduleForm.use_multiple_doctors}
                      onChange={(e) => {
                        const useMultiple = e.target.checked;
                        setScheduleForm({
                          ...scheduleForm, 
                          use_multiple_doctors: useMultiple,
                          // Reset fields when switching modes
                          doctor_id: useMultiple ? '' : scheduleForm.doctor_id,
                          doctor_ids: useMultiple ? scheduleForm.doctor_ids : [],
                          primary_doctor_id: useMultiple ? scheduleForm.primary_doctor_id : ''
                        });
                      }}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            {!scheduleForm.use_multiple_doctors ? (
              // Single Doctor Selection
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>المدرس *</Form.Label>
                    <Form.Select
                      value={scheduleForm.doctor_id}
                      onChange={(e) => setScheduleForm({...scheduleForm, doctor_id: e.target.value})}
                      required
                    >
                      <option value="">اختر مدرس</option>
                      {filteredDoctorsByDept.map(doctor => {
                        const availabilityInfo = doctorAvailability[doctor.id] || { available: true };
                        const isAvailable = availabilityInfo.available;
                        return (
                          <option 
                            key={doctor.id} 
                            value={doctor.id}
                            style={{ color: isAvailable ? 'inherit' : '#dc3545' }}
                          >
                            {doctor.name} {!isAvailable ? '⚠️ (غير متوفر - لديه محاضرة)' : ''}
                          </option>
                        );
                      })}
                    </Form.Select>
                    {scheduleForm.doctor_id && doctorAvailability[scheduleForm.doctor_id] && !doctorAvailability[scheduleForm.doctor_id].available && (
                      <Alert variant="warning" className="mt-2">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        <strong>تحذير:</strong> هذا الدكتور لديه محاضرة أخرى في نفس الوقت واليوم.
                        {doctorAvailability[scheduleForm.doctor_id].conflict && (
                          <div className="mt-2 small">
                            <strong>تفاصيل التعارض:</strong>
                            <ul className="mb-0 mt-1">
                              <li><strong>المادة:</strong> {doctorAvailability[scheduleForm.doctor_id].conflict.subject}</li>
                              <li><strong>المرحلة:</strong> {doctorAvailability[scheduleForm.doctor_id].conflict.stage}</li>
                              <li><strong>الوقت:</strong> {doctorAvailability[scheduleForm.doctor_id].conflict.time}</li>
                              <li><strong>القاعة:</strong> {doctorAvailability[scheduleForm.doctor_id].conflict.room}</li>
                            </ul>
                          </div>
                        )}
                        <div className="mt-2">
                          يرجى اختيار وقت آخر أو دكتور آخر.
                        </div>
                      </Alert>
                    )}
                  </Form.Group>
                </Col>
              </Row>
            ) : (
              // Multiple Doctors Selection
              <>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>اختيار المدرسين *</Form.Label>
                      <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {filteredDoctorsByDept.map(doctor => {
                          const availabilityInfo = doctorAvailability[doctor.id] || { available: true };
                          const isAvailable = availabilityInfo.available;
                          const isSelected = scheduleForm.doctor_ids.includes(doctor.id);
                          
                          return (
                            <div key={doctor.id} className="mb-2">
                              <Form.Check 
                                type="checkbox"
                                id={`doctor-${doctor.id}`}
                                label={
                                  <span style={{ color: isAvailable ? 'inherit' : '#dc3545' }}>
                                    {doctor.name} 
                                    {!isAvailable && (
                                      <Badge bg="danger" className="ms-2" style={{ fontSize: '0.7em' }}>
                                        غير متوفر - لديه محاضرة
                                      </Badge>
                                    )}
                                  </span>
                                }
                                checked={isSelected}
                                onChange={(e) => {
                                  const doctorId = doctor.id;
                                  let newDoctorIds;
                                  
                                  if (e.target.checked) {
                                    // Add doctor
                                    newDoctorIds = [...scheduleForm.doctor_ids, doctorId];
                                  } else {
                                    // Remove doctor
                                    newDoctorIds = scheduleForm.doctor_ids.filter(id => id !== doctorId);
                                    // If removing primary doctor, reset primary
                                    if (scheduleForm.primary_doctor_id === doctorId) {
                                      const newPrimary = newDoctorIds.length > 0 ? newDoctorIds[0] : '';
                                      setScheduleForm({
                                        ...scheduleForm,
                                        doctor_ids: newDoctorIds,
                                        primary_doctor_id: newPrimary
                                      });
                                      return;
                                    }
                                  }
                                  
                                  setScheduleForm({
                                    ...scheduleForm,
                                    doctor_ids: newDoctorIds,
                                    // Set first selected doctor as primary if no primary is set
                                    primary_doctor_id: scheduleForm.primary_doctor_id || (newDoctorIds.length > 0 ? newDoctorIds[0] : '')
                                  });
                                }}
                              />
                              {!isAvailable && availabilityInfo.conflict && isSelected && (
                                <div className="small text-muted ms-4 mt-1">
                                  <i className="fas fa-info-circle me-1"></i>
                                  محاضرة: {availabilityInfo.conflict.subject} ({availabilityInfo.conflict.stage}) - {availabilityInfo.conflict.time}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <Form.Text className="text-muted">
                        يمكنك اختيار أكثر من مدرس للمادة الواحدة. الدكاترة غير المتوفرين لديهم محاضرة في نفس الوقت.
                      </Form.Text>
                      {scheduleForm.doctor_ids.some(id => doctorAvailability[id] && !doctorAvailability[id].available) && (
                        <Alert variant="warning" className="mt-2">
                          <i className="fas fa-exclamation-triangle me-2"></i>
                          <strong>تحذير:</strong> بعض الدكاترة المختارين لديهم محاضرات أخرى في نفس الوقت:
                          <ul className="mb-0 mt-2">
                            {scheduleForm.doctor_ids
                              .filter(id => doctorAvailability[id] && !doctorAvailability[id].available)
                              .map(id => {
                                const doctor = doctors.find(d => d.id === id);
                                const conflict = doctorAvailability[id]?.conflict;
                                return doctor && conflict ? (
                                  <li key={id} className="small">
                                    <strong>{doctor.name}:</strong> {conflict.subject} ({conflict.stage}) في {conflict.room}
                                  </li>
                                ) : null;
                              })}
                          </ul>
                        </Alert>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
                
                {scheduleForm.doctor_ids.length > 1 && (
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>المدرس الأساسي *</Form.Label>
                        <Form.Select
                          value={scheduleForm.primary_doctor_id}
                          onChange={(e) => setScheduleForm({...scheduleForm, primary_doctor_id: e.target.value})}
                          required
                        >
                          <option value="">اختر المدرس الأساسي</option>
                          {scheduleForm.doctor_ids.map(doctorId => {
                            const doctor = doctors.find(d => d.id === doctorId);
                            return doctor ? (
                              <option key={doctorId} value={doctorId}>
                                {doctor.name}
                              </option>
                            ) : null;
                          })}
                        </Form.Select>
                        <Form.Text className="text-muted">
                          المدرس الأساسي هو المسؤول الرئيسي عن المادة
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                )}
                
                {scheduleForm.doctor_ids.length > 0 && (
                  <Row>
                    <Col md={12}>
                      <Alert variant="info">
                        <strong>المدرسين المحددين:</strong>
                        <ul className="mb-0 mt-2">
                          {scheduleForm.doctor_ids.map(doctorId => {
                            const doctor = doctors.find(d => d.id === doctorId);
                            const isPrimary = doctorId === scheduleForm.primary_doctor_id;
                            return doctor ? (
                              <li key={doctorId}>
                                {doctor.name}
                                {isPrimary && <Badge bg="primary" className="ms-2">أساسي</Badge>}
                              </li>
                            ) : null;
                          })}
                        </ul>
                      </Alert>
                    </Col>
                  </Row>
                )}
              </>
            )}

            <Form.Group className="mb-3">
              <Form.Label>ملاحظات</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm({...scheduleForm, notes: e.target.value})}
                placeholder="ملاحظات إضافية (اختياري)"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox"
                label="حجز مؤقت"
                checked={scheduleForm.is_temporary}
                onChange={(e) => {
                  setScheduleForm({...scheduleForm, is_temporary: e.target.checked});
                  if (!e.target.checked) {
                    setTemporaryBookingDate(''); // Clear date if not temporary
                  }
                }}
              />
            </Form.Group>

            {scheduleForm.is_temporary && (
              <Form.Group className="mb-3">
                <Form.Label>تاريخ الحجز المؤقت *</Form.Label>
                <Form.Control
                  type="date"
                  value={temporaryBookingDate}
                  onChange={(e) => setTemporaryBookingDate(e.target.value)}
                  required
                />
              </Form.Group>
            )}

            <Alert variant="info">
              <small>
                <strong>تنبيه:</strong> تأكد من عدم وجود تداخل في الأوقات مع جداول أخرى في نفس اليوم ونوع الدراسة
              </small>
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              إلغاء
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : (editingSchedule ? 'تحديث' : 'إنشاء')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* مودال حل التعارض */}
      <Modal show={showConflictModal} onHide={() => setShowConflictModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>حل تعارض الجدول</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {conflictingScheduleDetails && (
            <Alert variant="warning">
              <p>يوجد تداخل بين المحاضرة المؤقتة التي تحاول إضافتها والمحاضرة التالية:</p>
              <ul>
                <li><strong>المادة:</strong> {conflictingScheduleDetails.subject_name}</li>
                <li><strong>المدرس:</strong> {conflictingScheduleDetails.instructor_name}</li>
                <li><strong>القاعة:</strong> {conflictingScheduleDetails.room_id}</li>
                <li><strong>اليوم:</strong> {days[conflictingScheduleDetails.day_of_week]}</li>
                <li><strong>الوقت:</strong> {conflictingScheduleDetails.start_time} - {conflictingScheduleDetails.end_time}</li>
              </ul>
              <p>يرجى تحديد قاعة ووقت جديدين للمحاضرة الأصلية:</p>
            </Alert>
          )}

          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>القاعة الجديدة للمحاضرة الأصلية *</Form.Label>
                  <Form.Select
                    value={newOriginalScheduleRoom}
                    onChange={(e) => setNewOriginalScheduleRoom(e.target.value)}
                    required
                  >
                    <option value="">اختر قاعة</option>
                    {allRooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>الوقت الجديد للمحاضرة الأصلية *</Form.Label>
                  <Form.Control
                    type="time"
                    value={newOriginalScheduleTime}
                    onChange={(e) => setNewOriginalScheduleTime(e.target.value)}
                    required
                    min="06:00"
                    max="22:00"
                    placeholder="HH:MM"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConflictModal(false)}>
            إلغاء
          </Button>
          <Button variant="primary" onClick={handleResolveConflict}>
            تحديث ونقل المحاضرة
          </Button>
        </Modal.Footer>
      </Modal>

      {/* مودال النقل المؤقت */}
      <Modal show={showPostponementModal} onHide={() => setShowPostponementModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            نقل جدول مؤقت
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitTempRelocation}>
          <Modal.Body>
            {postponingSchedule && (
              <div className="mb-4 p-3 bg-light rounded">
                <h6>تفاصيل الجدول الأصلي:</h6>
                <p className="mb-1">
                  <strong>المادة:</strong> {postponingSchedule.subject_name}
                </p>
                <p className="mb-1">
                  <strong>المدرس:</strong> {postponingSchedule.instructor_name}
                </p>
                <p className="mb-1">
                  <strong>الوقت:</strong> {postponingSchedule.start_time} - {postponingSchedule.end_time}
                </p>
                <p className="mb-0">
                  <strong>اليوم:</strong> {days[postponingSchedule.day_of_week]}
                </p>
              </div>
            )}
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>تاريخ النقل المؤقت *</Form.Label>
                  <Form.Control
                    type="date"
                    value={postponementForm.postponed_date}
                    onChange={(e) => setPostponementForm({...postponementForm, postponed_date: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>القاعة الجديدة *</Form.Label>
                  <Form.Select
                    value={postponementForm.postponed_to_room_id}
                    onChange={(e) => setPostponementForm({...postponementForm, postponed_to_room_id: e.target.value})}
                    required
                  >
                    <option value="">اختر القاعة</option>
                    {allRooms.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.name} ({room.code})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>وقت البداية المؤقت *</Form.Label>
                  <Form.Control
                    type="time"
                    value={postponementForm.postponed_start_time}
                    onChange={(e) => setPostponementForm({...postponementForm, postponed_start_time: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>وقت النهاية المؤقت *</Form.Label>
                  <Form.Control
                    type="time"
                    value={postponementForm.postponed_end_time}
                    onChange={(e) => setPostponementForm({...postponementForm, postponed_end_time: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>سبب النقل *</Form.Label>
              <Form.Control
                type="text"
                placeholder="أدخل سبب النقل (مثال: امتحان، تعارض في المحاضرات، صيانة القاعة، فعالية خاصة، إلخ)"
                value={postponementForm.postponed_reason}
                onChange={(e) => setPostponementForm({...postponementForm, postponed_reason: e.target.value})}
                required
              />
            </Form.Group>
            
            <Alert variant="info">
              <small>
                <strong>ملاحظة:</strong> النقل المؤقت سيكون نافذًا ليوم واحد فقط. بعد هذا اليوم، سيعود الجدول إلى قاعته ووقته الأصليين.
              </small>
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPostponementModal(false)}>
              إلغاء
            </Button>
            <Button variant="warning" type="submit" disabled={loading}>
              {loading ? 'جاري النقل...' : 'نقل مؤقت'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* مودال تفاصيل النقل المؤقت */}
      <Modal show={showTemporaryMoveDetailsModal} onHide={() => setShowTemporaryMoveDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>تفاصيل النقل المؤtقت</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {temporaryMoveDetails && (
            <div>
              <p>
                <strong>المادة:</strong> {temporaryMoveDetails.subject_name}
              </p>
              <p>
                <strong>المدرس:</strong> {temporaryMoveDetails.instructor_name}
              </p>
              {temporaryMoveDetails.is_moved_out && (
                <>
                  <p>
                    <strong>تم نقلها مؤقتاً إلى القاعة:</strong> {temporaryMoveDetails.postponed_to_room_id ? allRooms.find(r => r.id === temporaryMoveDetails.postponed_to_room_id)?.code || 'غير متوفر' : 'غير متوفر'}
                  </p>
                  <p>
                    <strong>تاريخ النقل:</strong> {temporaryMoveDetails.postponed_date || 'غير متوفر'}
                  </p>
                  <p>
                    <strong>وقت النقل:</strong> {temporaryMoveDetails.postponed_start_time || 'غير متوفر'} - {temporaryMoveDetails.postponed_end_time || 'غير متوفر'}
                  </p>
                  <p>
                    <strong>سبب النقل:</strong> {temporaryMoveDetails.postponed_reason || 'غير متوفر'}
                  </p>
                </>
              )}
              {temporaryMoveDetails.is_temporary_move_in && (
                <>
                  <p>
                    <strong>القاعة الأصلية:</strong> {temporaryMoveDetails.original_room_id ? allRooms.find(r => r.id === temporaryMoveDetails.original_room_id)?.code || 'غير متوفر' : 'غير متوفر'}
                  </p>
                  <p>
                    <strong>التاريخ الأصلي:</strong> {temporaryMoveDetails.original_booking_date || 'غير متوفر'}
                  </p>
                  <p>
                    <strong>الوقت الأصلي:</strong> {temporaryMoveDetails.original_start_time || 'غير متوفر'} - {temporaryMoveDetails.original_end_time || 'غير متوفر'}
                  </p>
                  <p>
                    <strong>سبب النقل:</strong> {temporaryMoveDetails.move_reason || 'غير متوفر'}
                  </p>
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTemporaryMoveDetailsModal(false)}>
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>

      {/* مودال نتائج تحميل Excel */}
      <Modal show={showUploadResults} onHide={() => setShowUploadResults(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>نتائج تحميل الجدول الأسبوعي</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {uploadResults && (
            <div>
              <Alert variant="success">
                <p><strong>تم إنشاء {uploadResults.created_count} جدول بنجاح</strong></p>
                <p><strong>عدد الأخطاء: {uploadResults.error_count}</strong></p>
                {uploadResults.warning_count > 0 && (
                  <p><strong>عدد التحذيرات: {uploadResults.warning_count}</strong></p>
                )}
              </Alert>
              
              {uploadResults.warnings && uploadResults.warnings.length > 0 && (
                <div className="mt-3">
                  <h6 className="text-warning">التحذيرات:</h6>
                  <ul>
                    {uploadResults.warnings.map((warning, index) => (
                      <li key={index} className="text-warning">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {uploadResults.errors && uploadResults.errors.length > 0 && (
                <div className="mt-3">
                  <h6>الأخطاء:</h6>
                  <ul>
                    {uploadResults.errors.map((error, index) => (
                      <li key={index} className="text-danger">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {uploadResults.created_schedules && uploadResults.created_schedules.length > 0 && (
                <div className="mt-3">
                  <h6>الجداول المُنشأة:</h6>
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>المادة</th>
                        <th>المدرس</th>
                        <th>اليوم</th>
                        <th>الوقت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResults.created_schedules.map((schedule, index) => (
                        <tr key={index}>
                          <td>{schedule.subject_name}</td>
                          <td>{schedule.instructor_name}</td>
                          <td>{days[schedule.day_of_week]}</td>
                          <td>{schedule.start_time} - {schedule.end_time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUploadResults(false)}>
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete All Schedules Confirmation Modal */}
      <Modal show={showDeleteAllModal} onHide={() => setShowDeleteAllModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>تأكيد حذف جميع الجداول</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <p>هل أنت متأكد أنك تريد حذف جميع الجداول لهذه القاعة؟</p>
            <p>لا يمكن التراجع عن هذا الإجراء.</p>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteAllModal(false)} disabled={deleteAllLoading}>
            إلغاء
          </Button>
          <Button variant="danger" onClick={handleConfirmDeleteAll} disabled={deleteAllLoading}>
            {deleteAllLoading ? 'جاري الحذف...' : 'تأكيد الحذف'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EditSchedule;
