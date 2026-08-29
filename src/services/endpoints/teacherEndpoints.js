import { get, post, put } from '../apiClient';

/**
 * Teacher Module API Endpoints
 * All endpoints authenticate via staff JWT token (auth: 'admin')
 * Backend routes located at routes/teacher_routes.py (/teacher/*)
 */
export const teacherEndpoints = {
  // 1. Dashboard
  getDashboard: () => get('/teacher/dashboard', { auth: 'admin' }),

  // 2. My Courses (Assigned Only)
  getCourses: () => get('/teacher/courses', { auth: 'admin' }),
  getCourseDetail: (courseId) => get(`/teacher/courses/${courseId}`, { auth: 'admin' }),

  // 3. My Batches (Assigned Only)
  getBatches: () => get('/teacher/batches', { auth: 'admin' }),
  getBatchDetail: (batchId) => get(`/teacher/batches/${batchId}`, { auth: 'admin' }),
  getBatchStudents: (batchId) => get(`/teacher/batches/${batchId}/students`, { auth: 'admin' }),

  // 4. Students (Authorized Only)
  getStudents: (query = {}) => get('/teacher/students', { auth: 'admin', query }),
  getStudentDetail: (studentId) => get(`/teacher/students/${studentId}`, { auth: 'admin' }),

  // 5. Timetable / Classes
  getTimetable: () => get('/teacher/timetable', { auth: 'admin' }),

  // 6. Teacher Profile & Edit
  getProfile: () => get('/teacher/profile', { auth: 'admin' }),
  updateProfile: (data) => put('/teacher/profile', data, { auth: 'admin' }),

  // 7. Attendance Entry Point
  getBatchAttendanceToday: (batchId, targetDate = null) =>
    get(`/teacher/batches/${batchId}/attendance/today`, {
      auth: 'admin',
      query: targetDate ? { target_date: targetDate } : {},
    }),
  markBatchAttendance: (batchId, records, date = null) =>
    post(`/teacher/batches/${batchId}/attendance`, { records, date }, { auth: 'admin' }),

  // 8. Assignments Management (Creation, Submissions Roster, Evaluation)
  getAssignments: () => get('/teacher/assignments', { auth: 'admin' }),
  createAssignment: (data) => post('/teacher/assignments', data, { auth: 'admin' }),
  getAssignmentSubmissions: (assignmentId) =>
    get(`/teacher/assignments/${assignmentId}/submissions`, { auth: 'admin' }),
  evaluateSubmission: (assignmentId, data) =>
    post(`/teacher/assignments/${assignmentId}/evaluate`, data, { auth: 'admin' }),

  // 9. Performance & Metrics
  getPerformance: () => get('/teacher/performance', { auth: 'admin' }),

  // 10. Batch Curriculum & Topic Progress Tracker
  getBatchCurriculum: (batchId) => get(`/teacher/batches/${batchId}/curriculum`, { auth: 'admin' }),
  toggleBatchLesson: (batchId, lessonId) =>
    post(`/teacher/batches/${batchId}/lessons/${lessonId}/toggle`, {}, { auth: 'admin' }),
};

