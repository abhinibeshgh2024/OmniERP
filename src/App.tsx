import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Lock,
  Plus,
  Building2,
  CheckCircle2,
  Clock,
  LogOut,
  ShieldCheck,
  ArrowRight,
  Menu,
  MoveHorizontal,
  PanelLeft,
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
  PortalEnrollmentRequest,
  BoothEnrollmentRequest,
} from './data/operationalStore';
import { LivePipelineExecutionEvent } from './services/pipelineOrchestrator';
import { AuthLoginAndEnrollPortal } from './components/AuthLoginAndEnrollPortal';
import {
  AddBoothModal,
  HODApprovalConsole,
} from './components/AddBoothAndHODApprovalModal';
import { BoothAttendanceAndClasses } from './components/BoothAttendanceAndClasses';
import { BoothExamsAndMarksheets } from './components/BoothExamsAndMarksheets';
import { BoothStudyMaterialsAndLeaves } from './components/BoothStudyMaterialsAndLeaves';
import { BoothNoticesAndDiscussion } from './components/BoothNoticesAndDiscussion';
import { BoothNoDuesClearance } from './components/BoothNoDuesClearance';
import { AdminGovernancePortal } from './components/AdminGovernancePortal';
import { MovableSidebar, InstituteWorkspaceTab } from './components/MovableSidebar';
import {
  StudentClearanceRecord,
  generateInitialClearanceRecords,
} from './data/operationalStore';

const STORAGE_KEY = 'omnierp_v4_pipeline_state';

export default function App() {
  const initialDb = useMemo(() => generateOmniERPDatabase(), []);

  // Load persisted state from localStorage if available
  const savedState = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore storage parse error
    }
    return null;
  }, []);

  // Authentication Session State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => savedState?.isAuthenticated ?? false
  );
  const [role, setRole] = useState<UserRole>(() => savedState?.role || 'STUDENT');
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    email: string;
    departmentCode: string;
  }>(
    () =>
      savedState?.currentUser || {
        id: initialDb.students[0].student_id,
        name: initialDb.students[0].full_name,
        email: initialDb.students[0].email,
        departmentCode: initialDb.students[0].department_code,
      }
  );

  // Live Stateful Institute Entities
  const [studentsList, setStudentsList] = useState<StudentRecord[]>(
    () => savedState?.studentsList || initialDb.students
  );
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterialItem[]>(
    () => savedState?.studyMaterials || generateInitialStudyMaterials(initialDb)
  );
  const [leaves, setLeaves] = useState<LeaveApplication[]>(
    () => savedState?.leaves || generateInitialLeaves(initialDb)
  );
  const [notices, setNotices] = useState<PublicNoticeItem[]>(
    () => savedState?.notices || generateInitialNotices(initialDb)
  );
  const [discussions, setDiscussions] = useState<DiscussionThread[]>(
    () => savedState?.discussions || generateInitialDiscussions(initialDb)
  );
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSessionRecord[]>(
    () => savedState?.attendanceSessions || []
  );
  const [customClasses, setCustomClasses] = useState<CustomScheduledClass[]>(
    () => savedState?.customClasses || []
  );
  const [markOverrides, setMarkOverrides] = useState<
    Record<string, { internal: number; external: number }>
  >(() => savedState?.markOverrides || {});

  // HOD Approval Queues:
  // 1. Portal Enrollment Requests (New Students not in the portal)
  const [portalRequests, setPortalRequests] = useState<PortalEnrollmentRequest[]>(
    () => savedState?.portalRequests || []
  );
  // 2. Booth Enrollment Requests ("+ Add Booth" -> Request goes to HOD -> Approved before booth entry)
  const [boothRequests, setBoothRequests] = useState<BoothEnrollmentRequest[]>(
    () => savedState?.boothRequests || []
  );

  const [isAddBoothModalOpen, setIsAddBoothModalOpen] = useState<boolean>(false);
  const [activeBoothCode, setActiveBoothCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<InstituteWorkspaceTab>('CLASSES_AND_ATTENDANCE');

  // Student No Dues Clearance Records (Semester fee, Bus fee, Hostel fee)
  const [clearanceRecords, setClearanceRecords] = useState<StudentClearanceRecord[]>(
    () => savedState?.clearanceRecords || generateInitialClearanceRecords(initialDb)
  );

  // Responsive Left-Docked Sidebar State (Phone, Tablet, Desktop)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isPinnedDesktop, setIsPinnedDesktop] = useState<boolean>(
    () => savedState?.isPinnedDesktop ?? false
  );

  const [pipelineEvents, setPipelineEvents] = useState<LivePipelineExecutionEvent[]>(
    () =>
      savedState?.pipelineEvents || [
        {
          event_id: 'EVT-INIT-001',
          timestamp: '2026-10-12 08:00:00',
          pipeline_id: 'PIPE-01',
          pipeline_name: 'BoothAccessControlPipeline',
          actor_role: 'HOD',
          actor_name: initialDb.faculty[0].name,
          booth_code: 'CSE',
          action_summary:
            'Initialized 20 Departmental Booths, HOD Enrollment Gatekeeper, 200 Faculty, and 300 Students.',
          stages_executed: ['01.1 Actor Tokenizer', '01.2 HOD Gatekeeper', '01.3 Booth Projection'],
          duration_ms: 1.12,
          status: 'COMMITTED',
        },
      ]
  );

  // Persist state changes to localStorage automatically
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          isAuthenticated,
          role,
          currentUser,
          studentsList,
          studyMaterials,
          leaves,
          notices,
          discussions,
          attendanceSessions,
          customClasses,
          markOverrides,
          portalRequests,
          boothRequests,
          clearanceRecords,
          isPinnedDesktop,
          pipelineEvents: pipelineEvents.slice(0, 40),
        })
      );
    } catch {
      // Ignore quota errors
    }
  }, [
    isAuthenticated,
    role,
    currentUser,
    studentsList,
    studyMaterials,
    leaves,
    notices,
    discussions,
    attendanceSessions,
    customClasses,
    markOverrides,
    portalRequests,
    boothRequests,
    clearanceRecords,
    isPinnedDesktop,
    pipelineEvents,
  ]);

  const recordPipelineEvent = (
    pipelineId: string,
    pipelineName: string,
    boothCode: string,
    actionSummary: string,
    stages: string[],
    status: 'COMMITTED' | 'BLOCKED_BY_GUARD' = 'COMMITTED'
  ) => {
    const newEvent: LivePipelineExecutionEvent = {
      event_id: `EVT-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      pipeline_id: pipelineId,
      pipeline_name: pipelineName,
      actor_role: role,
      actor_name: currentUser.name,
      booth_code: boothCode || 'GATEWAY',
      action_summary: actionSummary,
      stages_executed: stages,
      duration_ms: Number((0.45 + Math.random() * 0.85).toFixed(2)),
      status,
    };
    setPipelineEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
  };

  // Compute approved booths for the currently logged-in user
  // Remember user requirement: "don't show any booths in the portal instead there will be Add Booth option and list will appear to select booths and then on submitting enroll to booth, a request will go to HOD. And only after approval the entry is given to booth."
  const userApprovedBoothCodes = useMemo(() => {
    const approvedForUser = boothRequests
      .filter(
        (r) =>
          (r.requester_email.toLowerCase() === currentUser.email.toLowerCase() ||
            r.requester_id === currentUser.id) &&
          r.status === 'APPROVED'
      )
      .map((r) => r.booth_department_code);
    return Array.from(new Set(approvedForUser));
  }, [boothRequests, currentUser.email, currentUser.id]);

  const userPendingBoothRequests = useMemo(() => {
    return boothRequests.filter(
      (r) =>
        (r.requester_email.toLowerCase() === currentUser.email.toLowerCase() ||
          r.requester_id === currentUser.id) &&
        r.status === 'PENDING_HOD_APPROVAL'
    );
  }, [boothRequests, currentUser.email, currentUser.id]);

  // Keep activeBoothCode synced with userApprovedBoothCodes
  useEffect(() => {
    if (userApprovedBoothCodes.length > 0) {
      if (!userApprovedBoothCodes.includes(activeBoothCode)) {
        setActiveBoothCode(userApprovedBoothCodes[0]);
      }
    } else {
      setActiveBoothCode('');
    }
  }, [userApprovedBoothCodes, activeBoothCode]);

  const activeBoothDept = useMemo(() => {
    if (!activeBoothCode) return null;
    return (
      initialDb.departments.find((d) => d.department_code === activeBoothCode) ||
      null
    );
  }, [initialDb.departments, activeBoothCode]);

  const loggedInStudent = useMemo(
    () =>
      studentsList.find(
        (s) =>
          s.student_id === currentUser.id ||
          s.email.toLowerCase() === currentUser.email.toLowerCase()
      ) || studentsList[0],
    [studentsList, currentUser.id, currentUser.email]
  );

  const loggedInFaculty = useMemo(
    () =>
      initialDb.faculty.find(
        (f) =>
          f.faculty_id === currentUser.id ||
          f.email.toLowerCase() === currentUser.email.toLowerCase()
      ) || initialDb.faculty[0],
    [initialDb.faculty, currentUser.id, currentUser.email]
  );

  // Handler: New Student submits Portal Enrollment Request (when not in portal)
  const handleSubmitPortalEnrollment = (req: PortalEnrollmentRequest) => {
    setPortalRequests((prev) => [req, ...prev]);
    recordPipelineEvent(
      'PIPE-01',
      'BoothAccessControlPipeline',
      req.department_code,
      `New Student "${req.full_name}" (${req.email}, ${req.phone}) submitted Portal Enrollment Request — Routed to HOD (${req.department_code}).`,
      ['01.1 Format Validator', '01.2 HOD Queue Dispatch']
    );
  };

  // Handler: HOD approves/rejects a New Student Portal Enrollment Request
  const handleReviewPortalRequest = (
    reqId: string,
    status: 'APPROVED' | 'REJECTED'
  ) => {
    const targetReq = portalRequests.find((r) => r.id === reqId);
    setPortalRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? { ...r, status, reviewed_by_hod: currentUser.name }
          : r
      )
    );

    if (targetReq && status === 'APPROVED') {
      // Add the newly approved student to studentsList so they are now in the portal!
      const alreadyExists = studentsList.some(
        (s) => s.email.toLowerCase() === targetReq.email.toLowerCase()
      );
      if (!alreadyExists) {
        const deptFaculty = initialDb.faculty.filter(
          (f) => f.department_code === targetReq.department_code
        );
        const newStudentRecord: StudentRecord = {
          student_id: targetReq.student_id_assigned,
          full_name: targetReq.full_name,
          department: targetReq.department_name,
          department_code: targetReq.department_code,
          current_semester: targetReq.semester,
          cgpa: 7.85,
          attendance_percentage: 86.0,
          risk_status: false,
          fee_payment_status: 'Paid',
          continuous_eval_score: 80.0,
          assignment_completion_rate: 90.0,
          email: targetReq.email,
          advisor_faculty_id: deptFaculty[0]?.faculty_id || 'FAC-CSE-001',
          backlogs_count: 0,
        };
        setStudentsList((prev) => [newStudentRecord, ...prev]);
      }
    }

    recordPipelineEvent(
      'PIPE-01',
      'BoothAccessControlPipeline',
      targetReq?.department_code || 'CSE',
      `HOD ${status} Student Portal Enrollment Request ${reqId} (${targetReq?.full_name}).`,
      ['01.1 HOD Authority Check', '01.2 Student Roster Provisioning']
    );
  };

  // Handler: User submits "+ Add Booth" Enrollment Request
  const handleSubmitBoothRequest = (req: BoothEnrollmentRequest) => {
    setBoothRequests((prev) => [req, ...prev]);
    recordPipelineEvent(
      'PIPE-01',
      'BoothAccessControlPipeline',
      req.booth_department_code,
      `${req.requester_name} (${req.requester_role}) submitted "+ Add Booth" request for ${req.booth_department_code} Booth — Awaiting HOD Approval.`,
      ['01.1 Format Validator', '01.2 HOD Booth Queue Dispatch']
    );
  };

  // Handler: HOD approves/rejects a "+ Add Booth" Enrollment Request
  const handleReviewBoothRequest = (
    reqId: string,
    status: 'APPROVED' | 'REJECTED'
  ) => {
    const targetReq = boothRequests.find((r) => r.id === reqId);
    setBoothRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? { ...r, status, reviewed_by_hod: currentUser.name }
          : r
      )
    );
    if (targetReq && status === 'APPROVED' && !activeBoothCode) {
      setActiveBoothCode(targetReq.booth_department_code);
    }
    recordPipelineEvent(
      'PIPE-01',
      'BoothAccessControlPipeline',
      targetReq?.booth_department_code || 'CSE',
      `HOD ${status} Booth Enrollment Request ${reqId} for ${targetReq?.requester_name} -> ${targetReq?.booth_department_code} Booth.`,
      ['01.1 HOD Approval Gate', '01.2 Booth Entry Unlocked']
    );
  };

  // Quick helper to switch into HOD mode to approve requests effortlessly
  const handleQuickSwitchToHOD = () => {
    const hodFac = initialDb.faculty[0];
    setRole('HOD');
    setCurrentUser({
      id: hodFac.faculty_id,
      name: `${hodFac.name} (HOD)`,
      email: hodFac.email,
      departmentCode: hodFac.department_code,
    });
    setActiveTab('HOD_AND_ADMIN');
  };

  // Handler: Live Attendance Taking
  const handleUpdateStudentAttendance = (
    deptCode: string,
    courseCode: string,
    presentIds: string[],
    absentIds: string[],
    lateIds: string[]
  ) => {
    const courseObj = activeBoothDept?.courses.find((c) => c.course_code === courseCode);
    const newSession: AttendanceSessionRecord = {
      id: `ATT-${deptCode}-${Date.now().toString().slice(-4)}`,
      department_code: deptCode,
      course_code: courseCode,
      course_title: courseObj?.title || courseCode,
      semester: courseObj?.semester || 1,
      date: new Date().toISOString().slice(0, 10),
      time_slot: '09:00 - 10:00',
      marked_by_faculty_id: loggedInFaculty.faculty_id,
      marked_by_faculty_name: currentUser.name,
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

    recordPipelineEvent(
      'PIPE-02',
      'AttendanceAndRiskPipeline',
      deptCode,
      `Committed roll-call for ${courseCode}: ${presentIds.length} Present, ${absentIds.length} Absent, ${lateIds.length} Late.`,
      ['02.1 Roll-Call Ingestion', '02.2 Statutory Floor Check', '02.3 Persistent Commit']
    );
  };

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
    recordPipelineEvent(
      'PIPE-04',
      'GradebookAndTranscriptPipeline',
      activeBoothCode || 'CSE',
      `Updated marks for ${studentId} in ${courseCode} (Internal: ${internal}/40, End-Sem: ${external}/60).`,
      ['04.1 Score Validator', '04.2 10-Point GPA Computer', '04.3 Transcript Sync']
    );
  };

  const handleAddStudyMaterial = (item: StudyMaterialItem) => {
    setStudyMaterials((prev) => [item, ...prev]);
    recordPipelineEvent(
      'PIPE-05',
      'CampusWorkflowPipeline',
      item.department_code,
      `Published study material "${item.title}" to ${item.department_code} Booth.`,
      ['05.1 RBAC Schema Check', '05.2 Booth Repository Broadcast']
    );
  };

  const handleSubmitLeave = (item: LeaveApplication) => {
    setLeaves((prev) => [item, ...prev]);
    recordPipelineEvent(
      'PIPE-05',
      'CampusWorkflowPipeline',
      item.department_code,
      `Submitted ${item.leave_type} application for ${item.applicant_name}.`,
      ['05.1 Leave Payload Check', '05.2 Advisor Queue Routing']
    );
  };

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

  const handlePublishNotice = (notice: PublicNoticeItem) => {
    setNotices((prev) => [notice, ...prev]);
  };

  const handleCreateDiscussionThread = (thread: DiscussionThread) => {
    setDiscussions((prev) => [thread, ...prev]);
  };

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

  const handleUpdateClearanceRecord = (record: StudentClearanceRecord) => {
    setClearanceRecords((prev) =>
      prev.map((r) => (r.student_id === record.student_id ? record : r))
    );
  };

  const handleBatchIssueClearances = (departmentCode?: string) => {
    setClearanceRecords((prev) =>
      prev.map((rec) => {
        if (departmentCode && departmentCode !== 'ALL' && rec.department_code !== departmentCode) {
          return rec;
        }
        const isSemPaid = rec.semester_fee_status === 'Paid';
        const isBusPaid = !rec.bus_facility_applicable || rec.bus_fee_status === 'Paid';
        const isHostelPaid = !rec.hostel_facility_applicable || rec.hostel_fee_status === 'Paid';
        const isLibClear = rec.library_clearance_status === 'Cleared';
        const isLabClear = rec.laboratory_clearance_status === 'Cleared';

        if (isSemPaid && isBusPaid && isHostelPaid && isLibClear && isLabClear) {
          return {
            ...rec,
            clearance_issued_by_admin: true,
            issued_by_admin_name: `${currentUser.name} (Admin Directorate)`,
            issued_at: new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            certificate_number:
              rec.certificate_number ||
              `UMU/NODUES/2026-27/${rec.department_code}/${Date.now().toString().slice(-4)}`,
            admin_remarks: 'Institutional zero dues verified. Issued via Administrative Batch Action.',
          };
        }
        return rec;
      })
    );
  };

  const handleResetFactoryState = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStudentsList(initialDb.students);
    setStudyMaterials(generateInitialStudyMaterials(initialDb));
    setLeaves(generateInitialLeaves(initialDb));
    setNotices(generateInitialNotices(initialDb));
    setDiscussions(generateInitialDiscussions(initialDb));
    setClearanceRecords(generateInitialClearanceRecords(initialDb));
    setAttendanceSessions([]);
    setCustomClasses([]);
    setMarkOverrides({});
    setPortalRequests([]);
    setBoothRequests([]);
    setActiveBoothCode('');
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
    a.download = 'martinet_database.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // IF NOT AUTHENTICATED -> RENDER LOGIN & NEW STUDENT ENROLLMENT GATEWAY
  if (!isAuthenticated) {
    return (
      <AuthLoginAndEnrollPortal
        db={initialDb}
        studentsList={studentsList}
        portalRequests={portalRequests}
        onSubmitPortalEnrollment={handleSubmitPortalEnrollment}
        onLoginSuccess={(loggedInRole, identity) => {
          setRole(loggedInRole);
          setCurrentUser(identity);
          setIsAuthenticated(true);
          if (loggedInRole === 'HOD' || loggedInRole === 'ADMIN') {
            setActiveTab('HOD_AND_ADMIN');
          } else {
            setActiveTab('CLASSES_AND_ATTENDANCE');
          }
          recordPipelineEvent(
            'PIPE-01',
            'BoothAccessControlPipeline',
            identity.departmentCode,
            `Authenticated ${loggedInRole} session for ${identity.name} (${identity.email}).`,
            ['01.1 Credential Regex Gate', '01.2 Session Token Issued']
          );
        }}
      />
    );
  }

  const totalPendingHODApprovals =
    portalRequests.filter((r) => r.status === 'PENDING_HOD_APPROVAL').length +
    boothRequests.filter((r) => r.status === 'PENDING_HOD_APPROVAL').length;

  // Pending approvals visible ONLY to HOD and Admin
  const isApprovalsReviewer = role === 'HOD' || role === 'ADMIN';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] relative w-full max-w-full overflow-x-hidden">
      {/* Clean Top Bar with Left Sidebar Toggle — All Module Options in Left Sidebar Only */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-3 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3 sm:gap-6 shadow-2xs w-full max-w-full">
        {/* Left: Sidebar Toggle + Wordmark */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="p-2 -ml-1 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Open sidebar menu (Left)"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5 text-slate-800" />
            <span className="hidden sm:inline text-xs font-semibold text-slate-800">Menu</span>
          </button>

          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('CLASSES_AND_ATTENDANCE');
            }}
            className="flex items-center gap-2 font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            <span>Martinet</span>
            <span className="hidden md:inline text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md truncate max-w-[220px]">
              Usha Martin University, Ranchi
            </span>
          </a>
        </div>

        {/* Right: User Perspective & Sign Out */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-800 truncate max-w-[160px]">
              {currentUser.name}
            </span>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded-sm uppercase tracking-wider ${
                role === 'STUDENT'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : role === 'HOD'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : role === 'ADMIN'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {role}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsAuthenticated(false)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
            <span className="sm:hidden">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Active Session & "+ Add Booth" Enrollment Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 sm:py-4 space-y-2.5 sm:space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Signed in:</span>{' '}
              <span className="font-bold text-slate-900">{currentUser.name}</span>
              <span className="hidden sm:inline text-slate-400">·</span>
              <span className="font-mono text-slate-700 text-[11px] sm:text-xs truncate max-w-[200px] sm:max-w-none">
                {currentUser.email}
              </span>
              <span className="text-slate-400">·</span>
              <span className="font-mono font-bold text-slate-900">{role}</span>
            </div>

            {/* Role Governance: Students CANNOT switch roles */}
            {role === 'STUDENT' ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200 text-[11px] sm:text-xs">
                  Student Portal · Role Locked
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
                <span className="text-slate-500 text-[11px] sm:text-xs">Staff Perspective:</span>
                {(['FACULTY', 'HOD', 'ADMIN'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      if (r === 'HOD') {
                        handleQuickSwitchToHOD();
                      } else if (r === 'FACULTY') {
                        const fac = initialDb.faculty[1];
                        setRole('FACULTY');
                        setCurrentUser({
                          id: fac.faculty_id,
                          name: fac.name,
                          email: fac.email,
                          departmentCode: fac.department_code,
                        });
                      } else {
                        setRole('ADMIN');
                        setCurrentUser({
                          id: 'ADMIN-REG-001',
                          name: 'Chief Institute Registrar (Admin)',
                          email: 'registrar@ushamartin.edu.in',
                          departmentCode: 'CSE',
                        });
                        setActiveTab('HOD_AND_ADMIN');
                      }
                    }}
                    className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded border text-[11px] sm:text-xs font-semibold cursor-pointer ${
                      role === r
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {r}
                    {r === 'HOD' && isApprovalsReviewer && totalPendingHODApprovals > 0
                      ? ` (${totalPendingHODApprovals})`
                      : ''}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Booth Bar: Only Approved Booths + "+ Add Booth" Button */}
          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto max-w-full py-0.5">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mr-1 shrink-0">
                <Building2 className="w-3.5 h-3.5 text-slate-700" />
                <span>Enrolled Booths:</span>
              </span>

              {userApprovedBoothCodes.length === 0 ? (
                <span className="text-xs text-slate-500 italic">
                  No booths enrolled yet — Click "+ Add Booth" to request HOD entry.
                </span>
              ) : (
                userApprovedBoothCodes.map((bCode) => {
                  const isCurrent = activeBoothCode === bCode;
                  return (
                    <button
                      key={bCode}
                      type="button"
                      onClick={() => setActiveBoothCode(bCode)}
                      className={`px-2.5 sm:px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        isCurrent
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{bCode} Booth</span>
                    </button>
                  );
                })
              )}

              {/* Pending Booth Requests Badge */}
              {userPendingBoothRequests.map((pReq) => (
                <span
                  key={pReq.id}
                  className="px-2.5 py-1 text-xs font-mono text-amber-800 bg-amber-50 border border-amber-200 rounded-md inline-flex items-center gap-1.5 shrink-0"
                >
                  <Clock className="w-3 h-3" />
                  <span>{pReq.booth_department_code} Booth: Request sent (Awaiting HOD)</span>
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsAddBoothModalOpen(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Booth</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Menu Button for Phone & Tablet (Always on Left side) */}
      <div className="fixed z-30 bottom-5 left-4 xl:hidden flex items-center shadow-xl rounded-full bg-slate-900 text-white p-1">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="px-3.5 py-2 flex items-center gap-2 text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
          aria-label="Open Sidebar Menu"
        >
          <Menu className="w-4 h-4 text-emerald-400" />
          <span>Menu & Booths</span>
        </button>
      </div>

      {/* Left-Docked Responsive Sidebar Drawer */}
      <MovableSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        role={role}
        currentUser={currentUser}
        enrolledBoothCodes={userApprovedBoothCodes}
        activeBoothCode={activeBoothCode}
        onSelectBooth={setActiveBoothCode}
        pendingBoothRequestsCount={userPendingBoothRequests.length}
        pendingPortalRequestsCount={
          portalRequests.filter((r) => r.status === 'PENDING_HOD_APPROVAL').length
        }
        onOpenAddBooth={() => setIsAddBoothModalOpen(true)}
        onSignOut={() => setIsAuthenticated(false)}
        onExportJSON={handleExportFullJSON}
        onSwitchStaffRole={
          role !== 'STUDENT'
            ? (targetRole) => {
                if (targetRole === 'HOD') {
                  handleQuickSwitchToHOD();
                } else if (targetRole === 'FACULTY') {
                  const fac = initialDb.faculty[1];
                  setRole('FACULTY');
                  setCurrentUser({
                    id: fac.faculty_id,
                    name: fac.name,
                    email: fac.email,
                    departmentCode: fac.department_code,
                  });
                } else {
                  setRole('ADMIN');
                  setCurrentUser({
                    id: 'ADMIN-REG-001',
                    name: 'Chief Institute Registrar (Admin)',
                    email: 'registrar@ushamartin.edu.in',
                    departmentCode: 'CSE',
                  });
                  setActiveTab('HOD_AND_ADMIN');
                }
              }
            : undefined
        }
        isPinnedDesktop={isPinnedDesktop}
        onTogglePinDesktop={() => setIsPinnedDesktop((p) => !p)}
      />

      {/* Add Booth Modal */}
      <AddBoothModal
        db={initialDb}
        isOpen={isAddBoothModalOpen}
        onClose={() => setIsAddBoothModalOpen(false)}
        currentUser={{ ...currentUser, role }}
        boothRequests={boothRequests}
        onSubmitBoothRequest={handleSubmitBoothRequest}
        onQuickSwitchToHOD={handleQuickSwitchToHOD}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8 min-w-0 max-w-full overflow-hidden">
        {/* Pending approvals console: visible ONLY to HOD and Admin */}
        {isApprovalsReviewer && (activeTab === 'HOD_AND_ADMIN' || (role === 'HOD' && totalPendingHODApprovals > 0)) && (
          <HODApprovalConsole
            portalRequests={portalRequests}
            boothRequests={boothRequests}
            hodName={currentUser.name}
            onReviewPortalRequest={handleReviewPortalRequest}
            onReviewBoothRequest={handleReviewBoothRequest}
          />
        )}

        {/* If user is on a departmental booth operational tab (Classes, Exams, Materials, Notices) AND has NOT yet been approved for any booth by the HOD, block booth entry! */}
        {activeTab !== 'HOD_AND_ADMIN' && activeTab !== 'NO_DUES_CLEARANCE' && !activeBoothDept ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-2xl mx-auto space-y-5">
            <Building2 className="w-10 h-10 text-slate-800 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">
                {userPendingBoothRequests.length > 0
                  ? 'Request to enroll is sent — Awaiting HOD Approval for Booth Entry'
                  : 'No Department Booth Enrolled Yet'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {userPendingBoothRequests.length > 0
                  ? `Your request to enroll in the ${userPendingBoothRequests
                      .map((r) => `${r.booth_department_name} (${r.booth_department_code})`)
                      .join(', ')} Booth has been sent to the Head of Department (HOD). Entry to the booth workspace (Classes, Attendance, Exams, Marksheets, Study Materials, Leaves, Notices & Discussion) is granted only after HOD approval.`
                  : 'Departmental booths are hidden by default. Click "Add Booth" below to select your department booth from the list and submit an enrollment request to the HOD.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddBoothModalOpen(true)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Booth & Submit Request to HOD</span>
              </button>

              {userPendingBoothRequests.length > 0 && role !== 'STUDENT' && (
                <button
                  type="button"
                  onClick={handleQuickSwitchToHOD}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Switch to HOD Account to Approve Booth Entry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'CLASSES_AND_ATTENDANCE' && activeBoothDept && (
              <BoothAttendanceAndClasses
                db={{ ...initialDb, students: studentsList }}
                activeBoothDept={activeBoothDept}
                role={role === 'HOD' ? 'FACULTY' : role}
                loggedInStudent={loggedInStudent}
                loggedInFaculty={loggedInFaculty}
                studentsList={studentsList}
                onUpdateStudentAttendance={handleUpdateStudentAttendance}
                attendanceSessions={attendanceSessions}
                customClasses={customClasses}
                onAddCustomClass={(newItem) =>
                  setCustomClasses((prev) => [newItem, ...prev])
                }
              />
            )}

            {activeTab === 'EXAMS_AND_MARKSHEETS' && activeBoothDept && (
              <BoothExamsAndMarksheets
                activeBoothDept={activeBoothDept}
                role={role === 'HOD' ? 'FACULTY' : role}
                loggedInStudent={loggedInStudent}
                studentsList={studentsList}
                markOverrides={markOverrides}
                onUpdateMarkOverride={handleUpdateMarkOverride}
              />
            )}

            {activeTab === 'MATERIALS_AND_LEAVES' && activeBoothDept && (
              <BoothStudyMaterialsAndLeaves
                activeBoothDept={activeBoothDept}
                role={role === 'HOD' ? 'FACULTY' : role}
                loggedInStudent={loggedInStudent}
                loggedInFaculty={loggedInFaculty}
                studyMaterials={studyMaterials}
                onAddStudyMaterial={handleAddStudyMaterial}
                leaves={leaves}
                onSubmitLeave={handleSubmitLeave}
                onReviewLeave={handleReviewLeave}
              />
            )}

            {activeTab === 'NOTICES_AND_DISCUSS' && activeBoothDept && (
              <BoothNoticesAndDiscussion
                db={{ ...initialDb, students: studentsList }}
                activeBoothDept={activeBoothDept}
                role={role === 'HOD' ? 'FACULTY' : role}
                loggedInStudent={loggedInStudent}
                loggedInFaculty={loggedInFaculty}
                notices={notices}
                onPublishNotice={handlePublishNotice}
                discussions={discussions}
                onCreateDiscussionThread={handleCreateDiscussionThread}
                onReplyToThread={handleReplyToThread}
              />
            )}

            {activeTab === 'NO_DUES_CLEARANCE' && (
              <BoothNoDuesClearance
                role={role}
                currentUser={currentUser}
                activeBoothDept={activeBoothDept || initialDb.departments[0]}
                studentsList={studentsList}
                clearanceRecords={clearanceRecords}
                onUpdateClearanceRecord={handleUpdateClearanceRecord}
                onBatchIssueClearances={handleBatchIssueClearances}
              />
            )}

            {activeTab === 'HOD_AND_ADMIN' && (
              <div>
                {!isApprovalsReviewer ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
                    <Lock className="w-8 h-8 text-slate-700 mx-auto" />
                    <h2 className="text-lg font-bold text-slate-900">
                      Restricted Access — HOD & Admin Governance Only
                    </h2>
                    <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
                      This console is reserved exclusively for the Head of Department (HOD) and Chief Institute Registrar (Admin). Staff with role {role} or Students do not have approval permissions.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('CLASSES_AND_ATTENDANCE')}
                      className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Return to Academic Modules
                    </button>
                  </div>
                ) : (
                  <AdminGovernancePortal
                    db={{ ...initialDb, students: studentsList }}
                    studentsList={studentsList}
                    leaves={leaves}
                    onSelectBooth={(deptCode) => {
                      // Ensure HOD/Admin has booth approved if they click into it from Admin Directory
                      const alreadyApproved = boothRequests.some(
                        (r) =>
                          r.requester_email.toLowerCase() ===
                            currentUser.email.toLowerCase() &&
                          r.booth_department_code === deptCode &&
                          r.status === 'APPROVED'
                      );
                      if (!alreadyApproved) {
                        const deptObj = initialDb.departments.find(
                          (d) => d.department_code === deptCode
                        );
                        if (deptObj) {
                          setBoothRequests((prev) => [
                            {
                              id: `BTH-AUTO-${Date.now().toString().slice(-4)}`,
                              requester_id: currentUser.id,
                              requester_name: currentUser.name,
                              requester_email: currentUser.email,
                              requester_role: role,
                              booth_department_code: deptObj.department_code,
                              booth_department_name: deptObj.department_name,
                              status: 'APPROVED',
                              submitted_at: '2026-10-12',
                              reviewed_by_hod: currentUser.name,
                            },
                            ...prev,
                          ]);
                        }
                      }
                      setActiveBoothCode(deptCode);
                      setActiveTab('CLASSES_AND_ATTENDANCE');
                    }}
                    onUpdateFeeStatus={handleUpdateFeeStatus}
                    onReviewLeave={handleReviewLeave}
                    onExportFullJSON={handleExportFullJSON}
                    pipelineEvents={pipelineEvents}
                    onResetFactoryState={handleResetFactoryState}
                  />
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 w-full max-w-full">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-slate-500 text-center sm:text-left w-full break-words">
          <div className="break-words max-w-2xl">
            Martinet ERP · Usha Martin University, Ranchi · Signed in as {currentUser.name} ({role}) · Enrolled Booths: {userApprovedBoothCodes.length}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 shrink-0">
            <button
              type="button"
              onClick={() => setIsAddBoothModalOpen(true)}
              className="hover:text-slate-900 underline underline-offset-4 cursor-pointer"
            >
              + Add Booth
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleExportFullJSON}
              className="hover:text-slate-900 underline underline-offset-4 cursor-pointer"
            >
              Download martinet_database.json
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
