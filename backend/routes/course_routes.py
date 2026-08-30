import re
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models.courses_models import Course, CourseLesson, CourseModule
from schemas.course_schemas import (
    CourseCreate,
    CourseDetailResponse,
    CourseResponse,
    CourseStatusUpdate,
    CourseUpdate,
    LessonCreate,
    LessonResponse,
    LessonUpdate,
    ModuleCreate,
    ModuleResponse,
    ModuleUpdate,
    PublicCourseDetailResponse,
    PublicCourseResponse,
)
from services.audit_service import log_activity
from services.auth_dependency import get_current_admin, require_admin

router = APIRouter(prefix="/courses", tags=["Courses"])


def slugify(text: str) -> str:
    """Convert text into a URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_-]+", "-", text).strip("-")


# =====================================================================
# 1. PUBLIC COURSE ENDPOINTS (NEW USERS / PUBLIC EXPERIENCE)
# =====================================================================
@router.get("/public", response_model=List[PublicCourseResponse])
def get_public_courses(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Public catalog for website & mobile app.
    Only returns courses with status='published'.
    """
    query = (
        db.query(Course)
        .options(joinedload(Course.modules))
        .filter(Course.status == "published")
    )

    if category and category.lower() != "all programs":
        query = query.filter(func.lower(Course.category) == category.lower().strip())

    if search:
        s = f"%{search.lower().strip()}%"
        query = query.filter(
            func.lower(Course.name).like(s)
            | func.lower(Course.short_desc).like(s)
            | func.lower(Course.category).like(s)
        )

    courses = query.order_by(Course.id.asc()).all()

    results = []
    for c in courses:
        price_num = float(c.fees or 0)
        results.append(
            PublicCourseResponse(
                id=c.id,
                slug=c.slug,
                title=c.name,
                category=c.category,
                level=c.level or "Beginner to Advanced",
                duration=c.duration or "6 Months",
                price=f"₹{price_num:,.0f}",
                priceNum=price_num,
                emi=c.emi or f"₹{max(1, int(price_num / 12)):,.0f}/mo",
                image=c.thumbnail,
                tag=c.tag or "Professional Program",
                shortDesc=c.short_desc,
                tools=c.tools or [],
                modules_count=len(c.modules),
            )
        )
    return results


@router.get("/public/{id_or_slug}", response_model=PublicCourseDetailResponse)
def get_public_course_detail(id_or_slug: str, db: Session = Depends(get_db)):
    """
    Public course details including full syllabus (modules & lessons).
    Only returns courses with status='published'.
    """
    query = (
        db.query(Course)
        .options(joinedload(Course.modules).joinedload(CourseModule.lessons))
        .filter(Course.status == "published")
    )

    if id_or_slug.isdigit():
        course = query.filter(Course.id == int(id_or_slug)).first()
    else:
        course = query.filter(Course.slug == id_or_slug.lower().strip()).first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or is currently not published.",
        )

    price_num = float(course.fees or 0)

    # Sort modules and lessons by order_index
    sorted_modules = []
    for m in sorted(course.modules, key=lambda x: x.order_index):
        sorted_lessons = [
            LessonResponse.model_validate(l)
            for l in sorted(m.lessons, key=lambda x: x.order_index)
        ]
        sorted_modules.append(
            ModuleResponse(
                id=m.id,
                course_id=m.course_id,
                title=m.title,
                order_index=m.order_index,
                description=m.description,
                lessons=sorted_lessons,
                created_at=m.created_at,
            )
        )

    return PublicCourseDetailResponse(
        id=course.id,
        slug=course.slug,
        title=course.name,
        category=course.category,
        level=course.level or "Beginner to Advanced",
        duration=course.duration or "6 Months",
        price=f"₹{price_num:,.0f}",
        priceNum=price_num,
        emi=course.emi or f"₹{max(1, int(price_num / 12)):,.0f}/mo",
        image=course.thumbnail,
        tag=course.tag or "Professional Program",
        shortDesc=course.short_desc,
        fullDesc=course.full_desc,
        tools=course.tools or [],
        outcomes=course.outcomes or [],
        requirements=course.requirements or [],
        careerRoles=course.career_roles or [],
        modules=sorted_modules,
    )


# =====================================================================
# 2. ADMIN COURSE MANAGEMENT ENDPOINTS (PROTECTED BY SUPER ADMIN)
# =====================================================================
@router.get("/", response_model=List[CourseResponse])
def list_admin_courses(
    status_filter: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    """
    List all courses across all statuses (draft, published, unpublished, archived)
    for authorized administrators & staff.
    """
    query = db.query(Course).options(joinedload(Course.modules))

    if status_filter and status_filter != "all":
        query = query.filter(Course.status == status_filter.lower().strip())

    if category and category != "all":
        query = query.filter(func.lower(Course.category) == category.lower().strip())

    if search:
        s = f"%{search.lower().strip()}%"
        query = query.filter(
            func.lower(Course.name).like(s)
            | func.lower(Course.category).like(s)
            | func.lower(Course.slug).like(s)
        )

    courses = query.order_by(Course.id.desc()).all()

    results = []
    for c in courses:
        c_dict = {
            "id": c.id,
            "slug": c.slug,
            "name": c.name,
            "category": c.category,
            "level": c.level,
            "duration": c.duration,
            "fees": c.fees,
            "emi": c.emi,
            "thumbnail": c.thumbnail,
            "tag": c.tag,
            "short_desc": c.short_desc,
            "full_desc": c.full_desc,
            "tools": c.tools,
            "outcomes": c.outcomes,
            "requirements": c.requirements,
            "career_roles": c.career_roles,
            "status": c.status,
            "modules_count": len(c.modules),
            "created_at": c.created_at,
            "updated_at": c.updated_at,
        }
        results.append(CourseResponse(**c_dict))
    return results


@router.get("/{course_id}", response_model=CourseDetailResponse)
def get_admin_course_detail(
    course_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    """Get full course detail with all modules & lessons for editing."""
    course = (
        db.query(Course)
        .options(joinedload(Course.modules).joinedload(CourseModule.lessons))
        .filter(Course.id == course_id)
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found.",
        )

    sorted_modules = []
    for m in sorted(course.modules, key=lambda x: x.order_index):
        sorted_lessons = [
            LessonResponse.model_validate(l)
            for l in sorted(m.lessons, key=lambda x: x.order_index)
        ]
        sorted_modules.append(
            ModuleResponse(
                id=m.id,
                course_id=m.course_id,
                title=m.title,
                order_index=m.order_index,
                description=m.description,
                lessons=sorted_lessons,
                created_at=m.created_at,
            )
        )

    return CourseDetailResponse(
        id=course.id,
        slug=course.slug,
        name=course.name,
        category=course.category,
        level=course.level,
        duration=course.duration,
        fees=course.fees,
        emi=course.emi,
        thumbnail=course.thumbnail,
        tag=course.tag,
        short_desc=course.short_desc,
        full_desc=course.full_desc,
        tools=course.tools,
        outcomes=course.outcomes,
        requirements=course.requirements,
        career_roles=course.career_roles,
        status=course.status,
        modules=sorted_modules,
        created_at=course.created_at,
        updated_at=course.updated_at,
    )


@router.post("/", response_model=CourseDetailResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    payload: CourseCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """Create a new course (defaults to 'draft' status)."""
    clean_name = payload.name.strip()
    existing_name = db.query(Course).filter(func.lower(Course.name) == clean_name.lower()).first()
    if existing_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A course with the name '{clean_name}' already exists.",
        )

    base_slug = payload.slug or slugify(clean_name)
    slug = base_slug
    idx = 1
    while db.query(Course).filter(Course.slug == slug).first() is not None:
        slug = f"{base_slug}-{idx}"
        idx += 1

    new_course = Course(
        name=payload.name.strip(),
        slug=slug,
        category=payload.category.strip(),
        level=payload.level,
        duration=payload.duration,
        fees=payload.fees or 0,
        emi=payload.emi,
        thumbnail=payload.thumbnail,
        tag=payload.tag,
        short_desc=payload.short_desc,
        full_desc=payload.full_desc,
        tools=payload.tools or [],
        outcomes=payload.outcomes or [],
        requirements=payload.requirements or [],
        career_roles=payload.career_roles or [],
        status=payload.status or "draft",
    )

    db.add(new_course)
    db.commit()
    db.refresh(new_course)

    try:
        log_activity(
            db,
            admin,
            action="created_course",
            entity_type="course",
            entity_id=new_course.id,
            details=f"Created course: '{new_course.name}' (status={new_course.status})",
        )
    except Exception:
        pass

    return CourseDetailResponse(
        id=new_course.id,
        slug=new_course.slug,
        name=new_course.name,
        category=new_course.category,
        level=new_course.level,
        duration=new_course.duration,
        fees=new_course.fees,
        emi=new_course.emi,
        thumbnail=new_course.thumbnail,
        tag=new_course.tag,
        short_desc=new_course.short_desc,
        full_desc=new_course.full_desc,
        tools=new_course.tools,
        outcomes=new_course.outcomes,
        requirements=new_course.requirements,
        career_roles=new_course.career_roles,
        status=new_course.status,
        modules=[],
        created_at=new_course.created_at,
        updated_at=new_course.updated_at,
    )


@router.put("/{course_id}", response_model=CourseDetailResponse)
def update_course(
    course_id: int,
    payload: CourseUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """Update course information and metadata."""
    course = (
        db.query(Course)
        .options(joinedload(Course.modules).joinedload(CourseModule.lessons))
        .filter(Course.id == course_id)
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found.",
        )

    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            if field == "name" and value.strip():
                setattr(course, "name", value.strip())
            else:
                setattr(course, field, value)

    db.commit()
    db.refresh(course)

    try:
        log_activity(
            db,
            admin,
            action="updated_course",
            entity_type="course",
            entity_id=course.id,
            details=f"Updated course: '{course.name}'",
        )
    except Exception:
        pass

    return get_admin_course_detail(course.id, db, admin)


@router.put("/{course_id}/status", response_model=CourseResponse)
def update_course_status(
    course_id: int,
    payload: CourseStatusUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """Publish, unpublish, draft, or archive a course."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found.",
        )

    old_status = course.status
    course.status = payload.status
    db.commit()
    db.refresh(course)

    try:
        log_activity(
            db,
            admin,
            action="changed_course_status",
            entity_type="course",
            entity_id=course.id,
            details=f"Changed course status: '{course.name}' from {old_status} to {course.status}",
        )
    except Exception:
        pass

    return CourseResponse(
        id=course.id,
        slug=course.slug,
        name=course.name,
        category=course.category,
        level=course.level,
        duration=course.duration,
        fees=course.fees,
        emi=course.emi,
        thumbnail=course.thumbnail,
        tag=course.tag,
        short_desc=course.short_desc,
        full_desc=course.full_desc,
        tools=course.tools,
        outcomes=course.outcomes,
        requirements=course.requirements,
        career_roles=course.career_roles,
        status=course.status,
        modules_count=len(course.modules),
        created_at=course.created_at,
        updated_at=course.updated_at,
    )


@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """Delete a course along with all associated modules and lessons."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found.",
        )

    course_name = course.name
    db.delete(course)
    db.commit()

    try:
        log_activity(
            db,
            admin,
            action="deleted_course",
            entity_type="course",
            entity_id=course_id,
            details=f"Deleted course: '{course_name}'",
        )
    except Exception:
        pass

    return {"message": f"Course '{course_name}' and all its content deleted successfully."}


# =====================================================================
# 3. MODULE CRUD ENDPOINTS (ADMIN)
# =====================================================================
@router.post("/{course_id}/modules", response_model=ModuleResponse, status_code=status.HTTP_201_CREATED)
def create_module(
    course_id: int,
    payload: ModuleCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """Add a module to a course."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    max_order = (
        db.query(func.max(CourseModule.order_index))
        .filter(CourseModule.course_id == course_id)
        .scalar()
        or 0
    )

    new_module = CourseModule(
        course_id=course_id,
        title=payload.title.strip(),
        order_index=payload.order_index or (max_order + 1),
        description=payload.description,
    )
    db.add(new_module)
    db.commit()
    db.refresh(new_module)

    return ModuleResponse(
        id=new_module.id,
        course_id=new_module.course_id,
        title=new_module.title,
        order_index=new_module.order_index,
        description=new_module.description,
        lessons=[],
        created_at=new_module.created_at,
    )


@router.put("/modules/{module_id}", response_model=ModuleResponse)
def update_module(
    module_id: int,
    payload: ModuleUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """Update a module."""
    mod = (
        db.query(CourseModule)
        .options(joinedload(CourseModule.lessons))
        .filter(CourseModule.id == module_id)
        .first()
    )
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(mod, field, value)

    db.commit()
    db.refresh(mod)

    sorted_lessons = [
        LessonResponse.model_validate(l)
        for l in sorted(mod.lessons, key=lambda x: x.order_index)
    ]
    return ModuleResponse(
        id=mod.id,
        course_id=mod.course_id,
        title=mod.title,
        order_index=mod.order_index,
        description=mod.description,
        lessons=sorted_lessons,
        created_at=mod.created_at,
    )


@router.delete("/modules/{module_id}")
def delete_module(
    module_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """Delete a module and its lessons."""
    mod = db.query(CourseModule).filter(CourseModule.id == module_id).first()
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found.")

    db.delete(mod)
    db.commit()
    return {"message": "Module deleted successfully."}


# =====================================================================
# 4. LESSON CRUD ENDPOINTS (ADMIN)
# =====================================================================
@router.post("/modules/{module_id}/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
def create_lesson(
    module_id: int,
    payload: LessonCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """Add a lesson to a module."""
    mod = db.query(CourseModule).filter(CourseModule.id == module_id).first()
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found.")

    max_order = (
        db.query(func.max(CourseLesson.order_index))
        .filter(CourseLesson.module_id == module_id)
        .scalar()
        or 0
    )

    new_lesson = CourseLesson(
        module_id=module_id,
        title=payload.title.strip(),
        order_index=payload.order_index or (max_order + 1),
        duration=payload.duration,
        video_url=payload.video_url,
        content=payload.content,
        resources=payload.resources,
    )
    db.add(new_lesson)
    db.commit()
    db.refresh(new_lesson)
    return LessonResponse.model_validate(new_lesson)


@router.put("/lessons/{lesson_id}", response_model=LessonResponse)
def update_lesson(
    lesson_id: int,
    payload: LessonUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """Update a lesson."""
    lesson = db.query(CourseLesson).filter(CourseLesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(lesson, field, value)

    db.commit()
    db.refresh(lesson)
    return LessonResponse.model_validate(lesson)


@router.delete("/lessons/{lesson_id}")
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """Delete a lesson."""
    lesson = db.query(CourseLesson).filter(CourseLesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")

    db.delete(lesson)
    db.commit()
    return {"message": "Lesson deleted successfully."}
