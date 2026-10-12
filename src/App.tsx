import React, { useMemo, useState } from 'react';
import {
  Download,
  Lock,
  Unlock,
  ShieldAlert,
  Building2,
} from 'lucide-react';
import {
  generateOmniERPDatabase,
  StudentRecord,
} from './data/datasetGenerator';
import {
  UserRole,
  generateInitialStudyMaterials,
  generateInitialLeaves,
  generateInitialNotices,
  generateInitialDiscussions,
  StudyMaterialItem,
  LeaveApplication,
  PublicNoticeItem,
  DiscussionThread,
  AttendanceSessionRecord,
  CustomScheduledClass,
} from './data/operationalStore';
import { BoothAttendanceAndClasses } from './components/BoothAttendanceAndClasses';
import { BoothExamsAndMarksheets } from './components/BoothExamsAndMarksheets';
import { BoothStudyMaterialsAndLeaves } from './components/BoothStudyMaterialsAndLeaves';
import { BoothNoticesAndDiscussion } from './components/BoothNoticesAndDiscussion';
import { AdminGovernancePortal } from './components/AdminGovernancePortal';

type InstituteWorkspaceTab =
  | 'CLASSES_AND_ATTENDANCE'
  | 'EXAMS_AND_MARKSHEETS'
  | 'MATERIALS_AND_LEAVES'
  | 'NOTICES_AND_DISCUSS'
  | 'ADMIN_AND_BOOTHS';

export default function App() {
  const initialDb = useMemo(() => generateOmniERPDatabase(), []);

  // Live Stateful Institute Entities
  const [studentsList, setStudentsList] = useState<StudentRecord[]>(() => initialDb.students);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterialItem[]>(() =>
    generateInitialStudyMaterials(initialDb)
  );
  const [leaves, setLeaves] = useState<LeaveApplication[]>(() =>
    generateInitialLeaves(initialDb)
  );
  const [notices, setNotices] = useState<PublicNoticeItem[]>(() =>
    generateInitialNotices(initialDb)
  );
  const [discussions, setDiscussions] = useState<DiscussionThread[]>(() =>
    generateInitialDiscussions(initialDb)
  );
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSessionRecord[]>([]);
  const [customClasses, setCustomClasses] = useState<CustomScheduledClass[]>([]);
  const [markOverrides, setMarkOverrides] = useState<
    Record<string, { internal: number; external: number }>
  >({});

  // Role & Identity State
  const [role, setRole] = useState<UserRole>('FACULTY');
  const [loggedInStudentId, setLoggedInStudentId] = useState<string>(
    initialDb.students[0].student_id
  );
  const [loggedInFacultyId, setLoggedInFacultyId] = useState<string>(
    initialDb.faculty[0].faculty_id
  );
  const [activeBoothCode, setActiveBoothCode] = useState<string>('CSE');
  const [activeTab, setActiveTab] = useState<InstituteWorkspaceTab>('CLASSES_AND_ATTENDANCE');
  const [boothAccessDeniedMsg, setBoothAccessDeniedMsg] = useState<string | null>(null);

  const loggedInStudent = useMemo(
    () =>
      studentsList.find((s) => s.student_id === loggedInStudentId) || studentsList[0],
    [studentsList, loggedInStudentId]
  );

  const loggedInFaculty = useMemo(
    () =>
      initialDb.faculty.find((f) => f.faculty_id === loggedInFacultyId) ||
      initialDb.faculty[0],
    [initialDb.faculty, loggedInFacultyId]
  );

  // Enforce Student Booth Lock: When Role is STUDENT, active booth is ALWAYS their own department!
  const effectiveBoothCode =
    role === 'STUDENT' ? loggedInStudent.department_code : activeBoothCode;

  const activeBoothDept = useMemo(
    () =>
      initialDb.departments.find((d) => d.department_code === effectiveBoothCode) ||
      initialDb.departments[0],
    [initialDb.departments, effectiveBoothCode]
  );

  const handleRoleSwitch = (nextRole: UserRole) => {
    setRole(nextRole);
    setBoothAccessDeniedMsg(null);
    if (nextRole === 'STUDENT') {
      setActiveBoothCode(loggedInStudent.department_code);
      if (activeTab === 'ADMIN_AND_BOOTHS') {
        setActiveTab('CLASSES_AND_ATTENDANCE');
      }
    }
  };

  const handleBoothClick = (targetDeptCode: string) => {
    if (role === 'STUDENT' && targetDeptCode !== loggedInStudent.department_code) {
      setBoothAccessDeniedMsg(
        `Access Restricted: As a Student (${loggedInStudent.full_name} · ${loggedInStudent.student_id}), you are strictly locked to the ${loggedInStudent.department} (${loggedInStudent.department_code}) Booth. Switch to Faculty or Admin mode above to work across multiple Department Booths.`
      );
      setTimeout(() => setBoothAccessDeniedMsg(null), 5000);
      return;
    }
    setBoothAccessDeniedMsg(null);
    setActiveBoothCode(targetDeptCode);
  };

  // Handler: Live Attendance Taking -> updates student attendance % and risk_status
  const handleUpdateStudentAttendance = (
    deptCode: string,
    courseCode: string,
    presentIds: string[],
    absentIds: string[],
    lateIds: string[]
  ) => {
    const courseObj = activeBoothDept.courses.find((c) => c.course_code === courseCode);
    const newSession: AttendanceSessionRecord = {
      id: `ATT-${deptCode}-${Date.now().toString().slice(-4)}`,
      department_code: deptCode,
      course_code: courseCode,
      course_title: courseObj?.title || courseCode,
      semester: courseObj?.semester || 1,
      date: new Date().toISOString().slice(0, 10),
      time_slot: '09:00 - 10:00',
      marked_by_faculty_id: loggedInFaculty.faculty_id,
      marked_by_faculty_name: role === 'FACULTY' ? loggedInFaculty.name : 'Institute Admin',
      present_student_ids: presentIds,
      absent_student_ids: absentIds,
      late_student_ids: lateIds,
    };
    setAttendanceSessions((prev) => [newSession, ...prev]);

    setStudentsList((prev) =>
      prev.map((stu) => {
        if (stu.department_code !== deptCode) return stu;
        let nextAtt = stu.attendance_percentage;
        if (presentIds.includes(stu.student_id)) {
          nextAtt = Math.min(99.5, Number((stu.attendance_percentage + 0.8).toFixed(1)));
        } else if (absentIds.includes(stu.student_id)) {
          nextAtt = Math.max(40.0, Number((stu.attendance_percentage - 1.6).toFixed(1)));
        } else if (lateIds.includes(stu.student_id)) {
          nextAtt = Math.min(99.5, Number((stu.attendance_percentage + 0.3).toFixed(1)));
        }
        const nextRisk = nextAtt < 75.0 || stu.cgpa < 6.0;
        return {
          ...stu,
          attendance_percentage: nextAtt,
          risk_status: nextRisk,
        };
      })
    );
  };

  // Handler: Update Student Marks
  const handleUpdateMarkOverride = (
    studentId: string,
    courseCode: string,
    internal: number,
    external: number
  ) => {
    setMarkOverrides((prev) => ({
      ...prev,
      [`${studentId}_${courseCode}`]: { internal, external },
    }));
  };

  // Handler: Add Study Material
  const handleAddStudyMaterial = (item: StudyMaterialItem) => {
    setStudyMaterials((prev) => [item, ...prev]);
  };

  // Handler: Submit Leave
  const handleSubmitLeave = (item: LeaveApplication) => {
    setLeaves((prev) => [item, ...prev]);
  };

  // Handler: Review Leave (Approve/Reject)
  const handleReviewLeave = (
    leaveId: string,
    status: 'Approved' | 'Rejected',
    reviewerName: string,
    remarks: string
  ) => {
    setLeaves((prev) =>
      prev.map((lv) =>
        lv.id === leaveId
          ? {
              ...lv,
              status,
              reviewed_by: reviewerName,
              review_remarks: remarks,
            }
          : lv
      )
    );
  };

  // Handler: Publish Notice
  const handlePublishNotice = (notice: PublicNoticeItem) => {
    setNotices((prev) => [notice, ...prev]);
  };

  // Handler: Create Discussion Thread
  const handleCreateDiscussionThread = (thread: DiscussionThread) => {
    setDiscussions((prev) => [thread, ...prev]);
  };

  // Handler: Reply to Discussion Thread
  const handleReplyToThread = (
    threadId: string,
    authorId: string,
    authorName: string,
    authorRole: UserRole,
    message: string
  ) => {
    setDiscussions((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              replies: [
                ...t.replies,
                {
                  id: `REP-${Date.now().toString().slice(-4)}`,
                  author_id: authorId,
                  author_name: authorName,
                  author_role: authorRole,
                  created_at: 'Just now',
                  message,
                },
              ],
            }
          : t
      )
    );
  };

  // Handler: Update Student Fee Status
  const handleUpdateFeeStatus = (
    studentId: string,
    newFeeStatus: StudentRecord['fee_payment_status']
  ) => {
    setStudentsList((prev) =>
      prev.map((s) =>
        s.student_id === studentId ? { ...s, fee_payment_status: newFeeStatus } : s
      )
    );
  };

  const handleExportFullJSON = () => {
    const liveDb = {
      ...initialDb,
      students: studentsList,
    };
    const blob = new Blob([JSON.stringify(liveDb, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'omnierp_database.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const navLinks: Array<{ id: InstituteWorkspaceTab; label: string }> = [
    { id: 'CLASSES_AND_ATTENDANCE', label: 'Classes & Attendance' },
    { id: 'EXAMS_AND_MARKSHEETS', label: 'Exams & Marksheets' },
    { id: 'MATERIALS_AND_LEAVES', label: 'Materials & Leaves' },
    { id: 'NOTICES_AND_DISCUSS', label: 'Notices & Discuss' },
    { id: 'ADMIN_AND_BOOTHS', label: 'Admin & 20 Booths' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('CLASSES_AND_ATTENDANCE');
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          OmniERP
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navLinks.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
                  isActive
                    ? 'text-slate-900 border-slate-900 font-semibold'
                    : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleExportFullJSON}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Dataset JSON</span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        {navLinks.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
              activeTab === item.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Institute Role Switcher & 20-Department Booth Access Controller */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 py-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Role Mode Selector */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">Active Portal Role:</span>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    { id: 'STUDENT', label: 'Student Portal (Locked to Own Booth)' },
                    { id: 'FACULTY', label: 'Faculty Portal (Multi-Booth Access)' },
                    { id: 'ADMIN', label: 'Admin Portal (All 20 Booths)' },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleSwitch(r.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      role === r.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Identity Selector */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {role === 'STUDENT' && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium whitespace-nowrap">
                    Logged-in Student:
                  </span>
                  <select
                    value={loggedInStudent.student_id}
                    onChange={(e) => {
                      const nextStu = studentsList.find((s) => s.student_id === e.target.value);
                      setLoggedInStudentId(e.target.value);
                      if (nextStu) {
                        setActiveBoothCode(nextStu.department_code);
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium max-w-xs"
                  >
                    {studentsList.map((s) => (
                      <option key={s.student_id} value={s.student_id}>
                        {s.student_id} — {s.full_name} ({s.department_code} · Sem {s.current_semester})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {role === 'FACULTY' && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium whitespace-nowrap">
                    Logged-in Faculty:
                  </span>
                  <select
                    value={loggedInFaculty.faculty_id}
                    onChange={(e) => {
                      const nextFac = initialDb.faculty.find(
                        (f) => f.faculty_id === e.target.value
                      );
                      setLoggedInFacultyId(e.target.value);
                      if (nextFac) {
                        setActiveBoothCode(nextFac.department_code);
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium max-w-xs"
                  >
                    {initialDb.faculty.map((f) => (
                      <option key={f.faculty_id} value={f.faculty_id}>
                        {f.faculty_id} — {f.name} ({f.department_code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {role === 'ADMIN' && (
                <div className="text-slate-700 font-mono">
                  Identity: <span className="font-bold text-slate-900">Chief Institute Registrar & Super Admin</span>
                </div>
              )}
            </div>
          </div>

          {/* 20-Department Booth Selector Strip with Student Booth Lock Enforcement */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-xs">
                <Building2 className="w-3.5 h-3.5 text-slate-700" />
                <span className="font-semibold text-slate-900">
                  Departmental Booths (20 Academic Departments):
                </span>
                {role === 'STUDENT' ? (
                  <span className="inline-flex items-center gap-1 text-amber-800 font-medium">
                    <Lock className="w-3 h-3" />
                    <span>
                      Student Booth Lock Active — Restricted to {loggedInStudent.department_code} Booth ({loggedInStudent.department})
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <Unlock className="w-3 h-3" />
                    <span>
                      Multi-Booth Access Enabled — Click any of the 20 Department Booths to operate
                    </span>
                  </span>
                )}
              </div>
              <div className="text-xs font-mono text-slate-500 hidden sm:block">
                Current Booth: <span className="font-bold text-slate-900">{activeBoothDept.department_name} ({activeBoothDept.department_code})</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {initialDb.departments.map((dept) => {
                const isCurrentBooth = effectiveBoothCode === dept.department_code;
                const isLockedOutForStudent =
                  role === 'STUDENT' && dept.department_code !== loggedInStudent.department_code;

                return (
                  <button
                    key={dept.department_code}
                    type="button"
                    onClick={() => handleBoothClick(dept.department_code)}
                    title={`${dept.department_name} (${dept.department_code} Booth)`}
                    className={`px-2.5 py-1.5 text-xs font-mono rounded-md border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer ${
                      isCurrentBooth
                        ? 'bg-slate-900 text-white border-slate-900 font-bold'
                        : isLockedOutForStudent
                        ? 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900 font-medium'
                    }`}
                  >
                    {isLockedOutForStudent && <Lock className="w-2.5 h-2.5 shrink-0" />}
                    <span>{dept.department_code}</span>
                  </button>
                );
              })}
            </div>

            {boothAccessDeniedMsg && (
              <div className="mt-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2 font-medium">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{boothAccessDeniedMsg}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Institute Operational Workspace */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8">
        {activeTab === 'CLASSES_AND_ATTENDANCE' && (
          <BoothAttendanceAndClasses
            db={{ ...initialDb, students: studentsList }}
            activeBoothDept={activeBoothDept}
            role={role}
            loggedInStudent={loggedInStudent}
            loggedInFaculty={loggedInFaculty}
            studentsList={studentsList}
            onUpdateStudentAttendance={handleUpdateStudentAttendance}
            attendanceSessions={attendanceSessions}
            customClasses={customClasses}
            onAddCustomClass={(newItem) => setCustomClasses((prev) => [newItem, ...prev])}
          />
        )}

        {activeTab === 'EXAMS_AND_MARKSHEETS' && (
          <BoothExamsAndMarksheets
            activeBoothDept={activeBoothDept}
            role={role}
            loggedInStudent={loggedInStudent}
            studentsList={studentsList}
            markOverrides={markOverrides}
            onUpdateMarkOverride={handleUpdateMarkOverride}
          />
        )}

        {activeTab === 'MATERIALS_AND_LEAVES' && (
          <BoothStudyMaterialsAndLeaves
            activeBoothDept={activeBoothDept}
            role={role}
            loggedInStudent={loggedInStudent}
            loggedInFaculty={loggedInFaculty}
            studyMaterials={studyMaterials}
            onAddStudyMaterial={handleAddStudyMaterial}
            leaves={leaves}
            onSubmitLeave={handleSubmitLeave}
            onReviewLeave={handleReviewLeave}
          />
        )}

        {activeTab === 'NOTICES_AND_DISCUSS' && (
          <BoothNoticesAndDiscussion
            db={{ ...initialDb, students: studentsList }}
            activeBoothDept={activeBoothDept}
            role={role}
            loggedInStudent={loggedInStudent}
            loggedInFaculty={loggedInFaculty}
            notices={notices}
            onPublishNotice={handlePublishNotice}
            discussions={discussions}
            onCreateDiscussionThread={handleCreateDiscussionThread}
            onReplyToThread={handleReplyToThread}
          />
        )}

        {activeTab === 'ADMIN_AND_BOOTHS' && (
          <div>
            {role === 'STUDENT' ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
                <Lock className="w-8 h-8 text-slate-700 mx-auto" />
                <h2 className="text-lg font-bold text-slate-900">
                  Central Admin & Multi-Booth Governance Restricted to Faculty & Institute Admins
                </h2>
                <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
                  You are currently viewing OmniERP as a Student ({loggedInStudent.full_name} ·{' '}
                  {loggedInStudent.student_id}) locked to the{' '}
                  <strong>
                    {loggedInStudent.department} ({loggedInStudent.department_code}) Booth
                  </strong>
                  . Switch your role to <strong>Faculty Portal</strong> or{' '}
                  <strong>Admin Portal</strong> in the role bar above to manage all 20 Department
                  Booths, fee registries, and institute-wide approvals.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch('ADMIN')}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Switch to Institute Admin Portal
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('CLASSES_AND_ATTENDANCE')}
                    className="px-4 py-2 bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Return to My {loggedInStudent.department_code} Booth
                  </button>
                </div>
              </div>
            ) : (
              <AdminGovernancePortal
                db={{ ...initialDb, students: studentsList }}
                studentsList={studentsList}
                leaves={leaves}
                onSelectBooth={(deptCode) => {
                  setActiveBoothCode(deptCode);
                  setActiveTab('CLASSES_AND_ATTENDANCE');
                }}
                onUpdateFeeStatus={handleUpdateFeeStatus}
                onReviewLeave={handleReviewLeave}
                onExportFullJSON={handleExportFullJSON}
              />
            )}
          </div>
        )}
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            OmniERP Institute Operating System · Active Booth: {activeBoothDept.department_name} ({activeBoothDept.department_code}) · Role: {role}
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                handleRoleSwitch('ADMIN');
                setActiveTab('ADMIN_AND_BOOTHS');
              }}
              className="hover:text-slate-900 underline underline-offset-4 cursor-pointer"
            >
              Open Central Admin & 20-Booth Directory
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleExportFullJSON}
              className="hover:text-slate-900 underline underline-offset-4 cursor-pointer"
            >
              Download omnierp_database.json
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
