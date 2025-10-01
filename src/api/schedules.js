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
    const response = await api.get(`/room/${roomCode}/schedule?study_type=${studyType}`);
    return response.data;
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
    const response = await api.get(url);
    return response.data;
  },

  // الحصول على الأقسام
  getDepartments: async () => {
    const response = await api.get('/departments');
    return response.data;
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