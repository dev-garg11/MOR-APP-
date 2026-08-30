import { get, post, put, del } from '../apiClient';

export const courseEndpoints = {
  // Public Catalog Endpoints (No Auth Required)
  getPublicCourses: (query = {}) => get('/courses/public', { query }),
  getPublicCourseDetail: (idOrSlug) => get(`/courses/public/${idOrSlug}`),

  // Admin Course Management Endpoints (Super Admin / Admin Auth Required)
  listAdminCourses: (query = {}) => get('/courses/', { auth: 'admin', query }),
  getAdminCourseDetail: (courseId) => get(`/courses/${courseId}`, { auth: 'admin' }),
  createCourse: (data) => post('/courses/', data, { auth: 'admin' }),
  updateCourse: (courseId, data) => put(`/courses/${courseId}`, data, { auth: 'admin' }),
  updateCourseStatus: (courseId, status) => put(`/courses/${courseId}/status`, { status }, { auth: 'admin' }),
  deleteCourse: (courseId) => del(`/courses/${courseId}`, { auth: 'admin' }),

  // Module Hierarchy Endpoints
  createCourseModule: (courseId, data) => post(`/courses/${courseId}/modules`, data, { auth: 'admin' }),
  updateCourseModule: (moduleId, data) => put(`/courses/modules/${moduleId}`, data, { auth: 'admin' }),
  deleteCourseModule: (moduleId) => del(`/courses/modules/${moduleId}`, { auth: 'admin' }),

  // Lesson Hierarchy Endpoints
  createCourseLesson: (moduleId, data) => post(`/courses/modules/${moduleId}/lessons`, data, { auth: 'admin' }),
  updateCourseLesson: (lessonId, data) => put(`/courses/lessons/${lessonId}`, data, { auth: 'admin' }),
  deleteCourseLesson: (lessonId) => del(`/courses/lessons/${lessonId}`, { auth: 'admin' }),
};
