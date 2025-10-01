import axios from 'axios';
import { getAuthHeaders } from '../utils/auth';

const API_URL = process.env.REACT_APP_API_URL || 'https://hsabadi.pythonanywhere.com'; // Updated to use remote backend

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodWlzdmF6bmFydXhveHZ2cGp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MDYzOTAsImV4cCI6MjA3MTA4MjM5MH0.p0WPY2XxTqWsIt8xSsF4nep39P-Gb5fQBOmT-rP8TCY'
  },
});

// إضافة token تلقائياً للطلبات
api.interceptors.request.use(
  (config) => {
    const authHeaders = getAuthHeaders();
    config.headers = { ...config.headers, ...authHeaders };
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper to normalize lecture_type values before sending to backend
const normalizeLectureTypeForBackend = (payload = {}) => {
  const p = { ...payload };
  if (!p.lecture_type) return p;

  const val = String(p.lecture_type).trim();
  // Backend expects Arabic values ('نظري' or 'عملي') on input, so convert any incoming
  // representation (Arabic or English) into the Arabic string before sending.
  if (val === 'نظري' || val.toLowerCase() === 'نadh' /* improbable */) p.lecture_type = 'نظري';
  else if (val === 'عملي') p.lecture_type = 'عملي';
  else if (val.toLowerCase() === 'theoretical') p.lecture_type = 'نظري';
  else if (val.toLowerCase() === 'practical') p.lecture_type = 'عملي';
  else {
    // Fallback: detect arabic keywords
    if (val.includes('نظ')) p.lecture_type = 'نظري';
    else if (val.includes('عم')) p.lecture_type = 'عملي';
  }
  return p;
};

// Helper to normalize lecture_type values coming from backend (ensure english strings)
const normalizeLectureTypeFromBackend = (schedule = {}) => {
  const s = { ...schedule };
  if (!s.lecture_type) return s;
  const val = String(s.lecture_type).trim();
  if (val === 'نظري') s.lecture_type = 'theoretical';
  else if (val === 'عملي') s.lecture_type = 'practical';
  else s.lecture_type = val.toLowerCase();
  return s;
};

// Sanitize payload: convert numeric strings to numbers, empty strings to null, normalize arrays
const sanitizeSchedulePayload = (payload = {}) => {
  const p = { ...payload };

  // Normalize IDs to numbers or null
  if (p.doctor_id === '') p.doctor_id = null;
  if (p.primary_doctor_id === '') p.primary_doctor_id = null;
  if (p.doctor_id != null) p.doctor_id = Number(p.doctor_id);
  if (p.primary_doctor_id != null) p.primary_doctor_id = Number(p.primary_doctor_id);

  // Ensure doctor_ids is an array of numbers
  if (!Array.isArray(p.doctor_ids)) p.doctor_ids = p.doctor_ids ? [p.doctor_ids] : [];
  p.doctor_ids = p.doctor_ids.map((id) => (id === '' || id == null ? null : Number(id))).filter((v) => v != null);

  // Convert numeric-like strings for section to Number or null
  if (p.section === '') p.section = null;
  if (p.section != null) p.section = Number(p.section);

  // Normalize boolean flags
  if (typeof p.use_multiple_doctors === 'string') {
    p.use_multiple_doctors = p.use_multiple_doctors === 'true';
  }

  // Normalize empty optional string fields to null to avoid backend casting issues
  ['group', 'temporary_lecture_time', 'temporary_room_id', 'notes', 'instructor_name'].forEach((k) => {
    if (k in p && p[k] === '') p[k] = null;
  });

  // Trim subject_name and notes
  if (typeof p.subject_name === 'string') p.subject_name = p.subject_name.trim();
  if (typeof p.notes === 'string') p.notes = p.notes.trim();

  // Ensure times are trimmed
  if (typeof p.start_time === 'string') p.start_time = p.start_time.trim();
  if (typeof p.end_time === 'string') p.end_time = p.end_time.trim();

  return p;
};

// Validate schedule payload for multi-doctor creation
const validateMultiDoctorSchedule = (payload = {}) => {
  const errors = [];
  // Required fields: subject_name, start_time, end_time, day_of_week, academic_stage, study_type
  if (!payload.subject_name || String(payload.subject_name).trim().length === 0) {
    errors.push('subject_name is required');
  }
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM
  if (!payload.start_time || !timeRegex.test(String(payload.start_time).trim())) {
    errors.push('start_time is required and must be HH:MM');
  }
  if (!payload.end_time || !timeRegex.test(String(payload.end_time).trim())) {
    errors.push('end_time is required and must be HH:MM');
  }
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  if (!payload.day_of_week || !days.includes(String(payload.day_of_week))) {
    errors.push('day_of_week is required and must be one of: ' + days.join(', '));
  }
  const stages = ['first','second','third','fourth'];
  if (!payload.academic_stage || !stages.includes(String(payload.academic_stage))) {
    errors.push('academic_stage is required and must be one of: ' + stages.join(', '));
  }
  const studyTypes = ['morning','evening','night','evening'];
  if (!payload.study_type || !['morning','evening','night'].includes(String(payload.study_type))) {
    // not fatal, but warn
    // errors.push('study_type should be one of morning, evening, night');
  }

  // doctor_ids should be present and an array of numbers
  if (!Array.isArray(payload.doctor_ids) || payload.doctor_ids.length === 0) {
    errors.push('doctor_ids must be a non-empty array of doctor IDs');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const roomsAPI = {
  // الحصول على جميع القاعات (من department routes)
  getRooms: async () => {
    const response = await api.get('/department/rooms');
    return response.data;
  },

  // الحصول على جميع القاعات (من rooms routes)
  getAllRooms: async () => {
    const response = await api.get('/rooms/');
    return response.data;
  },

  // الحصول على قاعة واحدة (من rooms routes)
  getRoom: async (roomId) => {
    // استخدام API الخاص بالقسم للمشرفين ورؤساء الأقسام
    const response = await api.get(`/department/rooms/${roomId}`);
    return response.data;
  },

  // إنشاء قاعة جديدة
  createRoom: async (roomData) => {
    const response = await api.post('/rooms/', roomData);
    return response.data;
  },

  // تحديث قاعة
  updateRoom: async (roomId, roomData) => {
    const response = await api.put(`/rooms/${roomId}`, roomData);
    return response.data;
  },

  // حذف قاعة
  deleteRoom: async (roomId) => {
    const response = await api.delete(`/rooms/${roomId}`);
    return response.data;
  },

  // الحصول على جداول قاعة
  getRoomSchedules: async (roomId) => {
    // استخدام API الخاص بالقسم للمشرفين ورؤساء الأقسام
    const response = await api.get(`/department/schedules/${roomId}`);
    const apiData = response.data;

    // Normalize lecture_type in returned schedules to english values for frontend consistency
    if (apiData && apiData.data && Array.isArray(apiData.data)) {
      apiData.data = apiData.data.map((s) => normalizeLectureTypeFromBackend(s));
    }

    return apiData;
  },

  // إنشاء جدول جديد
  createSchedule: async (roomId, scheduleData) => {
    const cleaned = sanitizeSchedulePayload(scheduleData);
    const payload = normalizeLectureTypeForBackend(cleaned);
    try {
      const response = await api.post(`/rooms/${roomId}/schedules`, payload);
      return response.data;
    } catch (err) {
      console.error('createSchedule error:', err);
      return {
        success: false,
        status: err.response?.status || 500,
        message: err.response?.data?.message || err.response?.data || err.message,
        data: err.response?.data
      };
    }
  },

  // إنشاء جدول جديد مع دعم عدة دكاترة
  createScheduleWithMultipleDoctors: async (roomId, scheduleData) => {
    // Ensure we operate on a shallow copy
    const s = { ...scheduleData, use_multiple_doctors: true };

    // Build doctor_ids array from possible inputs (doctor_ids, doctor_id)
    let doctorIds = Array.isArray(s.doctor_ids) ? [...s.doctor_ids] : (s.doctor_ids ? [s.doctor_ids] : []);

    // If single doctor provided via doctor_id, include it
    if ((!doctorIds || doctorIds.length === 0) && s.doctor_id) {
      doctorIds = [s.doctor_id];
    }

    // Normalize ids to numbers and remove falsy entries
    doctorIds = doctorIds
      .map((id) => (id === '' || id == null ? null : Number(id)))
      .filter((v) => v != null && !Number.isNaN(v));

    // Validate presence of at least one doctor
    if (!doctorIds || doctorIds.length === 0) {
      return {
        success: false,
        status: 400,
        message: 'عند اختيار عدة مدرسين يجب تحديد قائمة بالأطباء (doctor_ids).',
        data: null
      };
    }

    // Ensure primary_doctor_id exists and is one of doctorIds
    if (!s.primary_doctor_id || s.primary_doctor_id === '') {
      s.primary_doctor_id = doctorIds[0];
    }
    s.primary_doctor_id = Number(s.primary_doctor_id);
    if (Number.isNaN(s.primary_doctor_id)) {
      s.primary_doctor_id = doctorIds[0];
    }
    if (!doctorIds.includes(s.primary_doctor_id)) {
      doctorIds.unshift(s.primary_doctor_id);
    }

    // Assign normalized doctor_ids back
    s.doctor_ids = doctorIds;

    // sanitize then normalize lecture_type
    const cleaned = sanitizeSchedulePayload(s);
    const payload = normalizeLectureTypeForBackend(cleaned);

    // Validate payload locally and return errors early
    const validation = validateMultiDoctorSchedule(payload);
    if (!validation.valid) {
      console.error('Validation failed for multi-doctor schedule:', validation.errors, 'payload:', payload);
      return {
        success: false,
        status: 400,
        message: 'Validation failed: ' + validation.errors.join('; '),
        data: { validation_errors: validation.errors }
      };
    }

    // Log final payload for debugging server-side validation issues
    console.info('Sending multi-doctor schedule payload:', payload);

    try {
      const response = await api.post(`/rooms/${roomId}/schedules/multi-doctor`, payload);
      return response.data;
    } catch (err) {
      console.error('createScheduleWithMultipleDoctors error:', err);
      // Log server response details if present for debugging
      if (err.response) {
        console.error('Server status:', err.response.status);
        console.error('Server data:', err.response.data);
        console.error('Server headers:', err.response.headers);
      }
      // Prefer server-provided structured message when available
      const serverData = err.response?.data;
      const serverMessage = serverData?.message || serverData || err.message;
      return {
        success: false,
        status: err.response?.status || 500,
        message: serverMessage,
        data: serverData
      };
    }
  },

  // إنشاء جدول مؤقت - some components call this with a full payload (including room_id)
  createTemporarySchedule: async (payloadData) => {
    // The UI sometimes calls this function with a payload containing room_id.
    // We'll accept either (roomId, payload) or single payload object with room_id inside.
    const p = sanitizeSchedulePayload(payloadData || {});
    const normalized = normalizeLectureTypeForBackend(p);

    // Try a few sensible endpoints: first /rooms/{roomId}/schedules/temporary if room_id provided,
    // else fallback to /rooms/schedules/temporary or /schedules/temporary.
    try {
      if (normalized.room_id) {
        const response = await api.post(`/rooms/${normalized.room_id}/schedules/temporary`, normalized);
        return response.data;
      }
      // Try generic endpoint
      try {
        const response = await api.post(`/rooms/schedules/temporary`, normalized);
        return response.data;
      } catch (innerErr) {
        // fallback to /schedules/temporary
        const resp2 = await api.post(`/schedules/temporary`, normalized);
        return resp2.data;
      }
    } catch (err) {
      console.error('createTemporarySchedule error:', err);
      return {
        success: false,
        status: err.response?.status || 500,
        message: err.response?.data?.message || err.response?.data || err.message,
        data: err.response?.data
      };
    }
  },

  // تحديث جدول
  updateSchedule: async (roomId, scheduleId, scheduleData) => {
    const cleaned = sanitizeSchedulePayload(scheduleData);
    const payload = normalizeLectureTypeForBackend({ ...cleaned });
    // Ensure doctor_id is an integer if it's not null/undefined
    if (payload.doctor_id) {
      payload.doctor_id = parseInt(payload.doctor_id, 10);
    }
    try {
      const response = await api.put(`/rooms/${roomId}/schedules/${scheduleId}`, payload);
      return response.data;
    } catch (err) {
      console.error('updateSchedule error:', err);
      return {
        success: false,
        status: err.response?.status || 500,
        message: err.response?.data?.message || err.response?.data || err.message,
        data: err.response?.data
      };
    }
  },

  // تحديث جدول مع دعم عدة دكاترة
  updateScheduleWithMultipleDoctors: async (roomId, scheduleId, scheduleData) => {
    const payload = normalizeLectureTypeForBackend({ ...scheduleData });
    // Ensure use_multiple_doctors flag is set
    payload.use_multiple_doctors = true;
    try {
      const response = await api.put(`/rooms/${roomId}/schedules/${scheduleId}`, payload);
      return response.data;
    } catch (err) {
      console.error('updateScheduleWithMultipleDoctors error:', err);
      return {
        success: false,
        status: err.response?.status || 500,
        message: err.response?.data?.message || err.response?.data || err.message,
        data: err.response?.data
      };
    }
  },

  // حذف جدول
  deleteSchedule: async (roomId, scheduleId) => {
    const response = await api.delete(`/rooms/${roomId}/schedules/${scheduleId}`);
    return response.data;
  },

  // تحميل QR code للقاعة
  downloadQR: async (roomCode) => {
    const response = await api.get(`/public/room/${roomCode}/qr`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // الحصول على QR code للقاعة
  getRoomQR: async (roomId) => {
    const response = await api.get(`/rooms/${roomId}/qr`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // إعادة إنشاء QR code للقاعة
  regenerateQR: async (roomId) => {
    const response = await api.post(`/rooms/${roomId}/regenerate-qr`);
    return response.data;
  },

  // تأجيل محاضرة إلى تاريخ ووقت وقاعة جديدة
  postponeSchedule: async (roomId, scheduleId, postponementData) => {
    const payload = normalizeLectureTypeForBackend({ ...postponementData });
    const response = await api.put(`/rooms/${roomId}/schedules/${scheduleId}/postpone`, payload);
    return response.data;
  },

  // تحميل جدول أسبوعي من ملف Excel
  uploadWeeklySchedule: async (roomId, formData) => {
    const response = await api.post(`/rooms/${roomId}/schedules/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  },

  // حذف جميع جداول قاعة معينة
  deleteAllSchedulesByRoomId: async (roomId) => {
    const response = await api.delete(`/rooms/${roomId}/schedules/all`);
    return response.data;
  },

  // تحميل جدول أسبوعي عام من ملف Excel لجميع القاعات
  uploadGeneralWeeklySchedule: async (formData) => {
    const response = await api.post(`/rooms/schedules/upload-general`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  }
};

export { api }; // Export as named export