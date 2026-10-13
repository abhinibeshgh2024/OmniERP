import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Search,
  AlertTriangle,
} from 'lucide-react';
import {
  OmniERPDatabase,
  StudentRecord,
} from '../data/datasetGenerator';
import { LeaveApplication } from '../data/operationalStore';
import { LivePipelineExecutionEvent } from '../services/pipelineOrchestrator';
import { NLQRouterModule } from './NLQRouterModule';
import { EarlyWarningModule } from './EarlyWarningModule';
import { OBEComplianceModule } from './OBEComplianceModule';
import { DatasetAndFastAPIModule } from './DatasetAndFastAPIModule';

interface AdminGovernancePortalProps {
  db: OmniERPDatabase;
  studentsList: StudentRecord[];
  leaves: LeaveApplication[];
  onSelectBooth: (deptCode: string) => void;
  onUpdateFeeStatus: (studentId: string, newFeeStatus: StudentRecord['fee_payment_status']) => void;
  onReviewLeave: (
    leaveId: string,
    status: 'Approved' | 'Rejected',
    reviewerName: string,
    remarks: string
  ) => void;
  onExportFullJSON: () => void;
  pipelineEvents?: LivePipelineExecutionEvent[];
  onResetFactoryState?: () => void;
}

export const AdminGovernancePortal: React.FC<AdminGovernancePortalProps> = ({
  db,
  studentsList,
  leaves,
  onSelectBooth,
  onUpdateFeeStatus,
  onReviewLeave,
  onExportFullJSON,
  pipelineEvents = [],
  onResetFactoryState,
}) => {
  const [adminSection, setAdminSection] = useState<
    | 'ALL_20_BOOTHS'
    | 'STUDENT_FEE_REGISTRY'
    | 'NLQ_COMMAND_ROUTER'
    | 'EARLY_WARNING_ENGINE'
    | 'OBE_ACCREDITATION'
    | 'FASTAPI_AND_DATASET'
  >('ALL_20_BOOTHS');

  const [studentSearch, setStudentSearch] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  const filteredStudents = studentsList.filter((s) => {
    if (deptFilter !== 'ALL' && s.department_code !== deptFilter) return false;
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      return (
        s.student_id.toLowerCase().includes(q) ||
        s.full_name.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingLeaves = leaves.filter((l) => l.status === 'Pending');

  return (
    <div className="space-y-6">
      {/* Admin Sub-Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Usha Martin University, Ranchi — Central Administration & Multi-Booth Governance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervise all 20 Academic Department Booths, 200 Faculty, and 300 Students, or launch intelligent Martinet ERP engines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {(
            [
              { id: 'ALL_20_BOOTHS', label: '20 Dept Booths & Approvals' },
              { id: 'STUDENT_FEE_REGISTRY', label: 'Student & Fee Registry (300)' },
              { id: 'NLQ_COMMAND_ROUTER', label: 'NLQ Command Router' },
              { id: 'EARLY_WARNING_ENGINE', label: 'Early Warning Engine' },
              { id: 'OBE_ACCREDITATION', label: 'OBE Compliance' },
              { id: 'FASTAPI_AND_DATASET', label: 'Pipelines & Dataset' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAdminSection(item.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                adminSection === item.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: ALL 20 DEPARTMENT BOOTHS DIRECTORY + CENTRAL LEAVE APPROVALS */}
      {adminSection === 'ALL_20_BOOTHS' && (
        <div className="space-y-8">
          {/* Grid of 20 Department Booths */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="pb-4 mb-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  All 20 Academic Department Booths (Click any Booth to Enter & Operate)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Students are restricted strictly to their enrolled booth. Faculty and Institute Admins can enter and manage any booth below.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-600 tabular-nums">
                20 Booths · 200 Faculty · 300 Students
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {db.departments.map((dept) => {
                const deptStu = studentsList.filter(
                  (s) => s.department_code === dept.department_code
                );
                const atRiskCount = deptStu.filter((s) => s.risk_status).length;
                const deptPendingLeaves = leaves.filter(
                  (l) => l.department_code === dept.department_code && l.status === 'Pending'
                ).length;

                return (
                  <div
                    key={dept.department_code}
                    onClick={() => onSelectBooth(dept.department_code)}
                    className="p-4 rounded-lg border border-slate-200 hover:border-slate-900 bg-slate-50/60 hover:bg-white transition-colors cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1">
                        <span className="font-bold text-slate-900">{dept.department_code} BOOTH</span>
                        <span>{dept.department_id}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {dept.department_name}
                      </h4>
                      <div className="text-xs text-slate-500 mt-1 truncate">
                        HOD: {dept.hod_name}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-mono tabular-nums">
                      <span className="text-slate-600">
                        10 Fac · 15 Stu ·{' '}
                        <span className={atRiskCount > 0 ? 'text-red-600 font-semibold' : ''}>
                          {atRiskCount} Risk
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-0.5 font-sans font-semibold text-slate-900">
                        <span>Enter</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    {deptPendingLeaves > 0 && (
                      <div className="mt-1.5 text-[11px] text-amber-700 font-medium">
                        {deptPendingLeaves} Pending Leave Application(s)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Central Pending Leave Approvals Queue across all 20 Booths */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Institute-Wide Pending Leave Approvals ({pendingLeaves.length} Pending)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Central Registrar queue for sanctioning Student Medical/Academic Condonation Leaves and Faculty Duty Leaves across all 20 booths.
                </p>
              </div>
            </div>

            {pendingLeaves.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                All pending leave applications across all 20 departments have been processed.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-3 px-4">Applicant</th>
                      <th className="py-3 px-4">Department Booth</th>
                      <th className="py-3 px-4">Category & Dates</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4 text-right">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pendingLeaves.map((lv) => (
                      <tr key={lv.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-900">{lv.applicant_id}</div>
                          <div className="font-medium text-slate-800">{lv.applicant_name}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{lv.department_code}</div>
                          <div className="text-slate-500">{lv.department_name}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{lv.leave_type}</div>
                          <div className="font-mono text-slate-500">
                            {lv.from_date} to {lv.to_date}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-md">{lv.reason}</td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                onReviewLeave(
                                  lv.id,
                                  'Approved',
                                  'Central Institute Registrar (Admin)',
                                  'Sanctioned by Central Administration.'
                                )
                              }
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onReviewLeave(
                                  lv.id,
                                  'Rejected',
                                  'Central Institute Registrar (Admin)',
                                  'Declined by Central Administration; documentation required.'
                                )
                              }
                              className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 text-red-700 font-semibold rounded cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: STUDENT & FEE CLEARANCE REGISTRY (300 STUDENTS) */}
      {adminSection === 'STUDENT_FEE_REGISTRY' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Institute Student & Tuition Fee Registry ({filteredStudents.length} of 300 Students)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update fee clearance status (`Paid`, `Pending`, `Overdue`, `Scholarship Hold`) or jump directly into any student’s Department Booth.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search ID or name..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
              >
                <option value="ALL">All 20 Departments</option>
                {db.departments.map((d) => (
                  <option key={d.department_code} value={d.department_code}>
                    {d.department_code} — {d.department_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 text-slate-600">
                <tr>
                  <th className="py-3 px-4">Student ID & Name</th>
                  <th className="py-3 px-4">Department Booth & Sem</th>
                  <th className="py-3 px-4 text-right">Attendance</th>
                  <th className="py-3 px-4 text-right">CGPA</th>
                  <th className="py-3 px-4">Standing</th>
                  <th className="py-3 px-4">Update Fee Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStudents.map((stu) => (
                  <tr key={stu.student_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{stu.student_id}</div>
                      <div className="font-medium text-slate-800">{stu.full_name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => onSelectBooth(stu.department_code)}
                        className="font-semibold text-slate-900 hover:underline cursor-pointer"
                      >
                        {stu.department} ({stu.department_code} Booth)
                      </button>
                      <div className="text-slate-500">Semester {stu.current_semester}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <span
                        className={
                          stu.attendance_percentage < 75
                            ? 'text-red-600 font-bold'
                            : 'text-slate-900'
                        }
                      >
                        {stu.attendance_percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <span className={stu.cgpa < 6.0 ? 'text-red-600 font-bold' : 'text-slate-900'}>
                        {stu.cgpa.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {stu.risk_status ? (
                        <span className="inline-flex items-center gap-1 text-red-700 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>At-Risk</span>
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Good Standing</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={stu.fee_payment_status}
                        onChange={(e) =>
                          onUpdateFeeStatus(
                            stu.student_id,
                            e.target.value as StudentRecord['fee_payment_status']
                          )
                        }
                        className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-medium text-slate-900"
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Overdue">Overdue</option>
                        <option value="Scholarship Hold">Scholarship Hold</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: NLQ COMMAND ROUTER */}
      {adminSection === 'NLQ_COMMAND_ROUTER' && <NLQRouterModule db={db} />}

      {/* SECTION 4: EARLY WARNING ENGINE */}
      {adminSection === 'EARLY_WARNING_ENGINE' && <EarlyWarningModule db={db} />}

      {/* SECTION 5: OBE COMPLIANCE */}
      {adminSection === 'OBE_ACCREDITATION' && <OBEComplianceModule db={db} />}

      {/* SECTION 6: PIPELINES & DATASET */}
      {adminSection === 'FASTAPI_AND_DATASET' && (
        <DatasetAndFastAPIModule
          db={db}
          onExportFullJSON={onExportFullJSON}
          pipelineEvents={pipelineEvents}
          onResetFactoryState={onResetFactoryState}
        />
      )}
    </div>
  );
};
