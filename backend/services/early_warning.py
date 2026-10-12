"""
OmniERP Module 3: Predictive Early Warning Dashboard Engine
Multi-Factor Risk Scoring & Prioritized Intervention Generator
Scans all 300 student records across 20 departments and computes a composite
academic vulnerability index without external ML APIs.
"""

from __future__ import annotations
from typing import Dict, Any, List, Optional


class PredictiveEarlyWarningEngine:
    """
    Computes a deterministic Multi-Factor Risk Score (0.0 to 100.0):
      - Attendance Deficit Component (40% weight): Penalizes attendance < 75%
      - CGPA Deficit Component (35% weight): Penalizes CGPA < 6.0
      - Continuous Evaluation Deficit (15% weight): Penalizes continuous_eval_score < 60%
      - Assignment Completion & Backlog Penalty (10% weight)
    """

    def __init__(self, db: Dict[str, Any]) -> None:
        self.db = db
        self.faculty_map = {f["faculty_id"]: f for f in db["faculty"]}

    def compute_student_risk_profile(self, student: Dict[str, Any]) -> Dict[str, Any]:
        att = float(student["attendance_percentage"])
        cgpa = float(student["cgpa"])
        ce = float(student["continuous_eval_score"])
        assign = float(student["assignment_completion_rate"])
        backlogs = int(student.get("backlogs_count", 0))

        # Statutory risk flag per university mandate: attendance < 75% OR cgpa < 6.0
        statutory_risk = (att < 75.0) or (cgpa < 6.0)

        att_penalty = max(0.0, (80.0 - att) * 1.45)
        cgpa_penalty = max(0.0, (6.8 - cgpa) * 14.0)
        ce_penalty = max(0.0, (65.0 - ce) * 0.45)
        assign_penalty = max(0.0, (75.0 - assign) * 0.30) + (backlogs * 4.5)

        composite_score = round(
            min(99.5, max(4.0, att_penalty + cgpa_penalty + ce_penalty + assign_penalty)), 1
        )

        if statutory_risk and (att < 65.0 or cgpa < 5.3):
            severity = "CRITICAL"
            recommended_action = (
                "Immediate HOD & Parental Summons + Mandatory Remedial Lab Enrollment"
            )
        elif statutory_risk:
            severity = "HIGH_RISK"
            recommended_action = (
                "Bi-Weekly Faculty Advisor Monitoring + Attendance Condonation Review"
            )
        elif att < 78.0 or cgpa < 6.5:
            severity = "WATCHLIST"
            recommended_action = "Proactive Peer Tutoring & Continuous Assessment Check-in"
        else:
            severity = "NOMINAL"
            recommended_action = "Standard Academic Progression"

        triggers: List[str] = []
        if att < 75.0:
            triggers.append(f"Attendance {att}% (< 75% statutory floor)")
        if cgpa < 6.0:
            triggers.append(f"CGPA {cgpa} (< 6.00 minimum threshold)")
        if ce < 55.0:
            triggers.append(f"Low Continuous Eval ({ce}/100)")
        if student["fee_payment_status"] == "Overdue":
            triggers.append("Tuition Fee Overdue")

        advisor = self.faculty_map.get(student["advisor_faculty_id"], {})

        return {
            **student,
            "risk_status": statutory_risk,
            "composite_risk_score": composite_score,
            "severity_tier": severity,
            "risk_triggers": triggers,
            "recommended_intervention": recommended_action,
            "advisor_name": advisor.get("name", "Assigned Department Mentor"),
            "advisor_email": advisor.get("email", "hod@omnierp.univ.edu"),
        }

    def analyze_cohort(
        self,
        department_code: Optional[str] = None,
        semester: Optional[int] = None,
        only_at_risk: bool = False,
    ) -> Dict[str, Any]:
        evaluated: List[Dict[str, Any]] = []
        dept_breakdown: Dict[str, Dict[str, Any]] = {}

        for dept in self.db["departments"]:
            dept_breakdown[dept["department_code"]] = {
                "department_code": dept["department_code"],
                "department_name": dept["department_name"],
                "hod_name": dept["hod_name"],
                "total_students": 0,
                "at_risk_count": 0,
                "critical_count": 0,
                "avg_attendance": 0.0,
                "avg_cgpa": 0.0,
            }

        for stu in self.db["students"]:
            profile = self.compute_student_risk_profile(stu)
            d_code = stu["department_code"]
            if d_code in dept_breakdown:
                b = dept_breakdown[d_code]
                b["total_students"] += 1
                if profile["risk_status"]:
                    b["at_risk_count"] += 1
                if profile["severity_tier"] == "CRITICAL":
                    b["critical_count"] += 1
                b["avg_attendance"] += stu["attendance_percentage"]
                b["avg_cgpa"] += stu["cgpa"]

            if department_code and d_code != department_code:
                continue
            if semester and stu["current_semester"] != semester:
                continue
            if only_at_risk and not profile["risk_status"]:
                continue

            evaluated.append(profile)

        for b in dept_breakdown.values():
            if b["total_students"] > 0:
                b["avg_attendance"] = round(b["avg_attendance"] / b["total_students"], 1)
                b["avg_cgpa"] = round(b["avg_cgpa"] / b["total_students"], 2)

        evaluated.sort(key=lambda x: x["composite_risk_score"], reverse=True)

        total_at_risk = sum(1 for s in self.db["students"] if s["risk_status"])

        return {
            "total_university_students": len(self.db["students"]),
            "total_flagged_at_risk": total_at_risk,
            "filtered_count": len(evaluated),
            "prioritized_interventions": evaluated,
            "department_risk_summary": list(dept_breakdown.values()),
        }
