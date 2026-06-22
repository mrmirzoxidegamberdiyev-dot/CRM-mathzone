/* =============================================
   Mathzone CRM — Data Service with API Integration (v2)
   ============================================= */

// Cache layer for offline support
const CacheService = {
  get(key, defaultValue = []) {
    try {
      const val = localStorage.getItem(`cache_${key}`);
      return val ? JSON.parse(val) : defaultValue;
    } catch (e) {
      console.error(`Cache get error for ${key}:`, e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error(`Cache set error for ${key}:`, e);
    }
  },

  clear(key) {
    localStorage.removeItem(`cache_${key}`);
  }
};

// Unified Data Service with API integration
const DataService = {
  // ========== STUDENTS ==========
  async getStudents(params = {}) {
    try {
      const students = await window.API.getStudents(params);
      CacheService.set('students', students);
      return students;
    } catch (error) {
      console.error('Failed to fetch students:', error);
      // Return cached data if available
      return CacheService.get('students', []);
    }
  },

  async getStudent(id) {
    try {
      return await window.API.getStudent(id);
    } catch (error) {
      console.error('Failed to fetch student:', error);
      throw error;
    }
  },

  async createStudent(data) {
    try {
      const student = await window.API.createStudent(data);
      // Update cache
      const cached = CacheService.get('students', []);
      cached.push(student);
      CacheService.set('students', cached);
      return student;
    } catch (error) {
      console.error('Failed to create student:', error);
      throw error;
    }
  },

  async updateStudent(id, data) {
    try {
      const student = await window.API.updateStudent(id, data);
      // Update cache
      const cached = CacheService.get('students', []);
      const index = cached.findIndex(s => s.id === id);
      if (index !== -1) {
        cached[index] = student;
        CacheService.set('students', cached);
      }
      return student;
    } catch (error) {
      console.error('Failed to update student:', error);
      throw error;
    }
  },

  async deleteStudent(id) {
    try {
      await window.API.deleteStudent(id);
      // Update cache
      const cached = CacheService.get('students', []);
      CacheService.set('students', cached.filter(s => s.id !== id));
    } catch (error) {
      console.error('Failed to delete student:', error);
      throw error;
    }
  },

  // ========== GROUPS ==========
  async getGroups(params = {}) {
    try {
      const groups = await window.API.getGroups(params);
      CacheService.set('groups', groups);
      return groups;
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      return CacheService.get('groups', []);
    }
  },

  async createGroup(data) {
    try {
      return await window.API.createGroup(data);
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error;
    }
  },

  async updateGroup(id, data) {
    try {
      return await window.API.updateGroup(id, data);
    } catch (error) {
      console.error('Failed to update group:', error);
      throw error;
    }
  },

  async deleteGroup(id) {
    try {
      await window.API.deleteGroup(id);
    } catch (error) {
      console.error('Failed to delete group:', error);
      throw error;
    }
  },

  // ========== TEACHERS ==========
  async getTeachers(params = {}) {
    try {
      const teachers = await window.API.getTeachers(params);
      CacheService.set('teachers', teachers);
      return teachers;
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      return CacheService.get('teachers', []);
    }
  },

  async createTeacher(data) {
    try {
      return await window.API.createTeacher(data);
    } catch (error) {
      console.error('Failed to create teacher:', error);
      throw error;
    }
  },

  async updateTeacher(id, data) {
    try {
      return await window.API.updateTeacher(id, data);
    } catch (error) {
      console.error('Failed to update teacher:', error);
      throw error;
    }
  },

  async deleteTeacher(id) {
    try {
      await window.API.deleteTeacher(id);
    } catch (error) {
      console.error('Failed to delete teacher:', error);
      throw error;
    }
  },

  // ========== PAYMENTS ==========
  async getPayments(params = {}) {
    try {
      const payments = await window.API.getPayments(params);
      CacheService.set('payments', payments);
      return payments;
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      return CacheService.get('payments', []);
    }
  },

  async createPayment(data) {
    try {
      return await window.API.createPayment(data);
    } catch (error) {
      console.error('Failed to create payment:', error);
      throw error;
    }
  },

  async deletePayment(id) {
    try {
      await window.API.deletePayment(id);
    } catch (error) {
      console.error('Failed to delete payment:', error);
      throw error;
    }
  },

  // ========== ATTENDANCE ==========
  async getAttendances(params = {}) {
    try {
      return await window.API.getAttendances(params);
    } catch (error) {
      console.error('Failed to fetch attendances:', error);
      return [];
    }
  },

  async createAttendance(data) {
    try {
      return await window.API.createAttendance(data);
    } catch (error) {
      console.error('Failed to create attendance:', error);
      throw error;
    }
  },

  async updateAttendance(id, data) {
    try {
      return await window.API.updateAttendance(id, data);
    } catch (error) {
      console.error('Failed to update attendance:', error);
      throw error;
    }
  },

  // ========== LEGACY LOCALSTORAGE SUPPORT ==========
  // For backward compatibility with existing code
  get(key, defaultValue = []) {
    console.warn(`Legacy localStorage access for ${key}. Consider using async API methods.`);
    return CacheService.get(key, defaultValue);
  },

  set(key, value) {
    console.warn(`Legacy localStorage write for ${key}. Consider using async API methods.`);
    CacheService.set(key, value);
  }
};

// Sanitizer for XSS protection
function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Phone validation for Uzbekistan
function isValidUzPhone(phone) {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  
  // Check length: must be 998XXXXXXXXX (12 digits) or 9XXXXXXXXX (9 digits)
  if (digits.length !== 12 && digits.length !== 9) return false;
  
  // Check operator codes for Uzbekistan
  const validPrefixes = ['998901', '998902', '998903', '998904', '998905', 
                         '998909', '998910', '998911', '998912', '998913',
                         '998914', '998915', '998916', '998917', '998918',
                         '998919', '998920', '998930', '998931', '998933',
                         '998940', '998950', '998970', '998971', '998972',
                         '998973', '998974', '998975', '998976', '998977',
                         '998978', '998979', '998980', '998981', '998982',
                         '998983', '998984', '998985', '998986', '998987',
                         '998988', '998989', '998990', '998991', '998993',
                         '998994', '998995', '998996', '998997', '998998',
                         '998999'];
  
  const normalized = digits.length === 12 ? digits : '998' + digits;
  const prefix = normalized.substring(0, 6);
  
  return validPrefixes.some(vp => prefix.startsWith(vp));
}

// Format phone for display
function formatPhoneDisplay(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12) {
    return `+${digits.substring(0, 3)} (${digits.substring(3, 5)}) ${digits.substring(5, 8)}-${digits.substring(8, 10)}-${digits.substring(10)}`;
  }
  return phone;
}

window.DataService = DataService;
window.CacheService = CacheService;
window.sanitizeHTML = sanitizeHTML;
window.isValidUzPhone = isValidUzPhone;
window.formatPhoneDisplay = formatPhoneDisplay;