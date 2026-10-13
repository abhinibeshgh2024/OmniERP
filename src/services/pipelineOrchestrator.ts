export interface PipelineStageSpec {
  stage_id: string;
  stage_name: string;
  input_contract: string;
  transformation_logic: string;
  output_contract: string;
  invariant_verified: string;
}

export interface PipelineArchitectureSpec {
  pipeline_id: string;
  name: string;
  subsystem: string;
  description: string;
  stages: PipelineStageSpec[];
}

export interface LivePipelineExecutionEvent {
  event_id: string;
  timestamp: string;
  pipeline_id: string;
  pipeline_name: string;
  actor_role: string;
  actor_name: string;
  booth_code: string;
  action_summary: string;
  stages_executed: string[];
  duration_ms: number;
  status: 'COMMITTED' | 'BLOCKED_BY_GUARD';
}

export const OMNIERP_PIPELINE_SPECS: PipelineArchitectureSpec[] = [
  {
    pipeline_id: 'PIPE-01',
    name: 'BoothAccessControlPipeline',
    subsystem: '20-Department Booth Isolation & Role Governance',
    description:
      'Enforces strict departmental booth isolation for all 300 Students while permitting multi-booth academic operations for 200 Faculty and Central Institute Admins.',
    stages: [
      {
        stage_id: '01.1',
        stage_name: 'Actor Identity & Session Tokenizer',
        input_contract: 'ActorRole (STUDENT | FACULTY | ADMIN), ActorID',
        transformation_logic: 'Resolves actor record from the 500-profile relational index.',
        output_contract: 'VerifiedActorContext { id, name, home_department_code, role }',
        invariant_verified: 'Actor exists in relational store',
      },
      {
        stage_id: '01.2',
        stage_name: 'Departmental Booth Scope Guard',
        input_contract: 'VerifiedActorContext, TargetBoothCode (1 of 20 Departments)',
        transformation_logic:
          'If role == STUDENT and TargetBoothCode != home_department_code, reject booth switch and lock to home_department_code.',
        output_contract: 'BoothAccessDecision { granted: boolean, effective_booth: string }',
        invariant_verified: 'Zero unauthorized cross-department student access',
      },
      {
        stage_id: '01.3',
        stage_name: 'Scoped Booth Data Projection',
        input_contract: 'EffectiveBoothCode',
        transformation_logic:
          'Projects courses, classrooms, attendance registers, study materials, leaves, notices, and discussion threads for the active booth.',
        output_contract: 'DepartmentBoothProjection',
        invariant_verified: '100% booth-isolated view state',
      },
    ],
  },
  {
    pipeline_id: 'PIPE-02',
    name: 'AttendanceAndRiskPipeline',
    subsystem: 'Live Roll-Call & Statutory 75% Risk Engine',
    description:
      'Processes classroom roll-call submissions (Present / Late / Absent), updates cumulative attendance percentages, and recalculates statutory risk flags.',
    stages: [
      {
        stage_id: '02.1',
        stage_name: 'Roll-Call Vector Ingestion',
        input_contract: 'CourseCode, SessionDate, TimeSlot, StudentStatusMap',
        transformation_logic:
          'Partitions booth cohort into Present (+0.8% weight), Late (+0.3% weight), and Absent (-1.6% weight) vectors.',
        output_contract: 'PartitionedRollCallSession',
        invariant_verified: 'All booth students accounted for in session',
      },
      {
        stage_id: '02.2',
        stage_name: 'Cumulative Attendance & Statutory Floor Evaluator',
        input_contract: 'StudentRecord[], PartitionedRollCallSession',
        transformation_logic:
          'Computes updated attendance_percentage bounded to [40.0%, 99.5%] and evaluates risk_status = (attendance < 75.0 || cgpa < 6.0).',
        output_contract: 'UpdatedStudentCohort',
        invariant_verified: 'risk_status Boolean invariant strictly preserved',
      },
      {
        stage_id: '02.3',
        stage_name: 'Persistent Ledger Commit',
        input_contract: 'UpdatedStudentCohort, AttendanceSessionRecord',
        transformation_logic: 'Writes updated records to localStorage persistent state and audit log.',
        output_contract: 'CommittedLedgerReceipt',
        invariant_verified: 'Zero data loss across browser reloads',
      },
    ],
  },
  {
    pipeline_id: 'PIPE-03',
    name: 'CSPScheduleAllocationPipeline',
    subsystem: 'Conflict-Free Classes & Examination Hall Scheduler',
    description:
      'Deterministic Constraint-Satisfaction Problem (CSP) solver scheduling weekly lectures, laboratories, and end-semester exam halls across all 20 departments.',
    stages: [
      {
        stage_id: '03.1',
        stage_name: 'Curriculum & Facility Matrix Loader',
        input_contract: '20 Departments, Courses, Classrooms, Laboratories, Exam Auditoriums',
        transformation_logic:
          'Maps weekly lecture/lab credit hours and enrolled student counts against room seating and exam bench capacities.',
        output_contract: 'UnassignedSessionDomains',
        invariant_verified: 'Lab sessions restricted to Laboratory facilities',
      },
      {
        stage_id: '03.2',
        stage_name: 'Backtracking Clash Elimination Engine',
        input_contract: 'UnassignedSessionDomains, OccupiedStateSets',
        transformation_logic:
          'Verifies (FacultyID, Day, Slot), (RoomID, Day, Slot), and (DeptCohort, Semester, Day, Slot) uniqueness constraints.',
        output_contract: 'ConflictFreeAllocationMatrix',
        invariant_verified: '0 Faculty Overlaps · 0 Room Collisions · 0 Cohort Clashes',
      },
    ],
  },
  {
    pipeline_id: 'PIPE-04',
    name: 'GradebookAndTranscriptPipeline',
    subsystem: 'Exam Marks, SGPA/CGPA & Official Marksheet Generator',
    description:
      'Validates internal (/40) and end-semester (/60) examination marks, computes 10-point letter grades, and generates downloadable official marksheets.',
    stages: [
      {
        stage_id: '04.1',
        stage_name: 'Assessment Score Validator & Normalizer',
        input_contract: 'InternalMarks [0..40], ExternalMarks [0..60]',
        transformation_logic: 'Clamps scores to statutory bounds and computes TotalMarks [0..100].',
        output_contract: 'NormalizedCourseScore',
        invariant_verified: 'TotalMarks <= 100',
      },
      {
        stage_id: '04.2',
        stage_name: '10-Point Grade & Credit-Weighted GPA Computer',
        input_contract: 'NormalizedCourseScore[], CourseCredits[]',
        transformation_logic:
          'Maps TotalMarks to Letter Grade (O=10, A+=9, A=8, B+=7, B=6, C=5, P=4, F=0) and computes SGPA = Sum(Credit * GP) / Sum(Credit).',
        output_contract: 'TranscriptSummary { sgpa, cgpa, division }',
        invariant_verified: 'Weighted GPA precision to 2 decimal places',
      },
      {
        stage_id: '04.3',
        stage_name: 'Official Document & CSV Serializer',
        input_contract: 'StudentRecord, NormalizedCourseScore[], TranscriptSummary',
        transformation_logic:
          'Renders self-contained printable HTML University Statement of Marks and RFC-4180 CSV Grade Transcript.',
        output_contract: 'DownloadableMarksheetArtifact',
        invariant_verified: 'Digital HOD & Registrar verification seal embedded',
      },
    ],
  },
  {
    pipeline_id: 'PIPE-05',
    name: 'CampusWorkflowPipeline',
    subsystem: 'Study Materials, Leave Condonation, Notices & Discussion Panels',
    description:
      'Manages department-scoped study material publishing, student/faculty leave approval state transitions, statutory notice broadcasts, and discussion threads.',
    stages: [
      {
        stage_id: '05.1',
        stage_name: 'Payload Schema & Role Permission Check',
        input_contract: 'WorkflowPayload (Material | Leave | Notice | Discussion), ActorContext',
        transformation_logic:
          'Ensures only Faculty/Admin can approve leaves, publish notices, or upload study materials, while Students can submit leaves and post discussions.',
        output_contract: 'ValidatedWorkflowMutation',
        invariant_verified: 'RBAC workflow integrity',
      },
      {
        stage_id: '05.2',
        stage_name: 'State Transition & Booth Broadcast',
        input_contract: 'ValidatedWorkflowMutation',
        transformation_logic:
          'Updates target booth state collection and synchronizes with persistent localStorage.',
        output_contract: 'UpdatedBoothWorkflowState',
        invariant_verified: 'Immediate UI & storage consistency',
      },
    ],
  },
  {
    pipeline_id: 'PIPE-06',
    name: 'NLQAndEarlyWarningPipeline',
    subsystem: 'Natural Language AST Router, Early Warning & OBE Compliance',
    description:
      'Zero-API-key deterministic NLP command router, multi-factor student vulnerability index calculator, and Bloom’s Taxonomy CO-PO articulation auditor.',
    stages: [
      {
        stage_id: '06.1',
        stage_name: 'Lexical Tokenizer & Named Entity Extractor',
        input_contract: 'PlainTextDirective',
        transformation_logic:
          'Extracts target department code, semester, numeric attendance/CGPA thresholds, and action verbs.',
        output_contract: 'ExtractedEntityFrame',
        invariant_verified: 'Deterministic local parsing in < 2ms',
      },
      {
        stage_id: '06.2',
        stage_name: 'Relational AST Execution & Artifact Synthesizer',
        input_contract: 'ExtractedEntityFrame, OmniERPDatabase',
        transformation_logic:
          'Filters relational tables, synthesizes personalized warning email drafts, or computes CO1..CO5 × PO1..PO12 attainment matrices.',
        output_contract: 'NLQExecutionResult | EarlyWarningResult | OBEComplianceResult',
        invariant_verified: 'Zero external LLM or paid API dependencies',
      },
    ],
  },
];
