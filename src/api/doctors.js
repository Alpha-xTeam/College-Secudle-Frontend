import { api } from './rooms'; // Import from rooms.js
import { getAuthHeaders } from '../utils/auth';

export const doctorsAPI = {
  getAllDoctors: async () => {
    try {
      const headers = getAuthHeaders();
      console.debug('doctorsAPI.getAllDoctors: Authorization present =', !!(headers && (headers.Authorization || headers.authorization)));
      const config = { headers, timeout: 10000 };
      const response = await api.get('/doctors/', { headers }); // Corrected path with trailing slash
      return response.data;
    } catch (error) {
      // If timeout, try once more with longer timeout
      if (error.code === 'ECONNABORTED') {
        console.warn('doctorsAPI.getAllDoctors: initial request timed out, retrying with longer timeout');
        try {
          const headers = getAuthHeaders();
          const response = await api.get('/doctors/', { headers, timeout: 20000 });
          return response.data;
        } catch (err) {
          console.error('doctorsAPI.getAllDoctors: retry failed', err);
          throw err.response ? err.response.data : { message: err.message || 'Request aborted', code: err.code };
        }
      }
      throw error.response ? error.response.data : { message: error.message || 'Unknown error' };
    }
  },
  addDoctor: async (doctorData) => {
    try {
      const response = await api.post('/doctors/add', doctorData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },
  getDoctorLectures: async (doctorId, options = {}) => {
    // declare query in function scope so catch/retry blocks can access it
    let query = '';
    try {
      const params = [];
      if (options.includeAssistants) params.push('include_assistants=true');
      query = params.length > 0 ? `?${params.join('&')}` : '';
      const headers = getAuthHeaders();
      console.debug(`doctorsAPI.getDoctorLectures: url=/doctors/${doctorId}/lectures${query}`, { hasAuth: !!(headers && (headers.Authorization || headers.authorization)) });
      const config = { headers, timeout: 10000 };
      const response = await api.get(`/doctors/${doctorId}/lectures${query}`, config);
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.warn('doctorsAPI.getDoctorLectures: request timed out, retrying once');
        try {
          const headers = getAuthHeaders();
          const response = await api.get(`/doctors/${doctorId}/lectures${query}`, { headers, timeout: 20000 });
          return response.data;
        } catch (err) {
          console.error('doctorsAPI.getDoctorLectures: retry failed', err);
          throw err.response ? err.response.data : { message: err.message || 'Request aborted', code: err.code };
        }
      }
      throw error.response ? error.response.data : { message: error.message || 'Unknown error' };
    }
  },
  getDepartments: async () => {
    try {
      const headers = getAuthHeaders();
      const token = headers && headers.Authorization;
      console.debug('doctorsAPI.getDepartments: Authorization present =', !!token);
      console.debug('doctorsAPI.getDepartments: Token preview =', token ? token.substring(0, 20) + '...' : 'none');
      
      const config = { headers, timeout: 10000 };
      const response = await api.get('/doctors/departments', config);
      console.debug('doctorsAPI.getDepartments: Success response received');
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.warn('doctorsAPI.getDepartments: request timed out, retrying once with longer timeout');
        try {
          const headers = getAuthHeaders();
          const response = await api.get('/doctors/departments', { headers, timeout: 20000 });
          return response.data;
        } catch (err) {
          console.error('doctorsAPI.getDepartments: retry failed', err);
          throw err.response ? err.response.data : { message: err.message || 'Request aborted', code: err.code };
        }
      }
      // Enhanced error logging
      if (error.response) {
        console.error('doctorsAPI.getDepartments: server responded:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
        // Check if it's a 403 Forbidden error
        if (error.response.status === 403) {
          console.error('doctorsAPI.getDepartments: Access forbidden - check user role and authentication');
          // Check current user info
          const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
          const token = localStorage.getItem('authToken');
          console.error('Current user:', currentUser);
          console.error('Token exists:', !!token);
        }
        throw error.response.data;
      }
      throw { message: error.message || 'Unknown error' };
    }
  },
  deleteDoctor: async (doctorId) => {
    try {
      const response = await api.delete(`/doctors/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },
  updateDoctor: async (doctorId, doctorData) => {
    try {
      const response = await api.put(`/doctors/${doctorId}`, doctorData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },
  
  // التحقق من توفر المدرس في وقت معين
  checkDoctorAvailability: async (doctorId, scheduleData) => {
    try {
      const headers = getAuthHeaders();
      console.debug('doctorsAPI.checkDoctorAvailability: checking availability for doctor', doctorId);
      const response = await api.post(`/doctors/${doctorId}/check-availability`, scheduleData, { headers });
      return response.data;
    } catch (error) {
      console.error('doctorsAPI.checkDoctorAvailability: error checking availability', error);
      throw error.response ? error.response.data : { message: error.message || 'Unknown error' };
    }
  },
  
  // التحقق من توفر عدة مدرسين في وقت معين
  checkMultipleDoctorsAvailability: async (doctorIds, scheduleData) => {
    try {
      const headers = getAuthHeaders();
      console.debug('doctorsAPI.checkMultipleDoctorsAvailability: checking availability for doctors', doctorIds);
      const response = await api.post('/doctors/check-multiple-availability', {
        doctor_ids: doctorIds,
        ...scheduleData
      }, { headers });
      return response.data;
    } catch (error) {
      console.error('doctorsAPI.checkMultipleDoctorsAvailability: error checking availability', error);
      throw error.response ? error.response.data : { message: error.message || 'Unknown error' };
    }
  },
};
