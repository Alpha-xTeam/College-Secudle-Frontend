import { api } from './rooms'; // Import from rooms.js

export const doctorsAPI = {
  getAllDoctors: async () => {
    try {
      const response = await api.get('/doctors/'); // Corrected path with trailing slash
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
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
    try {
      const params = [];
      if (options.includeAssistants) params.push('include_assistants=true');
      const query = params.length > 0 ? `?${params.join('&')}` : '';
      const response = await api.get(`/doctors/${doctorId}/lectures${query}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },
  getDepartments: async () => {
    try {
      const response = await api.get('/doctors/departments'); // Corrected path
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
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
};
