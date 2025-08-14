import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // If Authorization is already set by the caller (e.g., refresh using refresh token), don't override it
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

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const status = error.response?.status;
    // If the failing request is the refresh endpoint itself, bail out
    if (originalRequest?.url?.includes('/auth/refresh')) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    // Treat 401 and 422 from JWT as auth issues
    if ((status === 401 || status === 422) && !originalRequest._retry) {
      originalRequest._retry = true;

  try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          // Use same baseURL as api instance to avoid relative URL issues in dev
          const response = await api.post('/auth/refresh', {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
          });
          
          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.debug('Token refresh failed', refreshError?.message || refreshError);
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/google', credentials),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

// Employees API
export const employeesAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  addSkill: (id, skillData) => api.post(`/employees/${id}/skills`, skillData),
  removeSkill: (employeeId, skillId) => api.delete(`/employees/${employeeId}/skills/${skillId}`),
  // Licenses
  getEmployeeLicenses: (employeeId) => api.get(`/employees/${employeeId}/licenses`),
  addLicense: (employeeId, payload) => api.post(`/employees/${employeeId}/licenses`, payload),
  updateLicense: (employeeId, licenseId, payload) => api.put(`/employees/${employeeId}/licenses/${licenseId}`, payload),
  removeLicense: (employeeId, licenseId) => api.delete(`/employees/${employeeId}/licenses/${licenseId}`),
};

// Roles API
export const rolesAPI = {
  getAll: () => api.get('/roles'),
  create: (data) => api.post('/roles', data),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
};

// Areas API
export const areasAPI = {
  getAll: () => api.get('/areas'),
  create: (data) => api.post('/areas', data),
  update: (id, data) => api.put(`/areas/${id}`, data),
  delete: (id) => api.delete(`/areas/${id}`),
};

// Skills API
export const skillsAPI = {
  getAll: () => api.get('/skills'),
  create: (data) => api.post('/skills', data),
  update: (id, data) => api.put(`/skills/${id}`, data),
  delete: (id) => api.delete(`/skills/${id}`),
};

// Licenses API
export const licensesAPI = {
  getAll: () => api.get('/licenses'),
  create: (data) => api.post('/licenses', data),
  update: (id, data) => api.put(`/licenses/${id}`, data),
  delete: (id) => api.delete(`/licenses/${id}`),
};

// Leave API
export const leaveAPI = {
  getAll: (params) => api.get('/leave', { params }),
  create: (data) => api.post('/leave', data),
  action: (id, data) => api.post(`/leave/${id}/action`, data),
  delete: (id) => api.delete(`/leave/${id}`),
};

// Reports API
export const reportsAPI = {
  employeeSearch: (params) => api.get('/reports/employee-search', { params }),
  getEmployeeHistory: (employeeId) => api.get(`/reports/employee-history/${employeeId}`),
};

// Designations API
export const designationsAPI = {
  getAll: () => api.get('/designations'),
};

// Community API
export const communityAPI = {
  getPosts: () => api.get('/community/posts'),
  getPost: (id) => api.get(`/community/posts/${id}`),
  createPost: (data) => api.post('/community/posts', data),
  addReply: (postId, data) => api.post(`/community/posts/${postId}/reply`, data),
  deletePost: (id) => api.delete(`/community/posts/${id}`),
};

// Shifts API
export const shiftsAPI = {
  getAll: () => api.get('/shifts'),
  create: (data) => api.post('/shifts', data),
  update: (id, data) => api.put(`/shifts/${id}`, data),
  delete: (id) => api.delete(`/shifts/${id}`),
  accept: (id) => api.post(`/shifts/${id}/accept`),
};

// Roster API
export const rosterAPI = {
  getAll: (params) => api.get('/roster', { params }),
  create: (data) => api.post('/roster', data),
  update: (id, data) => api.put(`/roster/${id}`, data),
  delete: (id) => api.delete(`/roster/${id}`),
  approve: (id, data) => api.post(`/roster/${id}/approve`, data),
  createBulk: (data) => api.post('/roster/bulk', data),
  accept: (id) => api.post(`/roster/${id}/accept`),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getEmployeesByShift: (params) => api.get('/analytics/employees-by-shift', { params }),
  getEmployeesByRole: () => api.get('/analytics/employees-by-role'),
  getEmployeesByArea: () => api.get('/analytics/employees-by-area'),
  getLeaveSummary: (params) => api.get('/analytics/leave-summary', { params }),
  skillSearch: (params) => api.get('/analytics/skill-search', { params }),
  getShiftCoverage: (params) => api.get('/analytics/shift-coverage', { params }),
  getWeeklyApprovalTrends: () => api.get('/analytics/weekly-approval-trends'),
};

// Timesheets API
export const timesheetsAPI = {
  generate: (payload) => api.post('/timesheets/generate', payload),
  getAll: () => api.get('/timesheets'),
  approve: (id) => api.post(`/timesheets/${id}/approve`),
  reject: (id) => api.post(`/timesheets/${id}/reject`),
  accept: (id) => api.post(`/timesheets/${id}/accept`),
};

export default api;

