import React, { useState } from 'react';
import {
  Search,
  Terminal,
  Mail,
  Copy,
  Check,
  ArrowRight,
  AlertTriangle,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { OmniERPDatabase } from '../data/datasetGenerator';
import {
  executeNLQPipeline,
  NLQExecutionResult,
  DraftEmailArtifact,
} from '../services/omniErpEngines';

interface NLQRouterModuleProps {
  db: OmniERPDatabase;
}

const PRESET_QUERIES = [
  {
    label: 'Law Attendance < 70% + Draft Emails',
    query: 'Find all law students with attendance under 70% and draft warning emails',
  },
  {
    label: 'CSE 7th Sem CO-PO Attainment',
    query: 'Generate CO-PO attainment report for Computer Science 7th sem',
  },
  {
    label: 'Physics Assistant Professors',
    query: 'List Assistant Professors in Department of Physics and their assigned courses',
  },
  {
    label: 'Overdue Fees & CGPA < 6.5',
    query: 'Find students with overdue fee status and CGPA under 6.5 and draft warning notice',
  },
  {
    label: 'Biotechnology Exam Hall Schedule',
    query: 'Generate conflict-free exam room schedule for Biotechnology',
  },
  {
    label: 'All At-Risk Mechanical Students',
    query: 'Find all Mechanical Engineering students at risk with attendance under 75% and draft emails',
  },
];

export const NLQRouterModule: React.FC<NLQRouterModuleProps> = ({ db }) => {
  const [queryInput, setQueryInput] = useState<string>(PRESET_QUERIES[0].query);
  const [result, setResult] = useState<NLQExecutionResult>(() =>
    executeNLQPipeline(db, PRESET_QUERIES[0].query)
  );
  const [selectedEmail, setSelectedEmail] = useState<DraftEmailArtifact | null>(
    () => executeNLQPipeline(db, PRESET_QUERIES[0].query).drafted_emails[0] || null
  );
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleRunQuery = (customQuery?: string) => {
    const q = (customQuery ?? queryInput).trim();
    if (!q) return;
    setIsExecuting(true);
    if (customQuery) setQueryInput(customQuery);

    const localData = executeNLQPipeline(db, q);
    setResult(localData);
    setSelectedEmail(localData.drafted_emails?.[0] || null);
    setIsExecuting(false);
  };

  const handleCopyEmail = (email: DraftEmailArtifact) => {
    navigator.clipboard.writeText(`To: ${email.recipient_email}\nSubject: ${email.subject}\n\n${email.body}`);
    setCopiedEmailId(email.student_id);
    setTimeout(() => setCopiedEmailId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Command Input Bar & Curated Presets */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              01. Natural Language Query & Command Router
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Deterministic 4-stage lexical and AST pipeline translating plain-English administrative directives into relational operations across 20 departments without external LLM API keys.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500 tabular-nums shrink-0">
            <span>Pipeline #05: NLQDirectivePipeline</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>Zero-API-Key Local AST</span>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunQuery();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Terminal className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="e.g., Find all law students with attendance under 70% and draft warning emails..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-slate-900 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isExecuting}
            className="px-5 py-3 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>{isExecuting ? 'Parsing AST...' : 'Execute Directive'}</span>
          </button>
        </form>

        {/* Interactive Preset Directives */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="text-xs font-medium text-slate-500 mb-2.5">
            Sample Natural Language Directives (Click to execute):
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_QUERIES.map((preset) => {
              const isActive = queryInput.toLowerCase() === preset.query.toLowerCase();
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleRunQuery(preset.query)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4-Stage Deterministic Pipeline Trace */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-200">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Deterministic Pipeline Execution Trace
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Resolved Intent: <span className="font-mono font-semibold text-slate-800">{result.detected_intent}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              Target Scope: <span className="font-medium text-slate-800">{result.matched_department || 'All 20 Academic Departments'}</span>
              {result.matched_semester && (
                <>
                  <span className="mx-2" aria-hidden="true">·</span>
                  <span>Semester {result.matched_semester}</span>
                </>
              )}
            </p>
          </div>
          <div className="text-xs font-mono text-slate-600 tabular-nums">
            Matched Records: <span className="font-semibold text-slate-900">{result.result_count}</span>
            {result.drafted_emails.length > 0 && (
              <>
                <span className="mx-2" aria-hidden="true">·</span>
                Drafted Advisory Emails: <span className="font-semibold text-slate-900">{result.drafted_emails.length}</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {result.pipeline_trace.map((stage) => (
            <div
              key={stage.stage_name}
              className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
                  <span className="font-semibold text-slate-800">{stage.stage_name}</span>
                  <span className="font-mono tabular-nums text-emerald-700">{stage.execution_ms} ms</span>
                </div>
                <pre className="text-[11px] font-mono text-slate-700 bg-white p-2.5 rounded border border-slate-200 overflow-x-auto leading-relaxed">
                  {JSON.stringify(stage.extracted_tokens, null, 2)}
                </pre>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
                <span>Stage Verified</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dynamic Output Workspace based on Detected Intent */}
      {result.student_records && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Student Query Results Table */}
          <div className={`${result.drafted_emails.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white border border-slate-200 rounded-xl overflow-hidden`}>
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Queried Student Cohort ({result.student_records.length} matched)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any student row to inspect or copy their synthesized statutory warning email.
                </p>
              </div>
            </div>

            {result.student_records.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm text-slate-600">No student records matched the specified threshold parameters.</p>
                <button
                  type="button"
                  onClick={() => handleRunQuery(PRESET_QUERIES[0].query)}
                  className="mt-3 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg cursor-pointer"
                >
                  Reset to Default Directive
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[540px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <tr className="text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Student ID & Name</th>
                      <th className="py-3 px-4">Department & Sem</th>
                      <th className="py-3 px-4 text-right">Attendance</th>
                      <th className="py-3 px-4 text-right">CGPA</th>
                      <th className="py-3 px-4">Standing</th>
                      <th className="py-3 px-4">Fee Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {result.student_records.map((stu) => {
                      const matchingEmail = result.drafted_emails.find(
                        (e) => e.student_id === stu.student_id
                      );
                      const isSelected = selectedEmail?.student_id === stu.student_id;
                      return (
                        <tr
                          key={stu.student_id}
                          onClick={() => matchingEmail && setSelectedEmail(matchingEmail)}
                          className={`transition-colors cursor-pointer ${
                            isSelected ? 'bg-slate-100/90' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-mono font-semibold text-slate-900 tabular-nums">
                              {stu.student_id}
                            </div>
                            <div className="text-slate-600">{stu.full_name}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            <div className="font-medium text-slate-900">{stu.department}</div>
                            <div className="text-slate-500">Semester {stu.current_semester}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">
                            <span
                              className={
                                stu.attendance_percentage < 75
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
                          <td className="py-3 px-4">
                            {stu.risk_status ? (
                              <span className="inline-flex items-center gap-1 text-red-700 font-medium">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>At-Risk</span>
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-medium">Nominal</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{stu.fee_payment_status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Automated Advisory Email Synthesizer Panel */}
          {result.drafted_emails.length > 0 && (
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-700" />
                  <h3 className="text-base font-semibold text-slate-900">
                    Synthesized Statutory Warning Draft
                  </h3>
                </div>
                {selectedEmail && (
                  <button
                    type="button"
                    onClick={() => handleCopyEmail(selectedEmail)}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedEmailId === selectedEmail.student_id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied to Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Notice</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {selectedEmail ? (
                <div className="space-y-4">
                  <div className="text-xs space-y-1.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Recipient:</span>
                      <span className="font-mono text-slate-900">{selectedEmail.recipient_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Student Profile:</span>
                      <span className="font-medium text-slate-900">
                        {selectedEmail.student_name} · {selectedEmail.student_id}
                      </span>
                    </div>
                    <div className="pt-1 border-t border-slate-200/80">
                      <span className="text-slate-500 block mb-0.5">Subject Line:</span>
                      <span className="font-semibold text-slate-900">{selectedEmail.subject}</span>
                    </div>
                  </div>

                  <pre className="text-xs font-mono text-slate-800 bg-slate-50 p-4 rounded-lg border border-slate-200 whitespace-pre-wrap leading-relaxed">
                    {selectedEmail.body}
                  </pre>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-500">
                      Draft {result.drafted_emails.findIndex((e) => e.student_id === selectedEmail.student_id) + 1} of{' '}
                      {result.drafted_emails.length}
                    </span>
                    <div className="flex items-center gap-2">
                      {result.drafted_emails.slice(0, 5).map((item) => (
                        <button
                          key={item.student_id}
                          type="button"
                          onClick={() => setSelectedEmail(item)}
                          className={`px-2 py-1 text-[11px] font-mono rounded border cursor-pointer ${
                            selectedEmail.student_id === item.student_id
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {item.student_id.slice(-4)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Select a student row to preview the warning email.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* OBE Attainment Results when NLQ detects OBE_ATTAINMENT_REPORT */}
      {result.course_records && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                CO-PO Attainment Audit Report ({result.obe_summary?.department})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {result.obe_summary?.compliance_standard} · Evaluated Courses: {result.course_records.length}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {result.course_records.map((course) => (
              <div key={course.course_code} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-sm">{course.course_code}</span>
                    <span className="mx-2 text-slate-400">·</span>
                    <span className="font-semibold text-slate-900 text-sm">{course.title}</span>
                  </div>
                  <div className="text-xs text-slate-600 tabular-nums">
                    <span>Semester {course.semester}</span>
                    <span className="mx-2">·</span>
                    <span>{course.credit_weight} Credits</span>
                    <span className="mx-2">·</span>
                    <span>Lead: {course.assigned_faculty_name}</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 bg-white">
                        <th className="py-2.5 px-4">CO Code</th>
                        <th className="py-2.5 px-4">Outcome Statement</th>
                        <th className="py-2.5 px-4">Bloom’s Taxonomy Level</th>
                        <th className="py-2.5 px-4 text-right">Target %</th>
                        <th className="py-2.5 px-4 text-right">Achieved %</th>
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {course.course_outcomes.map((co) => {
                        const met = co.achieved_attainment_pct >= co.target_attainment_pct;
                        return (
                          <tr key={co.co_code} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                              {co.co_code}
                            </td>
                            <td className="py-2.5 px-4 text-slate-700">{co.statement}</td>
                            <td className="py-2.5 px-4 font-medium text-slate-800">{co.blooms_level}</td>
                            <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                              {co.target_attainment_pct.toFixed(1)}%
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                              {co.achieved_attainment_pct.toFixed(1)}%
                            </td>
                            <td className="py-2.5 px-4">
                              <span className={met ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                                {met ? 'Target Attained' : 'Action Plan'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Faculty Lookup Results when NLQ detects FACULTY_LOAD_LOOKUP */}
      {result.faculty_records && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">
              Matched Faculty Profiles ({result.faculty_records.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-3 px-4">Faculty ID & Name</th>
                  <th className="py-3 px-4">Title & Department</th>
                  <th className="py-3 px-4">Specialized Research Domain</th>
                  <th className="py-3 px-4">Assigned Courses</th>
                  <th className="py-3 px-4">Office Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {result.faculty_records.map((fac) => (
                  <tr key={fac.faculty_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-slate-900">{fac.faculty_id}</div>
                      <div className="text-slate-700 font-medium">{fac.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{fac.academic_title}</div>
                      <div className="text-slate-500">{fac.department}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{fac.specialized_research_domain}</td>
                    <td className="py-3 px-4 font-mono text-slate-800">
                      {fac.assigned_courses.join(' · ')}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{fac.office_hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Lookup Results when NLQ detects TIMETABLE_CONFLICT_CHECK */}
      {result.schedule_records && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">
              Conflict-Free CSP Schedule Allocations ({result.schedule_records.length} sessions)
            </h3>
            <span className="text-xs font-mono text-emerald-700">0 Room / Faculty Overlaps Verified</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-3 px-4">Course & Session</th>
                  <th className="py-3 px-4">Day / Date</th>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Room & Capacity</th>
                  <th className="py-3 px-4">Assigned Faculty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {result.schedule_records.map((item) => (
                  <tr key={item.allocation_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-mono font-semibold text-slate-900">{item.course_code}</span>
                      <span className="mx-1.5 text-slate-400">·</span>
                      <span className="text-slate-800">{item.course_title}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{item.day}</td>
                    <td className="py-3 px-4 font-mono text-slate-700 tabular-nums">{item.time_slot}</td>
                    <td className="py-3 px-4 font-mono text-slate-700 tabular-nums">
                      {item.room_id} ({item.enrolled_students}/{item.room_capacity} seats)
                    </td>
                    <td className="py-3 px-4 text-slate-700">{item.faculty_name}</td>
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
