/* =============================================
   Mathzone CRM — API Service (Production v12 - Fixed)
   ============================================= */

const API_BASE = 'http://localhost:3000/api';

const getToken = () => {
  if (window.Auth) return Auth.getAccessToken();
  return localStorage.getItem('accessToken');
};

const clearAuthAndRedirect = () => {
  if (window.Auth) Auth.clearAuth();
  else {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('crm_session');
    localStorage.removeItem('profile');
  }
  window.location.href = 'login.html';
};

let isRefreshing = false;
let refreshPromise = null;

const refreshAccessToken = async () => {
  if (window.Auth) return Auth.refreshAccessToken();
  
  // Prevent multiple simultaneous refresh attempts
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      isRefreshing = false;
      return false;
    }
    
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!refreshRes.ok) {
        isRefreshing = false;
        return false;
      }
      
      const refreshData = await refreshRes.json();
      if (refreshData.accessToken) {
        localStorage.setItem('accessToken', refreshData.accessToken);
        isRefreshing = false;
        return true;
      }
    } catch (e) {
      console.error('Token refresh failed:', e);
    }
    
    isRefreshing = false;
    return false;
  })();

  return refreshPromise;
};

const apiFetch = async (url, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${url}`, { ...options, headers });

    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry with new token
        const newToken = getToken();
        return fetch(`${API_BASE}${url}`, {
          ...options,
          headers: {
            ...headers,
            Authorization: `Bearer ${newToken}`
          }
        }).then(r => r.ok ? r.json() : Promise.reject(new Error(`API Error: ${r.status}`)));
      }
      clearAuthAndRedirect();
      throw new Error('Authentication failed');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
};

// ============== AUTH ==============
export const login = async (credentials) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login xatosi');
  
  if (window.Auth) {
    Auth.saveAuth(data);
  } else {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('crm_session', JSON.stringify({
      id: data.user.id,
      name: data.user.name,
      role: data.user.role,
      avatar: data.user.avatar,
      loginTime: Date.now()
    }));
  }
  return data;
};

// ============== STUDENTS ==============
export const getStudents = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/students${query ? '?' + query : ''}`);
};

export const getStudent = (id) => apiFetch(`/students/${id}`);

export const createStudent = (data) => 
  apiFetch('/students', { method: 'POST', body: JSON.stringify(data) });

export const updateStudent = (id, data) => 
  apiFetch(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteStudent = (id) => 
  apiFetch(`/students/${id}`, { method: 'DELETE' });

// ============== GROUPS ==============
export const getGroups = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/groups${query ? '?' + query : ''}`);
};

export const getGroup = (id) => apiFetch(`/groups/${id}`);

export const createGroup = (data) => 
  apiFetch('/groups', { method: 'POST', body: JSON.stringify(data) });

export const updateGroup = (id, data) => 
  apiFetch(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteGroup = (id) => 
  apiFetch(`/groups/${id}`, { method: 'DELETE' });

// ============== TEACHERS ==============
export const getTeachers = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/teachers${query ? '?' + query : ''}`);
};

export const getTeacher = (id) => apiFetch(`/teachers/${id}`);

export const createTeacher = (data) => 
  apiFetch('/teachers', { method: 'POST', body: JSON.stringify(data) });

export const updateTeacher = (id, data) => 
  apiFetch(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteTeacher = (id) => 
  apiFetch(`/teachers/${id}`, { method: 'DELETE' });

// ============== PAYMENTS ==============
export const getPayments = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/payments${query ? '?' + query : ''}`);
};

export const getPayment = (id) => apiFetch(`/payments/${id}`);

export const createPayment = (data) => 
  apiFetch('/payments', { method: 'POST', body: JSON.stringify(data) });

export const deletePayment = (id) => 
  apiFetch(`/payments/${id}`, { method: 'DELETE' });

// ============== ATTENDANCE ==============
export const getAttendances = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/attendance${query ? '?' + query : ''}`);
};

export const createAttendance = (data) => 
  apiFetch('/attendance', { method: 'POST', body: JSON.stringify(data) });

export const updateAttendance = (id, data) => 
  apiFetch(`/attendance/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteAttendance = (id) => 
  apiFetch(`/attendance/${id}`, { method: 'DELETE' });

// Export to global for backward compatibility
window.API = {
  // Auth
  login,
  
  // Students
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  
  // Groups
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  
  // Teachers
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  
  // Payments
  getPayments,
  getPayment,
  createPayment,
  deletePayment,
  
  // Attendance
  getAttendances,
  createAttendance,
  updateAttendance,
  deleteAttendance,
};
