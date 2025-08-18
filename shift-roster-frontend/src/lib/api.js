import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const hasAuthHeader = !!config.headers?.Authorization;
    if (!hasAuthHeader) {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const status = error.response?.status;
    if (originalRequest?.url?.includes('/auth/refresh')) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    if ((status === 401 || status === 422) && !originalRequest._retry) {
      originalRequest._retry = true;

  try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await api.post('/auth/refresh', {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
          });
          
          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.debug('Token refresh failed', refreshError?.message || refreshError);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/google', credentials),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

export const employeesAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  addSkill: (id, skillData) => api.post(`/employees/${id}/skills`, skillData),
  removeSkill: (employeeId, skillId) => api.delete(`/employees/${employeeId}/skills/${skillId}`),
  getEmployeeLicenses: (employeeId) => api.get(`/employees/${employeeId}/licenses`),
  addLicense: (employeeId, payload) => api.post(`/employees/${employeeId}/licenses`, payload),
  updateLicense: (employeeId, licenseId, payload) => api.put(`/employees/${employeeId}/licenses/${licenseId}`),
  removeLicense: (employeeId, licenseId) => api.delete(`/employees/${employeeId}/licenses/${licenseId}`),
};

export const rolesAPI = {
  getAll: () => api.get('/admin/roles/'),
  create: (data) => api.post('/admin/roles', data),
  update: (id, data) => api.put(`/admin/roles/${id}`),
  delete: (id) => api.delete(`/admin/roles/${id}`),
};

export const areasAPI = {
  getAll: () => api.get('/admin/areas/'),
  create: (data) => api.post('/admin/areas', data),
  update: (id, data) => api.put(`/admin/areas/${id}`),
  delete: (id) => api.delete(`/admin/areas/${id}`),
};

export const skillsAPI = {
  getAll: () => api.get('/admin/skills/'),
  create: (data) => api.post('/admin/skills', data),
  update: (id, data) => api.put(`/admin/skills/${id}`),
  delete: (id) => api.delete(`/admin/skills/${id}`),
};

export const licensesAPI = {
  getAll: () => api.get('/licenses/'),
  create: (data) => api.post('/licenses/', data),
  update: (id, data) => api.put(`/licenses/${id}`),
  delete: (id) => api.delete(`/licenses/${id}`),
};

export const leaveAPI = {
  getAll: (params) => api.get('/leave', { params }),
  create: (data) => api.post('/leave', data),
  action: (id, data) => api.post(`/leave/${id}/action`, data),
  delete: (id) => api.delete(`/leave/${id}`),
};

export const reportsAPI = {
  employeeSearch: (params) => api.get('/reports/employee-search', { params }),
  getEmployeeHistory: (employeeId) => api.get(`/reports/employee-history/${employeeId}`),
  shiftAcceptance: (params) => api.get('/reports/shift-acceptance', { params }),
};

export const designationsAPI = {
  getAll: () => api.get('/designations/'),
};

export const communityAPI = {
  getPosts: () => api.get('/community/posts'),
  getPost: (id) => api.get(`/community/posts/${id}`),
  createPost: (data) => api.post('/community/posts', data),
  addReply: (postId, data) => api.post(`/community/posts/${postId}/reply`, data),
  deletePost: (id) => api.delete(`/community/posts/${id}`),
};

export const shiftsAPI = {
  getAll: () => api.get('/admin/shifts/'),
  create: (data) => api.post('/admin/shifts', data),
  update: (id, data) => api.put(`/admin/shifts/${id}`),
  delete: (id) => api.delete(`/admin/shifts/${id}`),
  accept: (id) => api.post(`/shifts/${id}/accept`),
};

export const rosterAPI = {
  getAll: (params) => api.get('/roster', { params }),
  create: (data) => api.post('/roster', data),
  update: (id, data) => api.put(`/roster/${id}`, data),
  delete: (id) => api.delete(`/roster/${id}`),
  approve: (id, data) => api.post(`/roster/${id}/approve`, data),
  createBulk: (data) => api.post('/roster/bulk', data),
  accept: (id) => api.post(`/roster/${id}/accept`),
};

export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getEmployeesByShift: (params) => api.get('/analytics/employees-by-shift', { params }),
  getEmployeesByRole: () => api.get('/analytics/employees-by-role'),
  getEmployeesByArea: () => api.get('/analytics/employees-by-area'),
  getLeaveSummary: (params) => api.get('/analytics/leave-summary', { params }),
  skillSearch: (params) => api.get('/analytics/skill-search', { params }),
  getSkillDistribution: () => api.get('/analytics/skill-distribution'),
  getShiftCoverage: (params) => api.get('/analytics/shift-coverage', { params }),
  getWeeklyApprovalTrends: () => api.get('/analytics/weekly-approval-trends'),
};

export const timesheetsAPI = {
  generate: (payload) => api.post('/timesheets/generate', payload),
  getAll: (params) => api.get('/timesheets', { params }),
  approve: (id) => api.post(`/timesheets/${id}/approve`),
  reject: (id, data) => api.post(`/timesheets/${id}/reject`, data),
  accept: (id) => api.post(`/timesheets/${id}/accept`),
};

export default api;
