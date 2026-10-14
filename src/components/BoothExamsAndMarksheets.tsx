import React, { useMemo, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Award,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Check,
} from 'lucide-react';
import {
  StudentRecord,
  DepartmentMetadata,
} from '../data/datasetGenerator';
import {
  UserRole,
  buildStudentMarksForDepartment,
  StudentCourseMark,
} from '../data/operationalStore';

interface BoothExamsAndMarksheetsProps {
  activeBoothDept: DepartmentMetadata;
  role: UserRole;
  loggedInStudent: StudentRecord;
  studentsList: StudentRecord[];
  markOverrides: Record<string, { internal: number; external: number }>;
  onUpdateMarkOverride: (
    studentId: string,
    courseCode: string,
    internal: number,
    external: number
  ) => void;
}

export const BoothExamsAndMarksheets: React.FC<BoothExamsAndMarksheetsProps> = ({
  activeBoothDept,
  role,
  loggedInStudent,
  studentsList,
  markOverrides,
  onUpdateMarkOverride,
}) => {
  const boothStudents = useMemo(
    () => studentsList.filter((s) => s.department_code === activeBoothDept.department_code),
    [studentsList, activeBoothDept.department_code]
  );

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    role === 'STUDENT'
      ? loggedInStudent.student_id
      : boothStudents[0]?.student_id || loggedInStudent.student_id
  );
  const [editingCourseCode, setEditingCourseCode] = useState<string | null>(null);
  const [editInternal, setEditInternal] = useState<number>(30);
  const [editExternal, setEditExternal] = useState<number>(48);

  React.useEffect(() => {
    if (role === 'STUDENT') {
      setSelectedStudentId(loggedInStudent.student_id);
    } else if (boothStudents[0]) {
      setSelectedStudentId(boothStudents[0].student_id);
    }
  }, [role, loggedInStudent.student_id, activeBoothDept.department_code, boothStudents]);

  const targetStudent = useMemo(() => {
    if (role === 'STUDENT') return loggedInStudent;
    return (
      boothStudents.find((s) => s.student_id === selectedStudentId) ||
      boothStudents[0] ||
      loggedInStudent
    );
  }, [role, loggedInStudent, boothStudents, selectedStudentId]);

  const courseMarks = useMemo(
    () => buildStudentMarksForDepartment(targetStudent, activeBoothDept, markOverrides),
    [targetStudent, activeBoothDept, markOverrides]
  );

  const summaryStats = useMemo(() => {
    let totalCredits = 0;
    let weightedGradePoints = 0;
    let totalMarksObtained = 0;
    let maxPossibleMarks = courseMarks.length * 100;
    let failedCount = 0;

    courseMarks.forEach((m) => {
      totalCredits += m.credits;
      weightedGradePoints += m.credits * m.grade_points;
      totalMarksObtained += m.total_marks;
      if (m.grade_letter === 'F') failedCount++;
    });

    const sgpa = totalCredits > 0 ? Number((weightedGradePoints / totalCredits).toFixed(2)) : 0;
    const cgpa = Number(((sgpa * 0.45) + (targetStudent.cgpa * 0.55)).toFixed(2));
    const division =
      failedCount > 0
        ? 'RE-APPEAR / ARREAR'
        : sgpa >= 8.5
        ? 'FIRST CLASS WITH DISTINCTION'
        : sgpa >= 6.5
        ? 'FIRST CLASS'
        : 'SECOND CLASS';

    return {
      totalCredits,
      totalMarksObtained,
      maxPossibleMarks,
      sgpa,
      cgpa,
      failedCount,
      division,
    };
  }, [courseMarks, targetStudent.cgpa]);

  const startEditingRow = (row: StudentCourseMark) => {
    setEditingCourseCode(row.course_code);
    setEditInternal(row.internal_marks);
    setEditExternal(row.external_marks);
  };

  const saveEditedRow = (courseCode: string) => {
    onUpdateMarkOverride(
      targetStudent.student_id,
      courseCode,
      Math.min(40, Math.max(0, Number(editInternal) || 0)),
      Math.min(60, Math.max(0, Number(editExternal) || 0))
    );
    setEditingCourseCode(null);
  };

  // Generate & Download Official Printable HTML Marksheet
  const handleDownloadPrintableMarksheet = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Official University Marksheet — ${targetStudent.student_id}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0F172A; margin: 40px; background: #fff; }
    .sheet { border: 2px solid #0F172A; padding: 32px; max-width: 900px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #0F172A; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 0.5px; }
    .header p { margin: 4px 0 0; font-size: 13px; color: #475569; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; margin-bottom: 24px; background: #F8FAFC; padding: 16px; border: 1px solid #CBD5E1; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px; }
    th, td { border: 1px solid #CBD5E1; padding: 10px 12px; text-align: left; }
    th { background: #F1F5F9; font-weight: 600; }
    .num { text-align: right; font-family: monospace; }
    .summary { display: flex; justify-content: space-between; background: #F8FAFC; padding: 16px; border: 1px solid #CBD5E1; font-size: 13px; font-weight: 600; }
    .footer { display: flex; justify-content: space-between; margin-top: 48px; padding-top: 16px; border-top: 1px solid #CBD5E1; font-size: 12px; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <h1>Usha Martin University, Ranchi</h1>
      <p>Martinet ERP — Official Statement of Marks & Semester Grade Transcript (${activeBoothDept.department_name})</p>
      <p>Serial No: UMU-MS-2026-${targetStudent.student_id.slice(-4)} · Issued Date: October 12, 2026</p>
    </div>
    <div class="meta-grid">
      <div><strong>Student Name:</strong> ${targetStudent.full_name}</div>
      <div><strong>Enrollment / Student ID:</strong> ${targetStudent.student_id}</div>
      <div><strong>Academic Department:</strong> ${targetStudent.department} (${targetStudent.department_code})</div>
      <div><strong>Current Semester:</strong> Semester ${targetStudent.current_semester}</div>
      <div><strong>Cumulative Attendance:</strong> ${targetStudent.attendance_percentage.toFixed(1)}%</div>
      <div><strong>Academic Advisor ID:</strong> ${targetStudent.advisor_faculty_id}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Course Code</th>
          <th>Course Title</th>
          <th class="num">Credits</th>
          <th class="num">Internal (40)</th>
          <th class="num">End-Sem (60)</th>
          <th class="num">Total (100)</th>
          <th>Letter Grade</th>
          <th class="num">Grade Points</th>
        </tr>
      </thead>
      <tbody>
        ${courseMarks
          .map(
            (m) => `<tr>
          <td><strong>${m.course_code}</strong></td>
          <td>${m.course_title}</td>
          <td class="num">${m.credits}</td>
          <td class="num">${m.internal_marks}</td>
          <td class="num">${m.external_marks}</td>
          <td class="num"><strong>${m.total_marks}</strong></td>
          <td><strong>${m.grade_letter}</strong></td>
          <td class="num">${m.grade_points}</td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>
    <div class="summary">
      <div>Total Credits Registered: ${summaryStats.totalCredits}</div>
      <div>Aggregate Marks: ${summaryStats.totalMarksObtained} / ${summaryStats.maxPossibleMarks}</div>
      <div>Semester GPA (SGPA): ${summaryStats.sgpa.toFixed(2)}</div>
      <div>Cumulative GPA (CGPA): ${summaryStats.cgpa.toFixed(2)}</div>
      <div>Classification: ${summaryStats.division}</div>
    </div>
    <div class="footer">
      <div>Head of Department: ${activeBoothDept.hod_name}</div>
      <div>Controller of Examinations (Digital Seal Verified)</div>
      <div>Registrar, Usha Martin University, Ranchi</div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Marksheet_${targetStudent.student_id}_Sem${targetStudent.current_semester}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarksheetCSV = () => {
    const headers = [
      'Student_ID',
      'Student_Name',
      'Department',
      'Semester',
      'Course_Code',
      'Course_Title',
      'Credits',
      'Internal_Marks_40',
      'External_Marks_60',
      'Total_Marks_100',
      'Letter_Grade',
      'Grade_Points',
      'SGPA',
      'CGPA',
    ];
    const rows = courseMarks.map((m) => [
      targetStudent.student_id,
      `"${targetStudent.full_name}"`,
      `"${targetStudent.department}"`,
      targetStudent.current_semester,
      m.course_code,
      `"${m.course_title}"`,
      m.credits,
      m.internal_marks,
      m.external_marks,
      m.total_marks,
      m.grade_letter,
      m.grade_points,
      summaryStats.sgpa.toFixed(2),
      summaryStats.cgpa.toFixed(2),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GradeCard_${targetStudent.student_id}_Sem${targetStudent.current_semester}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full max-w-full">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 break-words">
            {activeBoothDept.department_name} ({activeBoothDept.department_code} Booth) — Official Marksheet Generator & Gradebook
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 break-words">
            {role === 'STUDENT'
              ? 'View and download your official university semester statement of marks and cumulative transcript.'
              : 'Select any student in this department booth to inspect, edit internal/external exam marks, and generate official downloadable marksheets.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          {role !== 'STUDENT' && (
            <select
              value={targetStudent.student_id}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              aria-label="Select Student for Marksheet"
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium w-full sm:w-auto"
            >
              {boothStudents.map((stu) => (
                <option key={stu.student_id} value={stu.student_id}>
                  {stu.student_id} — {stu.full_name} (Sem {stu.current_semester})
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleDownloadMarksheetCSV}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Transcript (CSV)</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPrintableMarksheet}
            className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Marksheet</span>
          </button>
        </div>
      </div>

      {/* Official University Statement of Marks Card */}
      <div className="bg-white border border-slate-300 rounded-xl overflow-hidden w-full max-w-full shadow-2xs">
        {/* Institutional Transcript Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full">
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs font-mono text-slate-300 truncate">
              OFFICIAL STATEMENT OF MARKS · SERIAL NO: UMU-MS-2026-{targetStudent.student_id.slice(-4)}
            </div>
            <h3 className="text-base sm:text-lg font-bold tracking-tight mt-0.5 break-words">
              Usha Martin University, Ranchi
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 break-words">
              Martinet ERP · {activeBoothDept.department_name} ({activeBoothDept.school_block})
            </p>
          </div>
          <div className="text-left sm:text-right font-mono tabular-nums shrink-0">
            <div className="text-[11px] sm:text-xs text-slate-300">Classification Status</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">
              {summaryStats.division}
            </div>
          </div>
        </div>

        {/* Student Metadata Grid */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 text-xs w-full">
          <div>
            <div className="text-slate-500">Student Name</div>
            <div className="font-semibold text-slate-900 mt-0.5">{targetStudent.full_name}</div>
          </div>
          <div>
            <div className="text-slate-500">Enrollment ID</div>
            <div className="font-mono font-bold text-slate-900 mt-0.5">{targetStudent.student_id}</div>
          </div>
          <div>
            <div className="text-slate-500">Department Booth</div>
            <div className="font-medium text-slate-900 mt-0.5">{targetStudent.department_code}</div>
          </div>
          <div>
            <div className="text-slate-500">Semester</div>
            <div className="font-mono font-semibold text-slate-900 mt-0.5">
              Semester {targetStudent.current_semester}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Attendance Standing</div>
            <div
              className={`font-mono font-semibold mt-0.5 ${
                targetStudent.attendance_percentage < 75 ? 'text-red-600' : 'text-emerald-700'
              }`}
            >
              {targetStudent.attendance_percentage.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-slate-500">Fee Clearance</div>
            <div className="font-medium text-slate-900 mt-0.5">
              {targetStudent.fee_payment_status}
            </div>
          </div>
        </div>

        {/* Course-Wise Grade Table */}
        <div className="overflow-x-auto w-full max-w-full border-b border-slate-200">
          <table className="w-full min-w-[720px] text-left border-collapse text-xs">
            <thead className="bg-white border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3.5 px-4">Course Code</th>
                <th className="py-3.5 px-4">Course Title</th>
                <th className="py-3.5 px-4 text-right">Credits</th>
                <th className="py-3.5 px-4 text-right">Internal (Max 40)</th>
                <th className="py-3.5 px-4 text-right">End-Sem (Max 60)</th>
                <th className="py-3.5 px-4 text-right">Total (Max 100)</th>
                <th className="py-3.5 px-4">Letter Grade</th>
                <th className="py-3.5 px-4 text-right">Grade Points</th>
                {role !== 'STUDENT' && <th className="py-3.5 px-4 text-right">Faculty Edit</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {courseMarks.map((row) => {
                const isEditing = editingCourseCode === row.course_code;
                return (
                  <tr key={row.course_code} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {row.course_code}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{row.course_title}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {row.credits}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          max={40}
                          value={editInternal}
                          onChange={(e) => setEditInternal(Number(e.target.value))}
                          className="w-16 px-2 py-1 border border-slate-400 rounded text-right bg-white"
                        />
                      ) : (
                        row.internal_marks
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          max={60}
                          value={editExternal}
                          onChange={(e) => setEditExternal(Number(e.target.value))}
                          className="w-16 px-2 py-1 border border-slate-400 rounded text-right bg-white"
                        />
                      ) : (
                        row.external_marks
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      {row.total_marks}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span
                        className={
                          row.grade_letter === 'F' ? 'text-red-600' : 'text-slate-900'
                        }
                      >
                        {row.grade_letter}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                      {row.grade_points}
                    </td>
                    {role !== 'STUDENT' && (
                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={() => saveEditedRow(row.course_code)}
                            className="px-2.5 py-1 bg-emerald-700 text-white rounded text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditingRow(row)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Marks</span>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Transcript Summary Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-slate-500">Registered Credits</div>
              <div className="font-mono font-bold text-slate-900 tabular-nums mt-0.5">
                {summaryStats.totalCredits}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Aggregate Score</div>
              <div className="font-mono font-bold text-slate-900 tabular-nums mt-0.5">
                {summaryStats.totalMarksObtained} / {summaryStats.maxPossibleMarks}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Semester SGPA</div>
              <div className="font-mono font-bold text-base text-slate-900 tabular-nums mt-0.5">
                {summaryStats.sgpa.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Cumulative CGPA</div>
              <div className="font-mono font-bold text-base text-slate-900 tabular-nums mt-0.5">
                {summaryStats.cgpa.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-mono text-left md:text-right pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
            Verified by {activeBoothDept.hod_name} (HOD, {activeBoothDept.department_code})
          </div>
        </div>
      </div>
    </div>
  );
};
