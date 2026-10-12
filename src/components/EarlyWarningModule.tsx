import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Search,
  ShieldAlert,
  CheckCircle2,
  Download,
  Mail,
  Copy,
  Check,
} from 'lucide-react';
import { OmniERPDatabase } from '../data/datasetGenerator';
import {
  runEarlyWarningAnalytics,
  StudentRiskAssessment,
} from '../services/omniErpEngines';

interface EarlyWarningModuleProps {
  db: OmniERPDatabase;
}

export const EarlyWarningModule: React.FC<EarlyWarningModuleProps> = ({ db }) => {
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedSem, setSelectedSem] = useState<string>('ALL');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'AT_RISK' | 'CRITICAL' | 'WATCHLIST'>('AT_RISK');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<StudentRiskAssessment | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const analytics = useMemo(() => {
    const deptCode = selectedDept === 'ALL' ? undefined : selectedDept;
    const sem = selectedSem === 'ALL' ? undefined : parseInt(selectedSem, 10);
    return runEarlyWarningAnalytics(db, deptCode, sem, false);
  }, [db, selectedDept, selectedSem]);

  const filteredInterventions = useMemo(() => {
    return analytics.prioritized_interventions.filter((stu) => {
      if (tierFilter === 'AT_RISK' && !stu.risk_status) return false;
      if (tierFilter === 'CRITICAL' && stu.severity_tier !== 'CRITICAL') return false;
      if (tierFilter === 'WATCHLIST' && stu.severity_tier !== 'WATCHLIST') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          stu.full_name.toLowerCase().includes(q) ||
          stu.student_id.toLowerCase().includes(q) ||
          stu.department.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [analytics, tierFilter, searchQuery]);

  const activeStudent = selectedStudent || filteredInterventions[0] || null;

  const handleExportInterventionCSV = () => {
    const headers = [
      'Student_ID',
      'Full_Name',
      'Department',
      'Semester',
      'Attendance_Pct',
      'CGPA',
      'Continuous_Eval',
      'Risk_Status_Boolean',
      'Composite_Risk_Score',
      'Severity_Tier',
      'Fee_Status',
      'Assigned_Advisor',
      'Recommended_Intervention',
    ];
    const rows = filteredInterventions.map((s) => [
      s.student_id,
      `"${s.full_name}"`,
      `"${s.department}"`,
      s.current_semester,
      s.attendance_percentage,
      s.cgpa,
      s.continuous_eval_score,
      s.risk_status,
      s.composite_risk_score,
      s.severity_tier,
      s.fee_payment_status,
      `"${s.advisor_name}"`,
      `"${s.recommended_intervention}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnierp_early_warning_interventions_${selectedDept.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyInterventionDirective = (stu: StudentRiskAssessment) => {
    const text = `INTERVENTION DIRECTIVE — ${stu.student_id} (${stu.full_name})
Department: ${stu.department} (Semester ${stu.current_semester})
Statutory Risk Flag: ${stu.risk_status ? 'TRUE' : 'FALSE'} | Composite Risk Index: ${stu.composite_risk_score}/100
Metrics: Attendance ${stu.attendance_percentage}% | CGPA ${stu.cgpa.toFixed(2)} | Continuous Eval ${stu.continuous_eval_score}/100
Assigned Advisor: ${stu.advisor_name} (${stu.advisor_email})
Action Required: ${stu.recommended_intervention}`;
    navigator.clipboard.writeText(text);
    setCopiedId(stu.student_id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header & Filter Bar */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              02. Predictive Early Warning & Multi-Factor Risk Engine
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Automated vulnerability audit scanning all 300 student records across 20 departments. Flags statutory risk (<span className="font-mono text-xs">attendance &lt; 75%</span> or <span className="font-mono text-xs">CGPA &lt; 6.0</span>) and computes composite intervention priorities for Department Heads.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleExportInterventionCSV}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Intervention List (CSV)</span>
            </button>
          </div>
        </div>

        {/* Multi-Dimensional Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-5 items-center">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student ID, name, or department..."
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              aria-label="Filter by Department"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-900"
            >
              <option value="ALL">All 20 Academic Departments</option>
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
              aria-label="Filter by Semester"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-900"
            >
              <option value="ALL">All Semesters (1–8)</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={String(sem)}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'AT_RISK', label: 'Flagged Risk' },
                { id: 'CRITICAL', label: 'Critical' },
                { id: 'ALL', label: 'All (300)' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTierFilter(tab.id)}
                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  tierFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Split: Prioritized Student Intervention Queue + Selected Student Diagnostic Brief */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Prioritized Student Intervention Queue ({filteredInterventions.length} students)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sorted descending by Multi-Factor Composite Risk Score (Attendance 40% · CGPA 35% · Continuous Eval 15% · Assignments 10%).
              </p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-slate-600">
                <tr>
                  <th className="py-3 px-4">Student Profile</th>
                  <th className="py-3 px-4">Department & Sem</th>
                  <th className="py-3 px-4 text-right">Attendance</th>
                  <th className="py-3 px-4 text-right">CGPA</th>
                  <th className="py-3 px-4 text-right">Cont. Eval</th>
                  <th className="py-3 px-4 text-right">Risk Score</th>
                  <th className="py-3 px-4">Risk Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredInterventions.map((stu) => {
                  const isSelected = activeStudent?.student_id === stu.student_id;
                  return (
                    <tr
                      key={stu.student_id}
                      onClick={() => setSelectedStudent(stu)}
                      className={`transition-colors cursor-pointer ${
                        isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-900 tabular-nums">
                          {stu.student_id}
                        </div>
                        <div className="text-slate-700 font-medium">{stu.full_name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{stu.department}</div>
                        <div className="text-slate-500">
                          Semester {stu.current_semester} · Fee: {stu.fee_payment_status}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <span
                          className={
                            stu.attendance_percentage < 75.0
                              ? 'text-red-600 font-semibold'
                              : 'text-slate-900'
                          }
                        >
                          {stu.attendance_percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <span
                          className={
                            stu.cgpa < 6.0 ? 'text-red-600 font-semibold' : 'text-slate-900'
                          }
                        >
                          {stu.cgpa.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {stu.continuous_eval_score.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                        {stu.composite_risk_score.toFixed(1)}
                      </td>
                      <td className="py-3 px-4">
                        {stu.risk_status ? (
                          <span className="inline-flex items-center gap-1 text-red-700 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>true ({stu.severity_tier})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>false</span>
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

        {/* HOD Diagnostic & Intervention Brief Panel */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                HOD Intervention Dossier
              </h3>
              <p className="text-xs text-slate-500">Multi-Factor Risk Breakdown</p>
            </div>
            {activeStudent && (
              <button
                type="button"
                onClick={() => handleCopyInterventionDirective(activeStudent)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedId === activeStudent.student_id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Brief</span>
                  </>
                )}
              </button>
            )}
          </div>

          {activeStudent ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {activeStudent.student_id}
                  </span>
                  <span
                    className={`font-mono font-semibold ${
                      activeStudent.risk_status ? 'text-red-700' : 'text-emerald-700'
                    }`}
                  >
                    risk_status: {String(activeStudent.risk_status)}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-900">{activeStudent.full_name}</div>
                <div className="text-slate-600">
                  {activeStudent.department} · Semester {activeStudent.current_semester}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-slate-200">
                  <div className="text-slate-500">Attendance (Min 75%)</div>
                  <div
                    className={`text-lg font-mono font-bold tabular-nums mt-0.5 ${
                      activeStudent.attendance_percentage < 75 ? 'text-red-600' : 'text-slate-900'
                    }`}
                  >
                    {activeStudent.attendance_percentage.toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200">
                  <div className="text-slate-500">CGPA (Min 6.00)</div>
                  <div
                    className={`text-lg font-mono font-bold tabular-nums mt-0.5 ${
                      activeStudent.cgpa < 6.0 ? 'text-red-600' : 'text-slate-900'
                    }`}
                  >
                    {activeStudent.cgpa.toFixed(2)}
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200">
                  <div className="text-slate-500">Continuous Eval</div>
                  <div className="text-lg font-mono font-bold tabular-nums text-slate-900 mt-0.5">
                    {activeStudent.continuous_eval_score.toFixed(1)}/100
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200">
                  <div className="text-slate-500">Composite Risk Score</div>
                  <div className="text-lg font-mono font-bold tabular-nums text-slate-900 mt-0.5">
                    {activeStudent.composite_risk_score.toFixed(1)}/100
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-900">Detected Risk Triggers:</div>
                {activeStudent.risk_triggers.length > 0 ? (
                  <ul className="space-y-1 text-red-700 font-medium">
                    {activeStudent.risk_triggers.map((t) => (
                      <li key={t} className="flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-emerald-700">No statutory risk thresholds breached.</div>
                )}
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                <div className="text-slate-500">Recommended HOD & Advisor Protocol:</div>
                <div className="font-semibold text-slate-900 leading-relaxed">
                  {activeStudent.recommended_intervention}
                </div>
                <div className="pt-2 mt-2 border-t border-slate-100 text-slate-600">
                  Assigned Advisor: <span className="font-medium text-slate-900">{activeStudent.advisor_name}</span> ({activeStudent.advisor_faculty_id})
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Select any student row to inspect their risk profile.</p>
          )}
        </div>
      </div>

      {/* 20-Department Risk Summary Matrix */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">
            Departmental Early Warning Audit Across All 20 Academic Units
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any department row to filter the intervention queue to that specific school or department.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4">Code & Department Name</th>
                <th className="py-3 px-4">Head of Department (HOD)</th>
                <th className="py-3 px-4 text-right">Cohort Size</th>
                <th className="py-3 px-4 text-right">Flagged At-Risk</th>
                <th className="py-3 px-4 text-right">Critical Tier</th>
                <th className="py-3 px-4 text-right">Mean Attendance</th>
                <th className="py-3 px-4 text-right">Mean CGPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {analytics.department_risk_summary.map((dept) => (
                <tr
                  key={dept.department_code}
                  onClick={() =>
                    setSelectedDept(
                      selectedDept === dept.department_code ? 'ALL' : dept.department_code
                    )
                  }
                  className={`cursor-pointer transition-colors ${
                    selectedDept === dept.department_code ? 'bg-slate-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-2.5 px-4">
                    <span className="font-mono font-bold text-slate-900">{dept.department_code}</span>
                    <span className="mx-2 text-slate-400">·</span>
                    <span className="font-medium text-slate-900">{dept.department_name}</span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-700">{dept.hod_name}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                    {dept.total_students}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-red-600">
                    {dept.at_risk_count} / {dept.total_students}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-amber-700 font-medium">
                    {dept.critical_count}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800">
                    {dept.avg_attendance.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800">
                    {dept.avg_cgpa.toFixed(2)}
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
