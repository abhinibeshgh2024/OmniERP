import { OmniERPDatabase, StudentRecord, FacultyRecord, DepartmentMetadata } from './datasetGenerator';

export type UserRole = 'STUDENT' | 'FACULTY' | 'HOD' | 'ADMIN';

export interface PortalEnrollmentRequest {
  id: string;
  student_id_assigned: string;
  full_name: string;
  email: string;
  phone: string;
  password: string;
  department_code: string;
  department_name: string;
  semester: number;
  status: 'PENDING_HOD_APPROVAL' | 'APPROVED' | 'REJECTED';
  submitted_at: string;
  reviewed_by_hod?: string;
}

export interface BoothEnrollmentRequest {
  id: string;
  requester_id: string;
  requester_name: string;
  requester_email: string;
  requester_role: UserRole;
  booth_department_code: string;
  booth_department_name: string;
  status: 'PENDING_HOD_APPROVAL' | 'APPROVED' | 'REJECTED';
  submitted_at: string;
  reviewed_by_hod?: string;
}

export interface StudyMaterialItem {
  id: string;
  department_code: string;
  semester: number;
  course_code: string;
  course_title: string;
  title: string;
  category: 'Lecture Notes' | 'Lab Manual' | 'Question Bank' | 'Reference Syllabus';
  uploaded_by_name: string;
  uploaded_by_id: string;
  uploaded_at: string;
  file_size: string;
  summary_content: string;
}

export interface LeaveApplication {
  id: string;
  applicant_role: 'STUDENT' | 'FACULTY';
  applicant_id: string;
  applicant_name: string;
  department_code: string;
  department_name: string;
  semester?: number;
  leave_type: 'Medical Leave' | 'Academic Conference / Duty' | 'Personal / Family Emergency' | 'Sports / Cultural Representation';
  from_date: string;
  to_date: string;
  days_count: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewed_by?: string;
  review_remarks?: string;
  submitted_at: string;
}

export interface PublicNoticeItem {
  id: string;
  title: string;
  category: 'Examination Circular' | 'Academic Regulation' | 'Holiday / Schedule Notice' | 'Scholarship & Fee Circular' | 'Departmental Seminar';
  target_department_code: 'ALL' | string;
  published_by: string;
  published_date: string;
  priority: 'Standard' | 'Urgent' | 'Statutory Regulation';
  body: string;
}

export interface DiscussionReply {
  id: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  created_at: string;
  message: string;
}

export interface DiscussionThread {
  id: string;
  department_code: string;
  course_code: string;
  title: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  created_at: string;
  body: string;
  replies: DiscussionReply[];
}

export interface StudentCourseMark {
  course_code: string;
  course_title: string;
  credits: number;
  internal_marks: number; // out of 40
  external_marks: number; // out of 60
  total_marks: number;    // out of 100
  grade_letter: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'P' | 'F';
  grade_points: number;   // 10, 9, 8, 7, 6, 5, 4, 0
}

export interface AttendanceSessionRecord {
  id: string;
  department_code: string;
  course_code: string;
  course_title: string;
  semester: number;
  date: string;
  time_slot: string;
  marked_by_faculty_id: string;
  marked_by_faculty_name: string;
  present_student_ids: string[];
  absent_student_ids: string[];
  late_student_ids: string[];
}

export interface CustomScheduledClass {
  id: string;
  department_code: string;
  department_name: string;
  semester: number;
  course_code: string;
  course_title: string;
  session_type: 'Lecture' | 'Laboratory' | 'Mid-Term Exam' | 'End-Semester Exam';
  day_or_date: string;
  time_slot: string;
  room_id: string;
  faculty_id: string;
  faculty_name: string;
}

export function computeGradeFromTotal(total: number): {
  grade_letter: StudentCourseMark['grade_letter'];
  grade_points: number;
} {
  if (total >= 90) return { grade_letter: 'O', grade_points: 10 };
  if (total >= 80) return { grade_letter: 'A+', grade_points: 9 };
  if (total >= 70) return { grade_letter: 'A', grade_points: 8 };
  if (total >= 60) return { grade_letter: 'B+', grade_points: 7 };
  if (total >= 55) return { grade_letter: 'B', grade_points: 6 };
  if (total >= 50) return { grade_letter: 'C', grade_points: 5 };
  if (total >= 40) return { grade_letter: 'P', grade_points: 4 };
  return { grade_letter: 'F', grade_points: 0 };
}

export function buildStudentMarksForDepartment(
  student: StudentRecord,
  dept: DepartmentMetadata,
  customOverrides: Record<string, { internal: number; external: number }> = {}
): StudentCourseMark[] {
  // Select courses from the department (matching student's semester or core departmental curriculum)
  const semCourses = dept.courses.filter((c) => c.semester === student.current_semester);
  const targetCourses = semCourses.length >= 3 ? semCourses : dept.courses.slice(0, 5);

  return targetCourses.map((course, idx) => {
    const key = `${student.student_id}_${course.course_code}`;
    const seed =
      student.student_id.charCodeAt(student.student_id.length - 1) * 3 +
      idx * 7 +
      Math.round(student.cgpa * 4);

    const defaultInternal = Math.min(
      39,
      Math.max(16, Math.round((student.continuous_eval_score / 100) * 36) + ((seed % 5) - 2))
    );
    const defaultExternal = Math.min(
      58,
      Math.max(18, Math.round((student.cgpa / 10) * 52) + ((seed % 7) - 3))
    );

    const internal = customOverrides[key]?.internal ?? defaultInternal;
    const external = customOverrides[key]?.external ?? defaultExternal;
    const total = Math.min(100, Math.max(0, internal + external));
    const { grade_letter, grade_points } = computeGradeFromTotal(total);

    return {
      course_code: course.course_code,
      course_title: course.title,
      credits: course.credit_weight,
      internal_marks: internal,
      external_marks: external,
      total_marks: total,
      grade_letter,
      grade_points,
    };
  });
}

export function generateInitialStudyMaterials(db: OmniERPDatabase): StudyMaterialItem[] {
  const items: StudyMaterialItem[] = [];
  const categories: StudyMaterialItem['category'][] = [
    'Lecture Notes',
    'Lab Manual',
    'Question Bank',
    'Reference Syllabus',
  ];

  db.departments.forEach((dept, dIdx) => {
    dept.courses.forEach((course, cIdx) => {
      const cat = categories[(dIdx + cIdx) % categories.length];
      items.push({
        id: `MAT-${course.course_code}-01`,
        department_code: dept.department_code,
        semester: course.semester,
        course_code: course.course_code,
        course_title: course.title,
        title: `${course.course_code}: ${course.title} — Complete Module 1–5 ${cat}`,
        category: cat,
        uploaded_by_name: course.assigned_faculty_name,
        uploaded_by_id: course.assigned_faculty_id,
        uploaded_at: `2026-10-0${(cIdx % 8) + 1}`,
        file_size: `${1.4 + ((dIdx + cIdx) % 4) * 0.6} MB`,
        summary_content: `Official Department of ${dept.department_name} study compendium for ${course.course_code} (${course.title}). Includes unit-wise theoretical derivations, worked numerical problems, laboratory protocols, and Outcome-Based Education (CO1–CO5) review questions curated by ${course.assigned_faculty_name}.`,
      });
    });
  });

  return items;
}

export function generateInitialLeaves(db: OmniERPDatabase): LeaveApplication[] {
  const leaves: LeaveApplication[] = [];
  const types: LeaveApplication['leave_type'][] = [
    'Medical Leave',
    'Academic Conference / Duty',
    'Personal / Family Emergency',
    'Sports / Cultural Representation',
  ];

  db.departments.forEach((dept, idx) => {
    const deptStudents = db.students.filter((s) => s.department_code === dept.department_code);
    const deptFaculty = db.faculty.filter((f) => f.department_code === dept.department_code);

    if (deptStudents[0]) {
      leaves.push({
        id: `LV-STU-${dept.department_code}-01`,
        applicant_role: 'STUDENT',
        applicant_id: deptStudents[0].student_id,
        applicant_name: deptStudents[0].full_name,
        department_code: dept.department_code,
        department_name: dept.department_name,
        semester: deptStudents[0].current_semester,
        leave_type: types[idx % types.length],
        from_date: '2026-10-14',
        to_date: '2026-10-16',
        days_count: 3,
        reason: `Requesting attendance condonation and leave for ${types[idx % types.length].toLowerCase()} with supporting clinical/official certificate attached.`,
        status: idx % 3 === 0 ? 'Approved' : 'Pending',
        reviewed_by: idx % 3 === 0 ? dept.hod_name : undefined,
        review_remarks: idx % 3 === 0 ? 'Verified supporting documentation. Attendance condoned.' : undefined,
        submitted_at: '2026-10-10',
      });
    }

    if (deptStudents[2]) {
      leaves.push({
        id: `LV-STU-${dept.department_code}-02`,
        applicant_role: 'STUDENT',
        applicant_id: deptStudents[2].student_id,
        applicant_name: deptStudents[2].full_name,
        department_code: dept.department_code,
        department_name: dept.department_name,
        semester: deptStudents[2].current_semester,
        leave_type: 'Medical Leave',
        from_date: '2026-10-18',
        to_date: '2026-10-20',
        days_count: 3,
        reason: 'Hospitalization recovery advised by university medical officer; requesting makeup lab slot.',
        status: 'Pending',
        submitted_at: '2026-10-11',
      });
    }

    if (deptFaculty[1]) {
      leaves.push({
        id: `LV-FAC-${dept.department_code}-01`,
        applicant_role: 'FACULTY',
        applicant_id: deptFaculty[1].faculty_id,
        applicant_name: deptFaculty[1].name,
        department_code: dept.department_code,
        department_name: dept.department_name,
        leave_type: 'Academic Conference / Duty',
        from_date: '2026-10-22',
        to_date: '2026-10-24',
        days_count: 3,
        reason: `Presenting peer-reviewed keynote paper on ${deptFaculty[1].specialized_research_domain} at the National Symposium.`,
        status: 'Approved',
        reviewed_by: 'Office of the Dean & Registrar',
        review_remarks: 'Duty leave sanctioned; alternate lecture coverage arranged.',
        submitted_at: '2026-10-08',
      });
    }
  });

  return leaves;
}

export function generateInitialNotices(db: OmniERPDatabase): PublicNoticeItem[] {
  const notices: PublicNoticeItem[] = [
    {
      id: 'NOT-UNIV-001',
      title: 'Statutory Academic Regulation: 75% Mandatory Attendance & Condonation Protocol (2026–27)',
      category: 'Academic Regulation',
      target_department_code: 'ALL',
      published_by: 'Office of the Registrar & Academic Senate',
      published_date: '2026-10-01',
      priority: 'Statutory Regulation',
      body: 'Pursuant to University Ordinance IV, Clause 12: Every enrolled student across all 20 academic departments must maintain a minimum cumulative attendance of 75.0% and a minimum CGPA of 6.00 to remain in good academic standing. Medical condonation up to 10% requires prior approval in the Departmental Booth Leave Portal with verified hospital documentation.',
    },
    {
      id: 'NOT-UNIV-002',
      title: 'End-Semester Theory & Practical Examination Schedule — November 2026 Session',
      category: 'Examination Circular',
      target_department_code: 'ALL',
      published_by: 'Controller of Examinations (CoE)',
      published_date: '2026-10-06',
      priority: 'Urgent',
      body: 'End-semester examinations for Semesters 1 through 8 across all 20 schools and departments will commence on November 16, 2026. Conflict-free examination hall seating and invigilation rosters have been published in each respective Department Booth.',
    },
    {
      id: 'NOT-UNIV-003',
      title: 'Semester Fee Remittance & Merit Scholarship Disbursement Window',
      category: 'Scholarship & Fee Circular',
      target_department_code: 'ALL',
      published_by: 'Finance & Accounts Directorate',
      published_date: '2026-10-08',
      priority: 'Standard',
      body: 'Students with Pending or Overdue tuition status are advised to complete fee clearance prior to hall-ticket generation. Students on Scholarship Hold have been granted automatic hall-ticket clearance pending state treasury disbursement.',
    },
  ];

  db.departments.forEach((dept, idx) => {
    notices.push({
      id: `NOT-${dept.department_code}-101`,
      title: `${dept.department_name}: Internal Continuous Assessment II & Lab Viva Schedule`,
      category: 'Departmental Seminar',
      target_department_code: dept.department_code,
      published_by: `${dept.hod_name}, Head of Department (${dept.department_code})`,
      published_date: `2026-10-0${(idx % 9) + 1}`,
      priority: 'Standard',
      body: `All students and faculty of ${dept.department_name} (${dept.school_block}) are notified that Continuous Assessment II mark verification and laboratory record evaluations will be conducted in ${dept.classrooms[0]?.room_id || 'the Departmental Seminar Room'}. Course study materials and question banks are live in the ${dept.department_code} Booth.`,
    });
  });

  return notices;
}

export function generateInitialDiscussions(db: OmniERPDatabase): DiscussionThread[] {
  const threads: DiscussionThread[] = [];

  db.departments.forEach((dept) => {
    const deptStudents = db.students.filter((s) => s.department_code === dept.department_code);
    const deptFaculty = db.faculty.filter((f) => f.department_code === dept.department_code);
    const firstCourse = dept.courses[0];
    const secondCourse = dept.courses[1] || firstCourse;

    if (firstCourse && deptStudents[0] && deptFaculty[0]) {
      threads.push({
        id: `DISC-${dept.department_code}-01`,
        department_code: dept.department_code,
        course_code: firstCourse.course_code,
        title: `Clarification on Module 3 Numerical Derivation & Lab Viva Rubric in ${firstCourse.course_code}`,
        author_id: deptStudents[0].student_id,
        author_name: deptStudents[0].full_name,
        author_role: 'STUDENT',
        created_at: '2026-10-09 11:20',
        body: `Respected faculty and peers in the ${dept.department_code} booth: For ${firstCourse.title} (${firstCourse.course_code}), will the upcoming internal assessment cover the edge-case proofs from Module 3, and can we reference the uploaded lab manual during the practical viva?`,
        replies: [
          {
            id: `REP-${dept.department_code}-01`,
            author_id: deptFaculty[0].faculty_id,
            author_name: deptFaculty[0].name,
            author_role: 'FACULTY',
            created_at: '2026-10-09 14:05',
            message: `Yes, Module 3 derivations carry a 30% weightage mapped to ${firstCourse.course_code}.CO3. I have uploaded the annotated solution set in the Study Materials tab of the ${dept.department_code} booth. Feel free to visit during my office hours (${deptFaculty[0].office_hours}) if you need 1-on-1 walkthroughs.`,
          },
        ],
      });
    }

    if (secondCourse && deptStudents[1] && deptFaculty[1]) {
      threads.push({
        id: `DISC-${dept.department_code}-02`,
        department_code: dept.department_code,
        course_code: secondCourse.course_code,
        title: `Capstone Project Group Formation & Research Dataset Sharing — ${dept.department_name}`,
        author_id: deptFaculty[1].faculty_id,
        author_name: deptFaculty[1].name,
        author_role: 'FACULTY',
        created_at: '2026-10-10 16:40',
        body: `Students enrolled in ${secondCourse.course_code} (${secondCourse.title}): Please post your 3-member project group topics and research domain alignment below by Friday so lab bench slots in ${dept.classrooms[2]?.room_id || 'the department lab'} can be finalized.`,
        replies: [
          {
            id: `REP-${dept.department_code}-02`,
            author_id: deptStudents[1].student_id,
            author_name: deptStudents[1].full_name,
            author_role: 'STUDENT',
            created_at: '2026-10-10 18:12',
            message: `Thank you Professor! Our team (${deptStudents[1].student_id}, ${deptStudents[2]?.student_id || ''}) is working on "${deptFaculty[1].specialized_research_domain}" and has submitted our abstract.`,
          },
        ],
      });
    }
  });

  return threads;
}
