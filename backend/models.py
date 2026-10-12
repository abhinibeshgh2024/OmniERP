"""
OmniERP: The Next-Generation Intelligent University Operating System
Module: Pydantic v2 Data Models & Relational Schema Contracts
Zero-API-Key Deterministic Pipeline Architecture
"""

from __future__ import annotations
from enum import Enum
from typing import Dict, List, Literal, Optional, Any
from pydantic import BaseModel, Field, EmailStr, model_validator


class AcademicTitle(str, Enum):
    PROFESSOR = "Professor"
    ASSOCIATE_PROFESSOR = "Associate Professor"
    ASSISTANT_PROFESSOR = "Assistant Professor"


class FeePaymentStatus(str, Enum):
    PAID = "Paid"
    PENDING = "Pending"
    OVERDUE = "Overdue"
    SCHOLARSHIP_HOLD = "Scholarship Hold"


class BloomsTaxonomyLevel(str, Enum):
    L1_REMEMBER = "L1: Remember"
    L2_UNDERSTAND = "L2: Understand"
    L3_APPLY = "L3: Apply"
    L4_ANALYZE = "L4: Analyze"
    L5_EVALUATE = "L5: Evaluate"
    L6_CREATE = "L6: Create"


class CourseOutcomeModel(BaseModel):
    co_code: str = Field(..., description="Unique Course Outcome identifier, e.g., CSE701.CO1")
    statement: str = Field(..., description="Action-verb statement mapped to Bloom's Taxonomy")
    blooms_level: BloomsTaxonomyLevel
    blooms_numeric: int = Field(..., ge=1, le=6)
    mapped_pos: Dict[str, int] = Field(
        ..., description="Correlation matrix mapping PO1..PO12 to weight (1=Low, 2=Medium, 3=High)"
    )
    target_attainment_pct: float = Field(..., ge=0.0, le=100.0)
    achieved_attainment_pct: float = Field(..., ge=0.0, le=100.0)


class DepartmentCourseModel(BaseModel):
    course_code: str
    title: str
    department: str
    department_code: str
    semester: int = Field(..., ge=1, le=8)
    credit_weight: int = Field(..., ge=1, le=6)
    lecture_hours_per_week: int = Field(..., ge=1, le=6)
    lab_hours_per_week: int = Field(..., ge=0, le=6)
    enrolled_count: int = Field(..., ge=1)
    assigned_faculty_id: str
    assigned_faculty_name: str
    course_outcomes: List[CourseOutcomeModel]


class ClassroomFacilityModel(BaseModel):
    room_id: str
    building: str
    room_type: Literal["Lecture Hall", "Laboratory", "Seminar Room", "Examination Auditorium"]
    capacity: int = Field(..., ge=15, le=500)
    exam_bench_capacity: int = Field(..., ge=10, le=300)
    department_allocation: str
    has_smart_podium: bool = True


class DepartmentMetadataModel(BaseModel):
    department_id: str
    department_code: str
    department_name: str
    school_block: str
    hod_faculty_id: str
    hod_name: str
    total_faculty: int = Field(default=10)
    total_students: int = Field(default=15)
    total_credits_required: int = Field(default=160)
    classrooms: List[ClassroomFacilityModel]
    courses: List[DepartmentCourseModel]


class FacultyProfileModel(BaseModel):
    faculty_id: str = Field(..., pattern=r"^FAC-[A-Z]+-\d{3}$")
    name: str
    department: str
    department_code: str
    academic_title: AcademicTitle
    specialized_research_domain: str
    email: str
    office_hours: str
    office_room: str
    assigned_courses: List[str]
    assigned_course_titles: List[str]
    publications_count: int = Field(..., ge=0)
    max_weekly_teaching_hours: int = Field(..., ge=6, le=24)


class StudentProfileModel(BaseModel):
    student_id: str = Field(..., pattern=r"^STU-\d{4}-\d{4}$")
    full_name: str
    department: str
    department_code: str
    current_semester: int = Field(..., ge=1, le=8)
    cgpa: float = Field(..., ge=0.0, le=10.0)
    attendance_percentage: float = Field(..., ge=0.0, le=100.0)
    risk_status: bool = Field(
        ..., description="True if attendance_percentage < 75.0 or cgpa < 6.0"
    )
    fee_payment_status: FeePaymentStatus
    continuous_eval_score: float = Field(..., ge=0.0, le=100.0)
    assignment_completion_rate: float = Field(..., ge=0.0, le=100.0)
    email: str
    advisor_faculty_id: str
    backlogs_count: int = Field(default=0, ge=0)

    @model_validator(mode="after")
    def verify_risk_invariant(self) -> "StudentProfileModel":
        computed_risk = (self.attendance_percentage < 75.0) or (self.cgpa < 6.0)
        self.risk_status = computed_risk
        return self


class NLQRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=3,
        max_length=500,
        examples=[
            "Find all law students with attendance under 70% and draft warning emails",
            "Generate CO-PO attainment report for Computer Science 7th sem",
        ],
    )


class NLQPipelineStage(BaseModel):
    stage_name: str
    status: Literal["COMPLETED", "BYPASSED"]
    execution_ms: float
    extracted_tokens: Dict[str, Any]


class DraftEmailArtifact(BaseModel):
    recipient_email: str
    student_id: str
    student_name: str
    department: str
    subject: str
    body: str


class NLQResponse(BaseModel):
    raw_query: str
    detected_intent: Literal[
        "STUDENT_RISK_FILTER",
        "OBE_ATTAINMENT_REPORT",
        "FACULTY_LOAD_LOOKUP",
        "TIMETABLE_CONFLICT_CHECK",
        "FEE_DELINQUENCY_AUDIT",
    ]
    matched_department: Optional[str]
    matched_semester: Optional[int]
    applied_filters: Dict[str, Any]
    pipeline_trace: List[NLQPipelineStage]
    result_count: int
    records: List[Dict[str, Any]]
    drafted_emails: List[DraftEmailArtifact] = []
    obe_summary: Optional[Dict[str, Any]] = None


class ScheduleRequest(BaseModel):
    mode: Literal["LECTURE_TIMETABLE", "EXAM_HALL_ALLOCATION"] = "LECTURE_TIMETABLE"
    department_code: Optional[str] = Field(
        None, description="Optional filter for specific department code (e.g., CSE, LAW)"
    )
    semester: Optional[int] = Field(None, ge=1, le=8)


class EarlyWarningFilterRequest(BaseModel):
    department_code: Optional[str] = None
    semester: Optional[int] = Field(None, ge=1, le=8)
    only_at_risk: bool = True
