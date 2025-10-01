import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://hsabadi.pythonanywhere.com';

// إنشاء instance من axios مع الإعدادات الأساسية
const api = axios.create({
  baseURL: `${API_URL}/api/auth`,
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodWlzdmF6bmFydXhveHZ2cGp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MDYzOTAsImV4cCI6MjA3MTA4MjM5MH0.p0WPY2XxTqWsIt8xSsF4nep39P-Gb5fQBOmT-rP8TCY'
  },
});

// إضافة interceptor لإضافة token تلقائياً
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// interceptor للتعامل مع انتهاء صلاحية token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  // تسجيل الدخول
  login: async (credentials) => {
    const response = await api.post('/login', credentials);
    return response.data;
  },

  // الحصول على معلومات المستخدم
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  // تغيير كلمة المرور
  changePassword: async (passwordData) => {
    const response = await api.post('/change-password', passwordData);
    return response.data;
  }
};

export default api;