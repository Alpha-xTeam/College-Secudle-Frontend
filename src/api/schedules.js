import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://hsabadi.pythonanywhere.com';

const api = axios.create({
  baseURL: `${API_URL}/api/public`,
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodWlzdmF6bmFydXhveHZ2cGp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MDYzOTAsImV4cCI6MjA3MTA4MjM5MH0.p0WPY2XxTqWsIt8xMzQ3OTB9.p0WPY2XxTqWsIt8xSsF4nep39P-Gb5fQBOmT-rP8TCY'
  },
});

const deanApi = axios.create({
  baseURL: `${API_URL}/api/dean`,
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3NpIjoiN3N1cGFyYmFzZSIsInJlZiI6ImZodWlzdmF6bmFydXhveHZ2cGp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MDYzOTAsImV4cCI6MjA3MTA4MjM5MH0.p0WPY2XxTqWsIt8xMzQ3OTB9.p0WPY2XxTqWsIt8xSsF4nep39P-Gb5fQBOmT-rP8TCY'
  },
});

export const schedulesAPI = {
  // الحصول على معلومات القاعة (عام)
  getRoomInfo: async (roomCode) => {
    const response = await api.get(`/room/${roomCode}`);
    return response.data;
  },

  // الحصول على جدول القاعة (عام)
  getRoomSchedule: async (roomCode, studyType) => {
    try {
      const response = await api.get(`/room/${roomCode}/schedule?study_type=${studyType}`, { timeout: 15000 });
      return response.data;
    } catch (err) {
      if (err && (err.code === 'ECONNABORTED' || (err.message && err.message.toLowerCase().includes('aborted') || err.message && err.message.toLowerCase().includes('timeout')))) {
        console.warn('schedulesAPI.getRoomSchedule: request timed out/aborted, retrying with longer timeout');
        const response = await api.get(`/room/${roomCode}/schedule?study_type=${studyType}`, { timeout: 30000 });
        return response.data;
      }
      throw err;
    }
  },

  // الحصول على معلومات القاعة (من rooms routes)
  getRoomInfoById: async (roomId) => {
    const response = await api.get(`/rooms/${roomId}`);
    return response.data;
  },

  // الحصول على معلومات القاعة (من department routes)
  getDepartmentRoomInfo: async (roomId) => {
    const response = await api.get(`/department/rooms/${roomId}`);
    return response.data;
  },

  // البحث في القاعات
  searchRooms: async (query, departmentId = null) => {
    let url = `/search/rooms?q=${encodeURIComponent(query)}`;
    if (departmentId) {
      url += `&department_id=${departmentId}`;
    }
    try {
      const response = await api.get(url, { timeout: 10000 });
      return response.data;
    } catch (err) {
      if (err && (err.code === 'ECONNABORTED' || (err.message && err.message.toLowerCase().includes('aborted') || err.message && err.message.toLowerCase().includes('timeout')))) {
        console.warn('schedulesAPI.searchRooms: request timed out/aborted, retrying with longer timeout');
        const response = await api.get(url, { timeout: 20000 });
        return response.data;
      }
      throw err;
    }
  },

  // الحصول على الأقسام
  getDepartments: async () => {
    try {
      const response = await api.get('/departments', { timeout: 10000 });
      return response.data;
    } catch (err) {
      // If request was aborted/timed out, retry once with longer timeout
      if (err && (err.code === 'ECONNABORTED' || (err.message && err.message.toLowerCase().includes('aborted') || err.message && err.message.toLowerCase().includes('timeout')))) {
        console.warn('schedulesAPI.getDepartments: initial request timed out/aborted, retrying with longer timeout');
        const response = await api.get('/departments', { timeout: 20000 });
        return response.data;
      }
      throw err;
    }
  },

  // الحصول على إعلانات القسم الخاص بقاعة عامة
  getRoomAnnouncements: async (roomCode) => {
    const response = await api.get(`/room/${roomCode}/announcements`);
    return response.data;
  },

  // Get schedule by ID for Dean
  getDeanScheduleById: async (scheduleId) => {
    const response = await deanApi.get(`/schedules/${scheduleId}`);
    return response.data;
  },

  // الحصول على الجدول الأسبوعي الكامل لمرحلة معينة
  getWeeklyScheduleByStage: async (departmentId, stage, studyType) => {
    const response = await api.get(`/department/${departmentId}/weekly-schedule/${stage}/${studyType}`);
    return response.data;
  }
};

export default api;