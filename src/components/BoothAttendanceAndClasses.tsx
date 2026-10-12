import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Plus,
  UserCheck,
  Clock,
  Check,
} from 'lucide-react';
import {
  OmniERPDatabase,
  StudentRecord,
  FacultyRecord,
  DepartmentMetadata,
} from '../data/datasetGenerator';
import {
  UserRole,
  AttendanceSessionRecord,
  CustomScheduledClass,
} from '../data/operationalStore';
import { solveCSPSchedule } from '../services/omniErpEngines';

interface BoothAttendanceAndClassesProps {
  db: OmniERPDatabase;
  activeBoothDept: DepartmentMetadata;
  role: UserRole;
  loggedInStudent: StudentRecord;
  loggedInFaculty: FacultyRecord;
  studentsList: StudentRecord[];
  onUpdateStudentAttendance: (
    deptCode: string,
    courseCode: string,
    presentIds: string[],
    absentIds: string[],
    lateIds: string[]
  ) => void;
  attendanceSessions: AttendanceSessionRecord[];
  customClasses: CustomScheduledClass[];
  onAddCustomClass: (newItem: CustomScheduledClass) => void;
}

export const BoothAttendanceAndClasses: React.FC<BoothAttendanceAndClassesProps> = ({
  db,
  activeBoothDept,
  role,
  loggedInStudent,
  loggedInFaculty,
  studentsList,
  onUpdateStudentAttendance,
  attendanceSessions,
  customClasses,
  onAddCustomClass,
}) => {
  const [subTab, setSubTab] = useState<'ATTENDANCE' | 'CLASSES_SCHEDULE' | 'EXAMS_SCHEDULE'>('ATTENDANCE');
  const deptCourses = activeBoothDept.courses;
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>(
    deptCourses[0]?.course_code || ''
  );
  const [attendanceDate, setAttendanceDate] = useState<string>('2026-10-12');
  const [attendanceSlot, setAttendanceSlot] = useState<string>('09:00 - 10:00');

  // Filter students belonging to this Department Booth
  const boothStudents = useMemo(
    () => studentsList.filter((s) => s.department_code === activeBoothDept.department_code),
    [studentsList, activeBoothDept.department_code]
  );

  // Local attendance marking map for the current session: student_id -> 'PRESENT' | 'ABSENT' | 'LATE'
  const [sessionMarks, setSessionMarks] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  // Schedule Class/Exam Form state (for Faculty/Admin)
  const [newClassCourse, setNewClassCourse] = useState<string>(deptCourses[0]?.course_code || '');
  const [newClassType, setNewClassType] = useState<CustomScheduledClass['session_type']>('Lecture');
  const [newClassDay, setNewClassDay] = useState<string>('Wednesday');
  const [newClassSlot, setNewClassSlot] = useState<string>('11:15 - 12:15');
  const [newClassRoom, setNewClassRoom] = useState<string>(
    activeBoothDept.classrooms[0]?.room_id || ''
  );

  // Sync default course selection when booth changes
  React.useEffect(() => {
    if (deptCourses[0]) {
      setSelectedCourseCode(deptCourses[0].course_code);
      setNewClassCourse(deptCourses[0].course_code);
    }
    if (activeBoothDept.classrooms[0]) {
      setNewClassRoom(activeBoothDept.classrooms[0].room_id);
    }
    const initialMap: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
    boothStudents.forEach((stu) => {
      initialMap[stu.student_id] = stu.attendance_percentage < 72 ? 'ABSENT' : 'PRESENT';
    });
    setSessionMarks(initialMap);
  }, [activeBoothDept.department_code, deptCourses, boothStudents.length]);

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    const next: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
    boothStudents.forEach((s) => {
      next[s.student_id] = status;
    });
    setSessionMarks(next);
  };

  const handleSaveAttendanceRegister = () => {
    const presentIds: string[] = [];
    const absentIds: string[] = [];
    const lateIds: string[] = [];

    boothStudents.forEach((s) => {
      const status = sessionMarks[s.student_id] || 'PRESENT';
      if (status === 'PRESENT') presentIds.push(s.student_id);
      else if (status === 'ABSENT') absentIds.push(s.student_id);
      else lateIds.push(s.student_id);
    });

    onUpdateStudentAttendance(
      activeBoothDept.department_code,
      selectedCourseCode,
      presentIds,
      absentIds,
      lateIds
    );
    setSavedBanner(
      `Attendance register committed for ${selectedCourseCode} (${attendanceDate} · ${attendanceSlot}): ${presentIds.length} Present, ${absentIds.length} Absent, ${lateIds.length} Late.`
    );
    setTimeout(() => setSavedBanner(null), 4000);
  };

  const lectureSchedule = useMemo(
    () => solveCSPSchedule(db, 'LECTURE_TIMETABLE', activeBoothDept.department_code),
    [db, activeBoothDept.department_code]
  );

  const examSchedule = useMemo(
    () => solveCSPSchedule(db, 'EXAM_HALL_ALLOCATION', activeBoothDept.department_code),
    [db, activeBoothDept.department_code]
  );

  const boothCustomClasses = useMemo(
    () => customClasses.filter((c) => c.department_code === activeBoothDept.department_code),
    [customClasses, activeBoothDept.department_code]
  );

  const boothAttendanceHistory = useMemo(
    () => attendanceSessions.filter((a) => a.department_code === activeBoothDept.department_code),
    [attendanceSessions, activeBoothDept.department_code]
  );

  const handleCreateClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const courseObj =
      deptCourses.find((c) => c.course_code === newClassCourse) || deptCourses[0];
    if (!courseObj) return;

    const item: CustomScheduledClass = {
      id: `CLS-${activeBoothDept.department_code}-${Date.now().toString().slice(-4)}`,
      department_code: activeBoothDept.department_code,
      department_name: activeBoothDept.department_name,
      semester: courseObj.semester,
      course_code: courseObj.course_code,
      course_title: courseObj.title,
      session_type: newClassType,
      day_or_date: newClassDay,
      time_slot: newClassSlot,
      room_id: newClassRoom,
      faculty_id: role === 'FACULTY' ? loggedInFaculty.faculty_id : courseObj.assigned_faculty_id,
      faculty_name: role === 'FACULTY' ? loggedInFaculty.name : courseObj.assigned_faculty_name,
    };
    onAddCustomClass(item);
  };

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {activeBoothDept.department_name} ({activeBoothDept.department_code} Booth) — Attendance & Class Operations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeBoothDept.school_block} · Head of Department: {activeBoothDept.hod_name}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('ATTENDANCE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'ATTENDANCE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attendance Register
          </button>
          <button
            type="button"
            onClick={() => setSubTab('CLASSES_SCHEDULE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'CLASSES_SCHEDULE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Classes Timetable ({lectureSchedule.allocations.length + boothCustomClasses.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('EXAMS_SCHEDULE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'EXAMS_SCHEDULE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Exam Hall Schedule ({examSchedule.allocations.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: ATTENDANCE TAKING & MANAGEMENT */}
      {subTab === 'ATTENDANCE' && (
        <div className="space-y-6">
          {/* Student Personal Attendance View when in STUDENT Role */}
          {role === 'STUDENT' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    My Personal Attendance Ledger — {loggedInStudent.full_name} ({loggedInStudent.student_id})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {loggedInStudent.department} · Semester {loggedInStudent.current_semester} · Statutory Minimum Required: 75.0%
                  </p>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-xs text-slate-500">Cumulative Attendance</div>
                  <div
                    className={`text-2xl font-bold ${
                      loggedInStudent.attendance_percentage < 75
                        ? 'text-red-600'
                        : 'text-emerald-700'
                    }`}
                  >
                    {loggedInStudent.attendance_percentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2.5 px-4">Course Code</th>
                      <th className="py-2.5 px-4">Course Title</th>
                      <th className="py-2.5 px-4">Instructor</th>
                      <th className="py-2.5 px-4 text-right">Conducted Classes</th>
                      <th className="py-2.5 px-4 text-right">Attended</th>
                      <th className="py-2.5 px-4 text-right">Course Attendance %</th>
                      <th className="py-2.5 px-4">Eligibility Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {deptCourses.map((course, idx) => {
                      const conducted = 36 + (idx % 4) * 2;
                      const ratio = Math.min(
                        1,
                        Math.max(0.5, (loggedInStudent.attendance_percentage + ((idx % 3) - 1) * 1.8) / 100)
                      );
                      const attended = Math.round(conducted * ratio);
                      const pct = Number(((attended / conducted) * 100).toFixed(1));
                      return (
                        <tr key={course.course_code} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                            {course.course_code}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900">{course.title}</td>
                          <td className="py-3 px-4 text-slate-600">{course.assigned_faculty_name}</td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                            {conducted}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 font-semibold">
                            {attended}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-bold">
                            <span className={pct < 75 ? 'text-red-600' : 'text-emerald-700'}>
                              {pct.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {pct >= 75 ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Eligible for Exam</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-700 font-medium">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Shortage Warning (&lt;75%)</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Faculty & Admin Live Attendance Roll-Call & Management */}
          {role !== 'STUDENT' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Live Roll-Call & Attendance Management ({activeBoothDept.department_code} Booth)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mark student attendance for any lecture or laboratory session. Submitting updates cumulative attendance percentages and recalculates statutory risk flags immediately.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMarkAll('PRESENT')}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md cursor-pointer whitespace-nowrap"
                  >
                    Mark All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAll('ABSENT')}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md cursor-pointer whitespace-nowrap"
                  >
                    Mark All Absent
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAttendanceRegister}
                    className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Commit Attendance Register</span>
                  </button>
                </div>
              </div>

              {savedBanner && (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{savedBanner}</span>
                </div>
              )}

              {/* Session Configuration Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Departmental Course
                  </label>
                  <select
                    value={selectedCourseCode}
                    onChange={(e) => setSelectedCourseCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
                  >
                    {deptCourses.map((c) => (
                      <option key={c.course_code} value={c.course_code}>
                        {c.course_code} — {c.title} (Sem {c.semester})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Session Date
                  </label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Lecture / Lab Time Slot
                  </label>
                  <select
                    value={attendanceSlot}
                    onChange={(e) => setAttendanceSlot(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono"
                  >
                    <option value="09:00 - 10:00">09:00 - 10:00</option>
                    <option value="10:00 - 11:00">10:00 - 11:00</option>
                    <option value="11:15 - 12:15">11:15 - 12:15</option>
                    <option value="13:15 - 14:15">13:15 - 14:15</option>
                    <option value="14:15 - 15:15">14:15 - 15:15</option>
                  </select>
                </div>
              </div>

              {/* Roll-Call Student Roster Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-3 px-4">Student ID</th>
                      <th className="py-3 px-4">Full Name</th>
                      <th className="py-3 px-4 text-right">Semester</th>
                      <th className="py-3 px-4 text-right">Cumulative Attendance</th>
                      <th className="py-3 px-4">Statutory Standing</th>
                      <th className="py-3 px-4 text-right">Mark Session Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {boothStudents.map((stu) => {
                      const mark = sessionMarks[stu.student_id] || 'PRESENT';
                      return (
                        <tr key={stu.student_id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                            {stu.student_id}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-900">{stu.full_name}</td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                            Sem {stu.current_semester}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold">
                            <span
                              className={
                                stu.attendance_percentage < 75.0
                                  ? 'text-red-600'
                                  : 'text-emerald-700'
                              }
                            >
                              {stu.attendance_percentage.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            {stu.attendance_percentage < 75.0 ? (
                              <span className="text-red-700 font-medium">Below 75% Floor</span>
                            ) : (
                              <span className="text-emerald-700 font-medium">Good Standing</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 rounded-md">
                              {(['PRESENT', 'LATE', 'ABSENT'] as const).map((statusOption) => (
                                <button
                                  key={statusOption}
                                  type="button"
                                  onClick={() =>
                                    setSessionMarks((prev) => ({
                                      ...prev,
                                      [stu.student_id]: statusOption,
                                    }))
                                  }
                                  className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors cursor-pointer ${
                                    mark === statusOption
                                      ? statusOption === 'PRESENT'
                                        ? 'bg-emerald-700 text-white'
                                        : statusOption === 'LATE'
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-red-600 text-white'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  {statusOption}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Logged Attendance Sessions in this Booth */}
              {boothAttendanceHistory.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-800 mb-2">
                    Recently Committed Attendance Logs ({activeBoothDept.department_code} Booth)
                  </h4>
                  <div className="space-y-2">
                    {boothAttendanceHistory.map((sess) => (
                      <div
                        key={sess.id}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-900">{sess.course_code}</span>
                          <span className="mx-2 text-slate-400">·</span>
                          <span className="text-slate-800">{sess.date} ({sess.time_slot})</span>
                          <span className="mx-2 text-slate-400">·</span>
                          <span className="text-slate-500">Marked by {sess.marked_by_faculty_name}</span>
                        </div>
                        <div className="font-mono tabular-nums text-slate-700">
                          Present: <span className="text-emerald-700 font-semibold">{sess.present_student_ids.length}</span> · Absent: <span className="text-red-600 font-semibold">{sess.absent_student_ids.length}</span> · Late: {sess.late_student_ids.length}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: CLASSES SCHEDULING & TIMETABLE */}
      {subTab === 'CLASSES_SCHEDULE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className={`${role !== 'STUDENT' ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white border border-slate-200 rounded-xl overflow-hidden`}>
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {activeBoothDept.department_name} — Weekly Classes & Laboratory Timetable
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conflict-free classroom and laboratory schedule for the {activeBoothDept.department_code} booth.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[540px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 text-slate-600">
                  <tr>
                    <th className="py-3 px-4">Course & Title</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Day</th>
                    <th className="py-3 px-4">Time Slot</th>
                    <th className="py-3 px-4">Classroom / Lab</th>
                    <th className="py-3 px-4">Instructor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {boothCustomClasses.map((custom) => (
                    <tr key={custom.id} className="bg-emerald-50/40 hover:bg-emerald-50">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900">{custom.course_code}</span>
                        <span className="mx-1.5 text-slate-400">·</span>
                        <span className="font-medium text-slate-900">{custom.course_title}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-800">
                        {custom.session_type} (Added)
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">{custom.day_or_date}</td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-800">{custom.time_slot}</td>
                      <td className="py-3 px-4 font-mono text-slate-900">{custom.room_id}</td>
                      <td className="py-3 px-4 text-slate-700">{custom.faculty_name}</td>
                    </tr>
                  ))}
                  {lectureSchedule.allocations.map((item) => (
                    <tr key={item.allocation_id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-slate-900">{item.course_code}</span>
                        <span className="mx-1.5 text-slate-400">·</span>
                        <span className="text-slate-800">{item.course_title}</span>
                        <div className="text-slate-500">Semester {item.semester}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{item.session_type}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{item.day}</td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">{item.time_slot}</td>
                      <td className="py-3 px-4 font-mono text-slate-800">{item.room_id}</td>
                      <td className="py-3 px-4 text-slate-700">{item.faculty_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {role !== 'STUDENT' && (
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-900 pb-3 mb-4 border-b border-slate-200">
                Schedule Additional Class or Exam Slot
              </h3>
              <form onSubmit={handleCreateClassSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Course</label>
                  <select
                    value={newClassCourse}
                    onChange={(e) => setNewClassCourse(e.target.value)}
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
                  <label className="block font-medium text-slate-700 mb-1">Session Type</label>
                  <select
                    value={newClassType}
                    onChange={(e) =>
                      setNewClassType(e.target.value as CustomScheduledClass['session_type'])
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="Lecture">Extra Lecture Session</option>
                    <option value="Laboratory">Remedial Laboratory Session</option>
                    <option value="Mid-Term Exam">Mid-Term Continuous Assessment</option>
                    <option value="End-Semester Exam">Practical Viva / Exam</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Day / Date</label>
                    <input
                      type="text"
                      value={newClassDay}
                      onChange={(e) => setNewClassDay(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Time Slot</label>
                    <input
                      type="text"
                      value={newClassSlot}
                      onChange={(e) => setNewClassSlot(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Allocated Classroom / Hall
                  </label>
                  <select
                    value={newClassRoom}
                    onChange={(e) => setNewClassRoom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                  >
                    {activeBoothDept.classrooms.map((r) => (
                      <option key={r.room_id} value={r.room_id}>
                        {r.room_id} ({r.room_type} · Cap {r.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish to {activeBoothDept.department_code} Timetable</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: EXAMS SCHEDULE */}
      {subTab === 'EXAMS_SCHEDULE' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {activeBoothDept.department_name} — End-Semester Examination Hall & Invigilation Roster
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Conflict-free exam dates, sessions, auditorium bench capacities, and assigned invigilators.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-3 px-4">Exam Code & Course</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4">Examination Date</th>
                  <th className="py-3 px-4">Session Timing</th>
                  <th className="py-3 px-4">Exam Auditorium / Hall</th>
                  <th className="py-3 px-4">Chief Invigilator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {examSchedule.allocations.map((exam) => (
                  <tr key={exam.allocation_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900">{exam.course_code}</span>
                      <span className="mx-1.5 text-slate-400">·</span>
                      <span className="font-medium text-slate-900">{exam.course_title}</span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                      Semester {exam.semester}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{exam.day}</td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">{exam.time_slot}</td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-800">
                      {exam.room_id} ({exam.enrolled_students}/{exam.room_capacity} benches)
                    </td>
                    <td className="py-3 px-4 text-slate-700">{exam.faculty_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
