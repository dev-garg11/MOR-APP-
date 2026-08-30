from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# -------------------------------------------------------------
# LESSON SCHEMAS
# -------------------------------------------------------------
class LessonCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    order_index: Optional[int] = 1
    duration: Optional[str] = "45 Mins"
    video_url: Optional[str] = None
    content: Optional[str] = None
    resources: Optional[Any] = None


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    order_index: Optional[int] = None
    duration: Optional[str] = None
    video_url: Optional[str] = None
    content: Optional[str] = None
    resources: Optional[Any] = None


class LessonResponse(BaseModel):
    id: int
    module_id: int
    title: str
    order_index: int
    duration: Optional[str] = None
    video_url: Optional[str] = None
    content: Optional[str] = None
    resources: Optional[Any] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# -------------------------------------------------------------
# MODULE SCHEMAS
# -------------------------------------------------------------
class ModuleCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    order_index: Optional[int] = 1
    description: Optional[str] = None


class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    order_index: Optional[int] = None
    description: Optional[str] = None


class ModuleResponse(BaseModel):
    id: int
    course_id: int
    title: str
    order_index: int
    description: Optional[str] = None
    lessons: List[LessonResponse] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# -------------------------------------------------------------
# COURSE SCHEMAS
# -------------------------------------------------------------
class CourseCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    slug: Optional[str] = None
    category: str = Field(..., min_length=1, max_length=100)
    level: Optional[str] = "Beginner to Advanced"
    duration: Optional[str] = "6 Months"
    fees: Optional[Decimal] = Field(default=0, ge=0)
    emi: Optional[str] = None
    thumbnail: Optional[str] = None
    tag: Optional[str] = "Popular Program"
    short_desc: Optional[str] = None
    full_desc: Optional[str] = None
    tools: Optional[List[str]] = []
    outcomes: Optional[List[str]] = []
    requirements: Optional[List[str]] = []
    career_roles: Optional[List[Dict[str, Any]]] = []
    status: Optional[str] = "draft"


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    category: Optional[str] = None
    level: Optional[str] = None
    duration: Optional[str] = None
    fees: Optional[Decimal] = None
    emi: Optional[str] = None
    thumbnail: Optional[str] = None
    tag: Optional[str] = None
    short_desc: Optional[str] = None
    full_desc: Optional[str] = None
    tools: Optional[List[str]] = None
    outcomes: Optional[List[str]] = None
    requirements: Optional[List[str]] = None
    career_roles: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = None


class CourseStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(draft|published|unpublished|archived)$")


class CourseResponse(BaseModel):
    id: int
    slug: str
    name: str
    category: str
    level: str
    duration: str
    fees: Decimal
    emi: Optional[str] = None
    thumbnail: Optional[str] = None
    tag: Optional[str] = None
    short_desc: Optional[str] = None
    full_desc: Optional[str] = None
    tools: Optional[Any] = None
    outcomes: Optional[Any] = None
    requirements: Optional[Any] = None
    career_roles: Optional[Any] = None
    status: str
    modules_count: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CourseDetailResponse(BaseModel):
    id: int
    slug: str
    name: str
    category: str
    level: str
    duration: str
    fees: Decimal
    emi: Optional[str] = None
    thumbnail: Optional[str] = None
    tag: Optional[str] = None
    short_desc: Optional[str] = None
    full_desc: Optional[str] = None
    tools: Optional[Any] = None
    outcomes: Optional[Any] = None
    requirements: Optional[Any] = None
    career_roles: Optional[Any] = None
    status: str
    modules: List[ModuleResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# -------------------------------------------------------------
# PUBLIC SCHEMAS
# -------------------------------------------------------------
class PublicCourseResponse(BaseModel):
    id: int
    slug: str
    title: str  # mapped from name
    category: str
    level: str
    duration: str
    price: str  # formatted currency
    priceNum: float
    emi: Optional[str] = None
    image: Optional[str] = None  # mapped from thumbnail
    tag: Optional[str] = None
    shortDesc: Optional[str] = None
    tools: Optional[List[str]] = []
    modules_count: int = 0

    class Config:
        from_attributes = True


class PublicCourseDetailResponse(BaseModel):
    id: int
    slug: str
    title: str
    category: str
    level: str
    duration: str
    price: str
    priceNum: float
    emi: Optional[str] = None
    image: Optional[str] = None
    tag: Optional[str] = None
    shortDesc: Optional[str] = None
    fullDesc: Optional[str] = None
    tools: Optional[List[str]] = []
    outcomes: Optional[List[str]] = []
    requirements: Optional[List[str]] = []
    careerRoles: Optional[List[Dict[str, Any]]] = []
    modules: List[ModuleResponse] = []

    class Config:
        from_attributes = True

