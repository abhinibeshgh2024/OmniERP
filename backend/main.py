"""
OmniERP: The Next-Generation Intelligent University Operating System
Principal Enterprise Backend Architecture (Python FastAPI)
Supports 20 Academic Departments, 200 Faculty Profiles, and 300 Student Records.
Zero External API Keys Required — 100% Local Deterministic Pipeline Architecture.
"""

from __future__ import annotations
import json
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from models import NLQRequest, NLQResponse, ScheduleRequest
from services.nlq_router import DeterministicNLQEngine
from services.csp_scheduler import CSPTimetableEngine
from services.early_warning import PredictiveEarlyWarningEngine
from services.obe_compliance import OBEComplianceEngine

app = FastAPI(
    title="OmniERP: Intelligent University Operating System API",
    description=(
        "Production-ready modular FastAPI backend spanning 20 academic departments, "
        "200 faculty members, and 300 students with deterministic NLQ routing, "
        "CSP timetable/exam allocation, predictive early warning analytics, and OBE compliance."
    ),
    version="2.4.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = Path(__file__).parent / "data" / "omnierp_database.json"


def load_relational_dataset() -> Dict[str, Any]:
    if not DATA_PATH.exists():
        raise RuntimeError(f"Relational dataset not found at {DATA_PATH}")
    with open(DATA_PATH, "r", encoding="utf-8") as fh:
        return json.load(fh)


DB_CACHE: Dict[str, Any] = load_relational_dataset()
nlq_engine = DeterministicNLQEngine(DB_CACHE)
csp_engine = CSPTimetableEngine(DB_CACHE)
early_warning_engine = PredictiveEarlyWarningEngine(DB_CACHE)
obe_engine = OBEComplianceEngine(DB_CACHE)


@app.get("/api/v1/health")
def health_check() -> Dict[str, Any]:
    return {
        "status": "OPERATIONAL",
        "architecture": "Deterministic Local Intelligence Pipeline (No External API Keys)",
        "departments_loaded": len(DB_CACHE["departments"]),
        "faculty_loaded": len(DB_CACHE["faculty"]),
        "students_loaded": len(DB_CACHE["students"]),
    }


@app.get("/api/v1/dataset")
def get_relational_dataset(
    department_code: Optional[str] = Query(None, description="Filter by 1 of 20 department codes"),
    semester: Optional[int] = Query(None, ge=1, le=8),
) -> Dict[str, Any]:
    departments = DB_CACHE["departments"]
    faculty = DB_CACHE["faculty"]
    students = DB_CACHE["students"]

    if department_code:
        departments = [d for d in departments if d["department_code"] == department_code]
        faculty = [f for f in faculty if f["department_code"] == department_code]
        students = [s for s in students if s["department_code"] == department_code]

    if semester:
        students = [s for s in students if s["current_semester"] == semester]

    return {
        "summary": DB_CACHE["summary"],
        "departments": departments,
        "faculty": faculty,
        "students": students,
    }


@app.post("/api/v1/nlq/execute", response_model=NLQResponse)
def execute_natural_language_query(payload: NLQRequest) -> NLQResponse:
    """
    Module 1: Natural Language Query & Command Router
    Parses plain-text commands into structured relational filters, CO-PO reports,
    or automated warning email drafts without external LLM dependencies.
    """
    try:
        return nlq_engine.execute_query(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"NLQ Pipeline Error: {str(exc)}") from exc


@app.post("/api/v1/scheduler/allocate")
def allocate_conflict_free_schedule(payload: ScheduleRequest) -> Dict[str, Any]:
    """
    Module 2: Automated Conflict-Free Timetable & Exam Allocator
    Constraint-Satisfaction Problem (CSP) solver avoiding faculty, room, and cohort overlaps.
    """
    return csp_engine.generate_conflict_free_schedule(
        mode=payload.mode,
        department_code=payload.department_code,
        semester=payload.semester,
    )


@app.get("/api/v1/early-warning/analyze")
def analyze_student_early_warning(
    department_code: Optional[str] = Query(None),
    semester: Optional[int] = Query(None, ge=1, le=8),
    only_at_risk: bool = Query(False),
) -> Dict[str, Any]:
    """
    Module 3: Predictive Early Warning Dashboard Engine
    Scans the 300-student cohort and computes multi-factor risk scores and intervention queues.
    """
    return early_warning_engine.analyze_cohort(
        department_code=department_code,
        semester=semester,
        only_at_risk=only_at_risk,
    )


@app.get("/api/v1/obe/compliance")
def generate_obe_compliance_matrix(
    department_code: Optional[str] = Query(None),
    semester: Optional[int] = Query(None, ge=1, le=8),
    course_code: Optional[str] = Query(None),
) -> Dict[str, Any]:
    """
    Module 4: Outcome-Based Education (OBE) Compliance Generator
    Maps Course Outcomes (CO) to Program Outcomes (PO1-PO12) using Bloom's Taxonomy L1-L6.
    """
    return obe_engine.generate_compliance_report(
        department_code=department_code,
        semester=semester,
        course_code=course_code,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
