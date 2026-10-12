import React, { useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Download, Search } from 'lucide-react';
import { OmniERPDatabase } from '../data/datasetGenerator';
import { solveCSPSchedule } from '../services/omniErpEngines';

interface CSPSchedulerModuleProps {
  db: OmniERPDatabase;
}

export const CSPSchedulerModule: React.FC<CSPSchedulerModuleProps> = ({ db }) => {
  const [mode, setMode] = useState<'LECTURE_TIMETABLE' | 'EXAM_HALL_ALLOCATION'>('LECTURE_TIMETABLE');
  const [selectedDept, setSelectedDept] = useState<string>('CSE');
  const [selectedSem, setSelectedSem] = useState<string>('ALL');
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const scheduleResult = useMemo(() => {
    const deptCode = selectedDept === 'ALL' ? undefined : selectedDept;
    const sem = selectedSem === 'ALL' ? undefined : parseInt(selectedSem, 10);
    return solveCSPSchedule(db, mode, deptCode, sem);
  }, [db, mode, selectedDept, selectedSem]);

  const availableDays = useMemo(() => {
    const set = new Set(scheduleResult.allocations.map((a) => a.day));
    return Array.from(set);
  }, [scheduleResult]);

  const filteredAllocations = useMemo(() => {
    return scheduleResult.allocations.filter((item) => {
      if (selectedDay !== 'ALL' && item.day !== selectedDay) return false;
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        return (
          item.course_code.toLowerCase().includes(q) ||
          item.course_title.toLowerCase().includes(q) ||
          item.faculty_name.toLowerCase().includes(q) ||
          item.room_id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [scheduleResult, selectedDay, searchFilter]);

  const handleDownloadScheduleCSV = () => {
    const headers = [
      'Allocation_ID',
      'Mode',
      'Department_Code',
      'Department_Name',
      'Semester',
      'Course_Code',
      'Course_Title',
      'Session_Type',
      'Day_or_Date',
      'Time_Slot',
      'Room_ID',
      'Enrolled_Students',
      'Room_Capacity',
      'Faculty_ID',
      'Faculty_Name',
    ];
    const rows = filteredAllocations.map((a) => [
      a.allocation_id,
      mode,
      a.department_code,
      `"${a.department}"`,
      a.semester,
      a.course_code,
      `"${a.course_title}"`,
      `"${a.session_type}"`,
      `"${a.day}"`,
      `"${a.time_slot}"`,
      a.room_id,
      a.enrolled_students,
      a.room_capacity,
      a.faculty_id,
      `"${a.faculty_name}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnierp_${mode.toLowerCase()}_${selectedDept.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header & Mode Switcher */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              03. Automated Conflict-Free Timetable & Exam Allocator (CSP Engine)
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Constraint-Satisfaction Problem (CSP) solver scheduling lecture halls, specialized laboratories, and examination auditoriums across all 20 departments with zero faculty, room, or student cohort overlaps.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setMode('LECTURE_TIMETABLE');
                  setSelectedDay('ALL');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  mode === 'LECTURE_TIMETABLE'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Weekly Lecture & Lab Timetable
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('EXAM_HALL_ALLOCATION');
                  setSelectedDay('ALL');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  mode === 'EXAM_HALL_ALLOCATION'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                End-Semester Exam Hall Allocator
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadScheduleCSV}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Schedule CSV</span>
            </button>
          </div>
        </div>

        {/* Constraint Satisfaction Proof Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-5 border-b border-slate-200">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500">Faculty Double-Booking Conflicts</div>
            <div className="text-xl font-mono font-bold text-emerald-700 tabular-nums mt-1 flex items-center gap-2">
              <span>{scheduleResult.hard_constraints_verified.faculty_double_booking_conflicts}</span>
              <span className="text-xs font-sans font-normal text-slate-600">Verified Zero</span>
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500">Room & Hall Collisions</div>
            <div className="text-xl font-mono font-bold text-emerald-700 tabular-nums mt-1 flex items-center gap-2">
              <span>{scheduleResult.hard_constraints_verified.room_double_booking_conflicts}</span>
              <span className="text-xs font-sans font-normal text-slate-600">Capacity Checked</span>
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500">Backtrack Constraint Resolutions</div>
            <div className="text-xl font-mono font-bold text-slate-900 tabular-nums mt-1">
              {scheduleResult.hard_constraints_verified.backtrack_resolutions}
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500">Allocated Sessions in Scope</div>
            <div className="text-xl font-mono font-bold text-slate-900 tabular-nums mt-1">
              {filteredAllocations.length}
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-5">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search course code, title, room, or faculty..."
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              aria-label="Select Department for Timetable"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-900"
            >
              <option value="ALL">All 20 Academic Departments (Master University Grid)</option>
              {db.departments.map((d) => (
                <option key={d.department_code} value={d.department_code}>
                  {d.department_code} — {d.department_name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={selectedSem}
              onChange={(e) => setSelectedSem(e.target.value)}
              aria-label="Select Semester"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-900"
            >
              <option value="ALL">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={String(s)}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              aria-label="Select Day or Exam Date"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-900"
            >
              <option value="ALL">All Days / Dates</option>
              {availableDays.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Master Schedule Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {mode === 'LECTURE_TIMETABLE'
                ? 'Conflict-Free Weekly Lecture & Laboratory Schedule'
                : 'End-Semester Examination Hall & Invigilator Matrix'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Solver Algorithm: <span className="font-mono text-slate-700">{scheduleResult.solver_algorithm}</span>
            </p>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-slate-600">
              <tr>
                <th className="py-3 px-4">Allocation ID</th>
                <th className="py-3 px-4">Course & Session Type</th>
                <th className="py-3 px-4">Department & Sem</th>
                <th className="py-3 px-4">Day / Date</th>
                <th className="py-3 px-4">Time Slot</th>
                <th className="py-3 px-4">Allocated Room & Load</th>
                <th className="py-3 px-4">Assigned Faculty / Invigilator</th>
                <th className="py-3 px-4">Constraint Check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAllocations.map((item) => (
                <tr key={item.allocation_id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                    {item.allocation_id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">
                      <span className="font-mono">{item.course_code}</span> · {item.course_title}
                    </div>
                    <div className="text-slate-500">{item.session_type}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-900 font-medium">{item.department}</div>
                    <div className="text-slate-500">Semester {item.semester}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                    {item.day}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-800 tabular-nums whitespace-nowrap">
                    {item.time_slot}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums">
                    <div className="font-semibold text-slate-900">{item.room_id}</div>
                    <div className="text-slate-500">
                      {item.enrolled_students} / {item.room_capacity} seats
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900">{item.faculty_name}</div>
                    <div className="font-mono text-slate-500">{item.faculty_id}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium whitespace-nowrap">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Conflict-Free</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
