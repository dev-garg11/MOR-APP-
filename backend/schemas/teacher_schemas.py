from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class TeacherProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    status: str
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = "Senior Faculty / Trainer"
    last_active_at: Optional[datetime] = None
    assigned_courses_count: int = 0
    assigned_batches_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class TeacherProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None


class TeacherTodayClass(BaseModel):
    id: int
    batch_id: int
    batch_name: str
    course_id: int
    course_name: str
    timing: str
    days: str
    status: str
    students_count: int = 0
    attendance_marked: bool = False
    room: Optional[str] = "Lab 1 / Studio"


class TeacherRecentActivity(BaseModel):
    id: str
    type: str  # attendance, class, student, batch
    title: str
    subtitle: str
    timestamp: Optional[datetime] = None
    action: Optional[str] = None


class TeacherDashboardSummary(BaseModel):
    my_courses_count: int = 0
    my_batches_count: int = 0
    total_students_count: int = 0
    today_classes_count: int = 0
    pending_assignments_count: int = 0
    today_attendance_rate: str = "0%"
    today_attendance_marked_count: int = 0
    today_attendance_total_count: int = 0


class TeacherBatchSummary(BaseModel):
    id: int
    name: str
    course_id: int
    course_name: str
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    timing: Optional[str] = None
    days: Optional[str] = None
    students_count: int = 0


class TeacherDashboardResponse(BaseModel):
    teacher: TeacherProfileResponse
    summary: TeacherDashboardSummary
    today_classes: List[TeacherTodayClass]
    assigned_batches: List[TeacherBatchSummary]
    recent_activity: List[TeacherRecentActivity]


class TeacherCourseResponse(BaseModel):
    id: int
    slug: str
    name: str
    category: str
    level: str
    duration: str
    thumbnail: Optional[str] = None
    tag: Optional[str] = None
    short_desc: Optional[str] = None
    status: str
    modules_count: int = 0
    batches_count: int = 0
    students_count: int = 0


class TeacherCourseDetailResponse(BaseModel):
    id: int
    slug: str
    name: str
    category: str
    level: str
    duration: str
    thumbnail: Optional[str] = None
    tag: Optional[str] = None
    short_desc: Optional[str] = None
    full_desc: Optional[str] = None
    tools: List[str] = Field(default_factory=list)
    outcomes: List[str] = Field(default_factory=list)
    requirements: List[str] = Field(default_factory=list)
    career_roles: List[Dict[str, Any]] = Field(default_factory=list)
    status: str
    modules: List[Dict[str, Any]] = Field(default_factory=list)
    batches: List[TeacherBatchSummary] = Field(default_factory=list)


class TeacherBatchResponse(BaseModel):
    id: int
    name: str
    course_id: int
    course_name: str
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    timing: Optional[str] = None
    days: Optional[str] = None
    students_count: int = 0


class TeacherStudentAttendanceRecord(BaseModel):
    id: int
    date: date
    status: str  # present, absent, leave
    marked_by: Optional[str] = None


class TeacherStudentResponse(BaseModel):
    id: int
    login_id: Optional[str] = None
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    course: str
    batch: Optional[str] = None
    status: str
    attendance_percentage: str = "N/A"
    enrollment_date: Optional[date] = None


class TeacherStudentDetailResponse(BaseModel):
    id: int
    login_id: Optional[str] = None
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    course: str
    batch: Optional[str] = None
    status: str
    enrollment_date: Optional[date] = None
    attendance_percentage: str = "N/A"
    total_classes: int = 0
    attended_classes: int = 0
    attendance_records: List[TeacherStudentAttendanceRecord] = Field(default_factory=list)
    academic_progress: Dict[str, Any] = Field(default_factory=dict)


class TeacherBatchDetailResponse(BaseModel):
    id: int
    name: str
    course_id: int
    course_name: str
    course_slug: Optional[str] = None
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    timing: Optional[str] = None
    days: Optional[str] = None
    students_count: int = 0
    students: List[TeacherStudentResponse] = Field(default_factory=list)
    timetable: List[TeacherTodayClass] = Field(default_factory=list)
    today_attendance_marked: bool = False


class TeacherAttendanceStudentRecord(BaseModel):
    student_id: int
    student_name: str
    student_login_id: Optional[str] = None
    status: str  # present, absent, leave, unmarked
    date: date


class TeacherBatchAttendanceStatus(BaseModel):
    batch_id: int
    batch_name: str
    course_name: str
    date: date
    is_marked: bool
    total_students: int
    present_count: int
    absent_count: int
    leave_count: int
    records: List[TeacherAttendanceStudentRecord]


class TeacherAttendanceRecordInput(BaseModel):
    student_id: int
    status: str  # present, absent, leave


class TeacherBatchAttendanceSubmit(BaseModel):
    date: Optional[date] = None
    records: List[TeacherAttendanceRecordInput]


class TeacherTimetableItem(BaseModel):
    id: int
    batch_id: int
    batch_name: str
    course_id: int
    course_name: str
    timing: str
    days: str
    status: str
    room: Optional[str] = "Lab 1 / VFX Suite"
    student_count: int = 0


class TeacherAssignmentCreate(BaseModel):
    batch_id: int
    course_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    max_marks: Optional[int] = 100


class TeacherAssignmentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    batch_id: int
    batch_name: str
    course_id: int
    course_name: str
    due_date: Optional[str] = None
    max_marks: int = 100
    status: str = "active"
    total_students: int = 0
    submitted_count: int = 0
    pending_count: int = 0
    evaluated_count: int = 0
    created_at: Optional[datetime] = None


class TeacherStudentSubmissionRosterItem(BaseModel):
    student_id: int
    student_name: str
    student_login_id: Optional[str] = None
    status: str  # 'submitted', 'pending', 'evaluated'
    submission_date: Optional[datetime] = None
    content: Optional[str] = None
    file_url: Optional[str] = None
    marks: Optional[float] = None
    feedback: Optional[str] = None
    evaluated_at: Optional[datetime] = None


class TeacherAssignmentSubmissionsResponse(BaseModel):
    assignment_id: int
    title: str
    description: Optional[str] = None
    batch_id: int
    batch_name: str
    course_name: str
    due_date: Optional[str] = None
    max_marks: int = 100
    total_students: int = 0
    submitted_count: int = 0
    pending_count: int = 0
    evaluated_count: int = 0
    submissions: List[TeacherStudentSubmissionRosterItem] = Field(default_factory=list)


class TeacherAssignmentEvaluateRequest(BaseModel):
    student_id: int
    marks: float
    feedback: Optional[str] = None


class TeacherPerformancePlaceholder(BaseModel):
    student_id: int
    student_name: str
    student_login_id: Optional[str] = None
    batch_name: str
    course_name: str
    attendance_rate: str
    assignments_completed: int = 0
    total_assignments: int = 0
    grade_estimate: str = "A"
    remarks: str = "Active in practical sessions"

