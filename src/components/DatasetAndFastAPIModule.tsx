import React, { useEffect, useMemo, useState } from 'react';
import {
  Database,
  Code2,
  Download,
  Copy,
  Check,
  Search,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { OmniERPDatabase } from '../data/datasetGenerator';

interface DatasetAndFastAPIModuleProps {
  db: OmniERPDatabase;
  onExportFullJSON: () => void;
}

interface PythonSourceFile {
  path: string;
  title: string;
  content: string;
}

const FALLBACK_PYTHON_FILES: PythonSourceFile[] = [
  {
    path: 'backend/main.py',
    title: 'main.py — FastAPI Entrypoint & REST Router',
    content: `# FastAPI Entrypoint loaded via /api/v1/python-files`,
  },
];

export const DatasetAndFastAPIModule: React.FC<DatasetAndFastAPIModuleProps> = ({
  db,
  onExportFullJSON,
}) => {
  const [activeTab, setActiveTab] = useState<
    'STUDENTS_300' | 'FACULTY_200' | 'DEPARTMENTS_20' | 'RAW_JSON' | 'PYTHON_FASTAPI'
  >('PYTHON_FASTAPI');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pythonFiles, setPythonFiles] = useState<PythonSourceFile[]>(FALLBACK_PYTHON_FILES);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/v1/python-files')
      .then((r) => r.json())
      .then((data) => {
        if (data?.files?.length) {
          setPythonFiles(data.files);
        }
      })
      .catch(() => {
        // Keep fallback if offline
      });
  }, []);

  const filteredStudents = useMemo(() => {
    return db.students.filter((s) => {
      if (selectedDept !== 'ALL' && s.department_code !== selectedDept) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.student_id.toLowerCase().includes(q) ||
          s.full_name.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [db.students, selectedDept, searchQuery]);

  const filteredFaculty = useMemo(() => {
    return db.faculty.filter((f) => {
      if (selectedDept !== 'ALL' && f.department_code !== selectedDept) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          f.faculty_id.toLowerCase().includes(q) ||
          f.name.toLowerCase().includes(q) ||
          f.specialized_research_domain.toLowerCase().includes(q) ||
          f.department.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [db.faculty, selectedDept, searchQuery]);

  const filteredDepartments = useMemo(() => {
    return db.departments.filter((d) => {
      if (selectedDept !== 'ALL' && d.department_code !== selectedDept) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          d.department_name.toLowerCase().includes(q) ||
          d.department_code.toLowerCase().includes(q) ||
          d.school_block.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [db.departments, selectedDept, searchQuery]);

  const currentPythonFile = pythonFiles[activeFileIndex] || pythonFiles[0];

  const handleCopyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadPythonFile = (file: PythonSourceFile) => {
    const blob = new Blob([file.content], { type: 'text/x-python;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.path.split('/').pop() || 'module.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  const jsonPreviewText = useMemo(() => {
    const filteredDb =
      selectedDept === 'ALL'
        ? db
        : {
            ...db,
            departments: db.departments.filter((d) => d.department_code === selectedDept),
            faculty: db.faculty.filter((f) => f.department_code === selectedDept),
            students: db.students.filter((s) => s.department_code === selectedDept),
          };
    return JSON.stringify(filteredDb, null, 2);
  }, [db, selectedDept]);

  return (
    <div className="space-y-8">
      {/* Top Control & Sub-Navigation Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              05. Python FastAPI Architecture & Relational JSON Dataset (200 Faculty · 300 Students)
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Inspect, filter, and download the complete modular Python (FastAPI + Pydantic v2) backend codebase and the 20-department relational dataset (`omnierp_database.json`).
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onExportFullJSON}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download omnierp_database.json</span>
            </button>
          </div>
        </div>

        {/* Mode Tabs & Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-5">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'PYTHON_FASTAPI', label: 'Python FastAPI Modules (7 Files)' },
                { id: 'FACULTY_200', label: '200 Faculty Roster (10/Dept)' },
                { id: 'STUDENTS_300', label: '300 Student Records' },
                { id: 'DEPARTMENTS_20', label: '20 Departments & Rooms' },
                { id: 'RAW_JSON', label: 'Formatted JSON Inspector' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab !== 'PYTHON_FASTAPI' && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter records..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900"
                />
              </div>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                aria-label="Filter Dataset by Department"
                className="w-full sm:w-64 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-900"
              >
                <option value="ALL">All 20 Academic Departments</option>
                {db.departments.map((d) => (
                  <option key={d.department_code} value={d.department_code}>
                    {d.department_code} — {d.department_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      {/* TAB 1: PYTHON FASTAPI MODULAR CODEBASE */}
      {activeTab === 'PYTHON_FASTAPI' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Modular FastAPI Architecture
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Zero external paid dependencies. Run locally with <code className="font-mono text-slate-800">uvicorn main:app --reload</code>.
              </p>
            </div>

            <div className="space-y-1.5">
              {pythonFiles.map((file, idx) => (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setActiveFileIndex(idx)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    activeFileIndex === idx
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-mono truncate">{file.path}</span>
                  <Code2 className="w-3.5 h-3.5 shrink-0 ml-2 opacity-75" />
                </button>
              ))}
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="font-semibold text-slate-900">Local Execution Pipeline:</div>
              <pre className="font-mono text-[11px] text-slate-700 overflow-x-auto leading-relaxed">
{`pip install -r backend/requirements.txt
uvicorn main:app --app-dir backend --port 8000`}
              </pre>
            </div>
          </div>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-mono text-xs font-bold text-slate-900">
                  {currentPythonFile.path}
                </div>
                <div className="text-xs text-slate-500">{currentPythonFile.title}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyContent(currentPythonFile.content)}
                  className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Python Code</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadPythonFile(currentPythonFile)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .py</span>
                </button>
              </div>
            </div>
            <pre className="p-6 text-xs font-mono text-slate-800 bg-white overflow-x-auto max-h-[640px] overflow-y-auto leading-relaxed">
              {currentPythonFile.content}
            </pre>
          </div>
        </section>
      )}

      {/* TAB 2: 200 FACULTY ROSTER */}
      {activeTab === 'FACULTY_200' && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                University Faculty Roster ({filteredFaculty.length} of 200 Faculty Profiles)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Intelligently distributed: Exactly 10 faculty members per department across all 20 academic departments.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-slate-600">
                <tr>
                  <th className="py-3 px-4">Faculty ID</th>
                  <th className="py-3 px-4">Full Name & Title</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Specialized Research Domain</th>
                  <th className="py-3 px-4">Assigned Courses</th>
                  <th className="py-3 px-4">Office Hours & Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredFaculty.map((fac) => (
                  <tr key={fac.faculty_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                      {fac.faculty_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{fac.name}</div>
                      <div className="text-slate-500">{fac.academic_title}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{fac.department}</div>
                      <div className="font-mono text-slate-500">{fac.department_code}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{fac.specialized_research_domain}</td>
                    <td className="py-3 px-4 font-mono text-slate-800">
                      <div>{fac.assigned_courses.join(' · ')}</div>
                      <div className="font-sans text-slate-500 text-[11px] truncate max-w-xs">
                        {fac.assigned_course_titles.join(' / ')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-800">{fac.office_hours}</div>
                      <div className="font-mono text-slate-500 text-[11px]">{fac.email}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: 300 STUDENT RECORDS */}
      {activeTab === 'STUDENTS_300' && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                University Student Cohort ({filteredStudents.length} of 300 Student Profiles)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Distributed across all 20 departments and Semesters 1–8 with automated Boolean <code className="font-mono">risk_status</code> evaluation (<code className="font-mono">attendance &lt; 75%</code> or <code className="font-mono">CGPA &lt; 6.0</code>).
              </p>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-slate-600">
                <tr>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Full Name & Email</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-right">Semester</th>
                  <th className="py-3 px-4 text-right">CGPA</th>
                  <th className="py-3 px-4 text-right">Attendance %</th>
                  <th className="py-3 px-4">risk_status (Boolean)</th>
                  <th className="py-3 px-4">Fee Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStudents.map((stu) => (
                  <tr key={stu.student_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                      {stu.student_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{stu.full_name}</div>
                      <div className="font-mono text-slate-500 text-[11px]">{stu.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{stu.department}</div>
                      <div className="font-mono text-slate-500">Advisor: {stu.advisor_faculty_id}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                      Sem {stu.current_semester}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <span className={stu.cgpa < 6.0 ? 'text-red-600 font-bold' : 'text-slate-900'}>
                        {stu.cgpa.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <span
                        className={
                          stu.attendance_percentage < 75.0
                            ? 'text-red-600 font-bold'
                            : 'text-slate-900'
                        }
                      >
                        {stu.attendance_percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {stu.risk_status ? (
                        <span className="inline-flex items-center gap-1 text-red-700 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>true</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>false</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{stu.fee_payment_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 4: 20 DEPARTMENTS & METADATA */}
      {activeTab === 'DEPARTMENTS_20' && (
        <section className="space-y-4">
          {filteredDepartments.map((dept) => (
            <div
              key={dept.department_id}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {dept.department_id} ({dept.department_code})
                  </span>
                  <span className="mx-2 text-slate-400">·</span>
                  <span className="font-bold text-slate-900 text-base">{dept.department_name}</span>
                  <span className="mx-2 text-slate-400">·</span>
                  <span className="text-xs text-slate-600">{dept.school_block}</span>
                </div>
                <div className="text-xs font-mono text-slate-600 tabular-nums">
                  HOD: {dept.hod_name} · {dept.total_faculty} Faculty · {dept.total_students} Students · {dept.total_credits_required} Credits Required
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5">
                  <div className="text-xs font-semibold text-slate-800 mb-2">
                    Allocated Classrooms, Labs & Examination Halls:
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="py-2 px-3">Room ID</th>
                          <th className="py-2 px-3">Facility Type</th>
                          <th className="py-2 px-3 text-right">Lecture Cap</th>
                          <th className="py-2 px-3 text-right">Exam Cap</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                        {dept.classrooms.map((rm) => (
                          <tr key={rm.room_id}>
                            <td className="py-2 px-3 font-semibold text-slate-900">{rm.room_id}</td>
                            <td className="py-2 px-3 font-sans text-slate-700">{rm.room_type}</td>
                            <td className="py-2 px-3 text-right text-slate-800">{rm.capacity}</td>
                            <td className="py-2 px-3 text-right text-slate-800">
                              {rm.exam_bench_capacity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <div className="text-xs font-semibold text-slate-800 mb-2">
                    Departmental Curriculum & Credit Weights:
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="py-2 px-3">Code</th>
                          <th className="py-2 px-3">Course Title</th>
                          <th className="py-2 px-3 text-right">Sem</th>
                          <th className="py-2 px-3 text-right">Credits</th>
                          <th className="py-2 px-3">Lead Faculty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {dept.courses.map((c) => (
                          <tr key={c.course_code}>
                            <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                              {c.course_code}
                            </td>
                            <td className="py-2 px-3 text-slate-800">{c.title}</td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700">
                              {c.semester}
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                              {c.credit_weight}
                            </td>
                            <td className="py-2 px-3 text-slate-600">{c.assigned_faculty_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* TAB 5: FORMATTED JSON DATASET INSPECTOR */}
      {activeTab === 'RAW_JSON' && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 font-mono">
                backend/data/omnierp_database.json
              </h3>
              <p className="text-xs text-slate-500">
                Complete relational JSON structure ({db.departments.length} departments, {db.faculty.length} faculty, {db.students.length} students)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyContent(jsonPreviewText)}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-md flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied JSON</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onExportFullJSON}
                className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-md flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Full JSON</span>
              </button>
            </div>
          </div>
          <pre className="p-6 text-xs font-mono text-slate-800 bg-white overflow-x-auto max-h-[640px] overflow-y-auto leading-relaxed">
            {jsonPreviewText}
          </pre>
        </section>
      )}
    </div>
  );
};
