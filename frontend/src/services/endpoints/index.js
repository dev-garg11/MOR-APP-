export { getAcademyCatalog, academyCatalog } from './academyEndpoints';

export { loginAdmin, signupAdmin, logoutAdmin, getStoredAdmin } from './authEndpoints';

export {
  createStudent,
  listStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  createStudentCredentials,
} from './studentEndpoints';

export {
  markAttendance,
  listAttendance,
  getStudentAttendance,
  updateAttendance,
  deleteAttendance,
} from './attendanceEndpoints';

export {
  updateFeePlan,
  createFeePayment,
  updateFeePayment,
  deleteFeePayment,
  getStudentFeeSummary,
  listPendingFees,
  generateEmiSchedule,
  getStudentEmiSchedule,
  getMyEmiSchedule,
} from './feeEndpoints';


export {
  createLead,
  listLeads,
  getLead,
  getLeadStats,
  getTodayFollowups,
  updateLead,
  updateLeadStatus,
  addLeadNote,
  deleteLead,
} from './leadEndpoints';

// Backward-compatible aliases (old code used "applications" naming for leads)
export { createLead as submitApplication, listLeads as fetchApplications } from './leadEndpoints';

export {
  listStaff,
  listPendingStaff,
  approveStaff,
  rejectStaff,
  deactivateStaff,
  reactivateStaff,
  deleteStaff,
  getStaffActivity,
  listTeachers,
  onboardTeacher,
  updateTeacherStatus,
} from './staffEndpoints';

export { getAuditTrail } from './auditEndpoints';

export { getDashboardOverview } from './dashboardEndpoints';

export {
  courseEndpoints,
} from './courseEndpoints';

export {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from './paymentEndpoints';


export {
  loginStudent,
  logoutStudent,
  getMyProfile,
  getMyFees,
  getMyAttendance,
  getMyAssignments,
  submitMyAssignment,
  getMyCurriculum,
} from './studentPortalEndpoints';

export { sendChatMessage } from './chatEndpoints';
export { teacherEndpoints } from './teacherEndpoints';
