import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Download,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
} from 'lucide-react';
import {
  StudentRecord,
  FacultyRecord,
  DepartmentMetadata,
} from '../data/datasetGenerator';
import {
  UserRole,
  StudyMaterialItem,
  LeaveApplication,
} from '../data/operationalStore';

interface BoothStudyMaterialsAndLeavesProps {
  activeBoothDept: DepartmentMetadata;
  role: UserRole;
  loggedInStudent: StudentRecord;
  loggedInFaculty: FacultyRecord;
  studyMaterials: StudyMaterialItem[];
  onAddStudyMaterial: (item: StudyMaterialItem) => void;
  leaves: LeaveApplication[];
  onSubmitLeave: (item: LeaveApplication) => void;
  onReviewLeave: (leaveId: string, status: 'Approved' | 'Rejected', reviewerName: string, remarks: string) => void;
}

export const BoothStudyMaterialsAndLeaves: React.FC<BoothStudyMaterialsAndLeavesProps> = ({
  activeBoothDept,
  role,
  loggedInStudent,
  loggedInFaculty,
  studyMaterials,
  onAddStudyMaterial,
  leaves,
  onSubmitLeave,
  onReviewLeave,
}) => {
  const [subTab, setSubTab] = useState<'STUDY_MATERIALS' | 'LEAVE_APPLICATIONS'>('STUDY_MATERIALS');

  // Study Material Form State
  const deptCourses = activeBoothDept.courses;
  const [matCourseCode, setMatCourseCode] = useState<string>(deptCourses[0]?.course_code || '');
  const [matTitle, setMatTitle] = useState<string>('');
  const [matCategory, setMatCategory] = useState<StudyMaterialItem['category']>('Lecture Notes');
  const [matSummary, setMatSummary] = useState<string>('');

  // Leave Application Form State
  const [leaveType, setLeaveType] = useState<LeaveApplication['leave_type']>('Medical Leave');
  const [fromDate, setFromDate] = useState<string>('2026-10-15');
  const [toDate, setToDate] = useState<string>('2026-10-17');
  const [leaveReason, setLeaveReason] = useState<string>('');

  React.useEffect(() => {
    if (deptCourses[0]) {
      setMatCourseCode(deptCourses[0].course_code);
    }
  }, [activeBoothDept.department_code, deptCourses]);

  const boothMaterials = useMemo(
    () => studyMaterials.filter((m) => m.department_code === activeBoothDept.department_code),
    [studyMaterials, activeBoothDept.department_code]
  );

  const boothLeaves = useMemo(() => {
    const deptFiltered = leaves.filter((l) => l.department_code === activeBoothDept.department_code);
    if (role === 'STUDENT') {
      // Students see their own applications + department booth applications for transparency
      return deptFiltered;
    }
    return deptFiltered;
  }, [leaves, activeBoothDept.department_code, role]);

  const handleDownloadStudyMaterial = (mat: StudyMaterialItem) => {
    const content = `USHA MARTIN UNIVERSITY, RANCHI — MARTINET ERP
DEPARTMENT OF ${activeBoothDept.department_name.toUpperCase()}
================================================================================
COURSE: ${mat.course_code} — ${mat.course_title} (Semester ${mat.semester})
RESOURCE TITLE: ${mat.title}
CATEGORY: ${mat.category}
CURATED BY: ${mat.uploaded_by_name} (${mat.uploaded_by_id})
PUBLISHED DATE: ${mat.uploaded_at}
================================================================================

ABSTRACT & MODULE COMPENDIUM:
${mat.summary_content}

KEY LEARNING OUTCOMES & SYLLABUS REFERENCE:
1. Foundational principles and analytical problem sets for ${mat.course_title}.
2. Laboratory protocols, viva-voce preparation checklists, and university past questions.
3. Outcome-Based Education (CO1–CO5) aligned reading notes for ${activeBoothDept.department_code} Booth students.
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mat.course_code}_${mat.category.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePublishMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle.trim()) return;
    const courseObj =
      deptCourses.find((c) => c.course_code === matCourseCode) || deptCourses[0];
    if (!courseObj) return;

    const newItem: StudyMaterialItem = {
      id: `MAT-${courseObj.course_code}-${Date.now().toString().slice(-4)}`,
      department_code: activeBoothDept.department_code,
      semester: courseObj.semester,
      course_code: courseObj.course_code,
      course_title: courseObj.title,
      title: matTitle.trim(),
      category: matCategory,
      uploaded_by_name: role === 'FACULTY' ? loggedInFaculty.name : activeBoothDept.hod_name,
      uploaded_by_id: role === 'FACULTY' ? loggedInFaculty.faculty_id : activeBoothDept.hod_faculty_id,
      uploaded_at: '2026-10-11',
      file_size: '2.1 MB',
      summary_content:
        matSummary.trim() ||
        `Supplemental ${matCategory.toLowerCase()} uploaded to the ${activeBoothDept.department_code} Booth for ${courseObj.title}.`,
    };
    onAddStudyMaterial(newItem);
    setMatTitle('');
    setMatSummary('');
  };

  const handleCreateLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) return;

    const isStudent = role === 'STUDENT';
    const newLeave: LeaveApplication = {
      id: `LV-${activeBoothDept.department_code}-${Date.now().toString().slice(-4)}`,
      applicant_role: isStudent ? 'STUDENT' : 'FACULTY',
      applicant_id: isStudent ? loggedInStudent.student_id : loggedInFaculty.faculty_id,
      applicant_name: isStudent ? loggedInStudent.full_name : loggedInFaculty.name,
      department_code: activeBoothDept.department_code,
      department_name: activeBoothDept.department_name,
      semester: isStudent ? loggedInStudent.current_semester : undefined,
      leave_type: leaveType,
      from_date: fromDate,
      to_date: toDate,
      days_count: 3,
      reason: leaveReason.trim(),
      status: 'Pending',
      submitted_at: '2026-10-11',
    };

    onSubmitLeave(newLeave);
    setLeaveReason('');
  };

  return (
    <div className="space-y-6">
      {/* Sub-Header & Mode Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {activeBoothDept.department_name} ({activeBoothDept.department_code} Booth) — Study Materials & Leave Portal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Access course lecture notes, lab manuals, and question banks, or submit and review departmental leave applications.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setSubTab('STUDY_MATERIALS')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'STUDY_MATERIALS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Study Materials ({boothMaterials.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('LEAVE_APPLICATIONS')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'LEAVE_APPLICATIONS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Leave Applications ({boothLeaves.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: STUDY MATERIALS REPOSITORY */}
      {subTab === 'STUDY_MATERIALS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className={`${role !== 'STUDENT' ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
            {boothMaterials.map((mat) => (
              <div
                key={mat.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="text-xs text-slate-500 font-mono">
                    <span className="font-bold text-slate-900">{mat.course_code}</span>
                    <span className="mx-2">·</span>
                    <span>Semester {mat.semester}</span>
                    <span className="mx-2">·</span>
                    <span className="font-sans font-medium text-slate-700">{mat.category}</span>
                    <span className="mx-2">·</span>
                    <span>{mat.file_size}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{mat.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {mat.summary_content}
                  </p>
                  <div className="text-xs text-slate-500 pt-1">
                    Uploaded by <span className="font-medium text-slate-800">{mat.uploaded_by_name}</span> ({mat.uploaded_by_id}) on {mat.uploaded_at}
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDownloadStudyMaterial(mat)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Material</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {role !== 'STUDENT' && (
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-900 pb-3 mb-4 border-b border-slate-200">
                Publish Study Material to {activeBoothDept.department_code} Booth
              </h3>
              <form onSubmit={handlePublishMaterial} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Course</label>
                  <select
                    value={matCourseCode}
                    onChange={(e) => setMatCourseCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {deptCourses.map((c) => (
                      <option key={c.course_code} value={c.course_code}>
                        {c.course_code} — {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Material Category</label>
                  <select
                    value={matCategory}
                    onChange={(e) =>
                      setMatCategory(e.target.value as StudyMaterialItem['category'])
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="Lecture Notes">Lecture Notes</option>
                    <option value="Lab Manual">Lab Manual</option>
                    <option value="Question Bank">Question Bank</option>
                    <option value="Reference Syllabus">Reference Syllabus</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Document Title</label>
                  <input
                    type="text"
                    required
                    value={matTitle}
                    onChange={(e) => setMatTitle(e.target.value)}
                    placeholder="e.g., Module 4 Worked Problem Set & Viva Guide"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Syllabus Summary / Notes
                  </label>
                  <textarea
                    rows={3}
                    value={matSummary}
                    onChange={(e) => setMatSummary(e.target.value)}
                    placeholder="Describe covered units, equations, or experiment numbers..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload to {activeBoothDept.department_code} Booth</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: LEAVE APPLICATIONS & APPROVALS */}
      {subTab === 'LEAVE_APPLICATIONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Leave Applications Queue */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {activeBoothDept.department_name} — Leave Applications & Condonation Ledger
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {role === 'STUDENT'
                    ? 'Track your submitted leave requests and advisor approval status.'
                    : 'Review student medical/academic leave requests and faculty duty leaves. Click Approve or Reject to update status.'}
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {boothLeaves.map((lv) => (
                <div key={lv.id} className="p-5 space-y-2.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-slate-900">{lv.applicant_id}</span>
                      <span className="mx-2 text-slate-400">·</span>
                      <span className="font-semibold text-slate-900 text-sm">{lv.applicant_name}</span>
                      <span className="mx-2 text-slate-400">·</span>
                      <span className="text-slate-600">
                        {lv.applicant_role} {lv.semester ? `(Sem ${lv.semester})` : ''}
                      </span>
                    </div>
                    <div className="font-mono tabular-nums">
                      {lv.status === 'Approved' && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approved</span>
                        </span>
                      )}
                      {lv.status === 'Rejected' && (
                        <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rejected</span>
                        </span>
                      )}
                      {lv.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending Review</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-slate-700 font-medium">
                    {lv.leave_type} · <span className="font-mono">{lv.from_date}</span> to{' '}
                    <span className="font-mono">{lv.to_date}</span> ({lv.days_count} days)
                  </div>

                  <p className="text-slate-600 leading-relaxed">{lv.reason}</p>

                  {lv.reviewed_by && (
                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-600">
                      <span className="font-semibold text-slate-800">Reviewed by {lv.reviewed_by}:</span>{' '}
                      {lv.review_remarks}
                    </div>
                  )}

                  {role !== 'STUDENT' && lv.status === 'Pending' && (
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onReviewLeave(
                            lv.id,
                            'Approved',
                            role === 'FACULTY' ? loggedInFaculty.name : 'Institute Registrar (Admin)',
                            'Supporting certificate verified; attendance condonation granted.'
                          )
                        }
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Leave</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onReviewLeave(
                            lv.id,
                            'Rejected',
                            role === 'FACULTY' ? loggedInFaculty.name : 'Institute Registrar (Admin)',
                            'Insufficient documentation; please report to Faculty Advisor.'
                          )
                        }
                        className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-red-700 font-semibold rounded-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit New Leave Application Form */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-900 pb-3 mb-4 border-b border-slate-200">
              Submit New Leave Application
            </h3>
            <form onSubmit={handleCreateLeaveRequest} className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-500">Applicant Identity</div>
                <div className="font-semibold text-slate-900 mt-0.5">
                  {role === 'STUDENT'
                    ? `${loggedInStudent.full_name} (${loggedInStudent.student_id})`
                    : `${loggedInFaculty.name} (${loggedInFaculty.faculty_id})`}
                </div>
                <div className="text-slate-600 mt-0.5">
                  Booth: {activeBoothDept.department_name} ({activeBoothDept.department_code})
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Leave Category</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveApplication['leave_type'])}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="Medical Leave">Medical Leave</option>
                  <option value="Academic Conference / Duty">Academic Conference / Duty</option>
                  <option value="Personal / Family Emergency">Personal / Family Emergency</option>
                  <option value="Sports / Cultural Representation">
                    Sports / Cultural Representation
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Detailed Reason & Supporting Reference
                </label>
                <textarea
                  rows={3}
                  required
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Provide reason for leave and medical/official certificate reference..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Leave Application</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
