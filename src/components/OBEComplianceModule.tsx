import React, { useMemo, useState } from 'react';
import { CheckCircle2, Download, AlertTriangle } from 'lucide-react';
import { OmniERPDatabase } from '../data/datasetGenerator';
import { generateOBEComplianceReport } from '../services/omniErpEngines';

interface OBEComplianceModuleProps {
  db: OmniERPDatabase;
}

export const OBEComplianceModule: React.FC<OBEComplianceModuleProps> = ({ db }) => {
  const [selectedDept, setSelectedDept] = useState<string>('CSE');
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>('ALL');

  const obeReport = useMemo(() => {
    const deptCode = selectedDept === 'ALL' ? undefined : selectedDept;
    const courseCode = selectedCourseCode === 'ALL' ? undefined : selectedCourseCode;
    return generateOBEComplianceReport(db, deptCode, undefined, courseCode);
  }, [db, selectedDept, selectedCourseCode]);

  const deptCourses = useMemo(() => {
    if (selectedDept === 'ALL') {
      return db.departments.flatMap((d) => d.courses);
    }
    const found = db.departments.find((d) => d.department_code === selectedDept);
    return found ? found.courses : [];
  }, [db, selectedDept]);

  const handleExportOBEJSON = () => {
    const blob = new Blob([JSON.stringify(obeReport, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnierp_obe_audit_${selectedDept.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header & Department/Course Selectors */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              04. Outcome-Based Education (OBE) & Bloom’s Taxonomy Compliance Generator
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Automated Course Outcome (CO1–CO5) to Program Outcome (PO1–PO12) articulation mapping across Bloom’s Cognitive Taxonomy (L1: Remember through L6: Create) for NBA & NAAC academic auditing.
            </p>
          </div>
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleExportOBEJSON}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export NBA/NAAC Audit Dossier (JSON)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-5 items-center">
          <div className="md:col-span-5">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Academic Department Scope
            </label>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setSelectedCourseCode('ALL');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-900"
            >
              <option value="ALL">All 20 Academic Departments (University-Wide Audit)</option>
              {db.departments.map((d) => (
                <option key={d.department_code} value={d.department_code}>
                  {d.department_code} — {d.department_name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-5">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Course Articulation Filter
            </label>
            <select
              value={selectedCourseCode}
              onChange={(e) => setSelectedCourseCode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-900"
            >
              <option value="ALL">All Courses in Selected Scope ({deptCourses.length})</option>
              {deptCourses.map((c) => (
                <option key={c.course_code} value={c.course_code}>
                  {c.course_code} — {c.title} (Sem {c.semester})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 pt-5 text-right font-mono text-xs text-slate-600 tabular-nums">
            <div>Courses Audited: <span className="font-bold text-slate-900">{obeReport.evaluated_courses_count}</span></div>
            <div>Outcomes Mapped: <span className="font-bold text-slate-900">{obeReport.evaluated_courses_count * 5}</span></div>
          </div>
        </div>
      </section>

      {/* Bloom's Taxonomy L1-L6 Cognitive Distribution & PO1-PO12 Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-slate-900 pb-3 mb-4 border-b border-slate-200">
            Bloom’s Taxonomy Cognitive Distribution
          </h3>
          <div className="space-y-3.5">
            {Object.entries(obeReport.blooms_taxonomy_distribution).map(([level, count]) => {
              const totalOutcomes = Math.max(1, obeReport.evaluated_courses_count * 5);
              const pct = Math.round((count / totalOutcomes) * 100);
              return (
                <div key={level} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{level}</span>
                    <span className="font-mono tabular-nums text-slate-600">
                      {count} COs ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-800 rounded-full"
                      style={{ width: `${Math.max(6, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-200 text-xs text-slate-600 leading-relaxed">
            Composite Attainment Formula: <span className="font-mono text-slate-900">0.80 × Direct Assessment + 0.20 × Indirect Exit Survey</span>.
          </div>
        </div>

        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">
              Program Outcomes (PO1–PO12) Aggregated Attainment Matrix
            </h3>
          </div>
          <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 text-slate-600">
                <tr>
                  <th className="py-2.5 px-4">PO Code</th>
                  <th className="py-2.5 px-4">Competency Domain & Descriptor</th>
                  <th className="py-2.5 px-4 text-right">Mean Attainment</th>
                  <th className="py-2.5 px-4 text-right">Scale (0–3.0)</th>
                  <th className="py-2.5 px-4">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {obeReport.program_outcomes_summary.map((po) => (
                  <tr key={po.po_code} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{po.po_code}</td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900">{po.title}</div>
                      <div className="text-slate-500">{po.descriptor}</div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {po.average_attainment_pct.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                      {po.attainment_level_scale_3.toFixed(2)} / 3.00
                    </td>
                    <td className="py-2.5 px-4">
                      {po.target_met ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Compliant</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Review</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Course-Level CO-PO Articulation Matrices */}
      <section className="space-y-6">
        {obeReport.course_level_matrices.slice(0, 12).map((course) => (
          <div
            key={course.course_code}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-mono font-bold text-slate-900 text-sm">{course.course_code}</span>
                <span className="mx-2 text-slate-400">·</span>
                <span className="font-semibold text-slate-900 text-sm">{course.title}</span>
                <span className="mx-2 text-slate-400">·</span>
                <span className="text-xs text-slate-600">
                  {course.department} (Sem {course.semester} · {course.credit_weight} Credits)
                </span>
              </div>
              <div className="text-xs font-mono tabular-nums text-slate-700">
                <span>Direct: {course.direct_attainment_pct}%</span>
                <span className="mx-2">·</span>
                <span>Indirect: {course.indirect_attainment_pct}%</span>
                <span className="mx-2">·</span>
                <span className="font-bold text-slate-900">
                  Composite: {course.composite_attainment_pct}% ({course.audit_status})
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="border-b border-slate-200 text-slate-500 bg-white">
                  <tr>
                    <th className="py-2.5 px-4">Course Outcome</th>
                    <th className="py-2.5 px-4">Bloom’s Level</th>
                    <th className="py-2.5 px-4">Statement</th>
                    {Array.from({ length: 12 }, (_, i) => `PO${i + 1}`).map((po) => (
                      <th key={po} className="py-2.5 px-2 text-center font-mono">
                        {po}
                      </th>
                    ))}
                    <th className="py-2.5 px-4 text-right">Achieved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {course.course_outcomes.map((co) => (
                    <tr key={co.co_code} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {co.co_code}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                        {co.blooms_level}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 max-w-md">{co.statement}</td>
                      {Array.from({ length: 12 }, (_, i) => `PO${i + 1}`).map((po) => {
                        const weight = co.mapped_pos[po] || 0;
                        return (
                          <td
                            key={po}
                            className={`py-2.5 px-2 text-center font-mono tabular-nums ${
                              weight === 3
                                ? 'font-bold text-slate-900 bg-slate-100/80'
                                : weight === 2
                                ? 'text-slate-700'
                                : 'text-slate-400'
                            }`}
                          >
                            {weight}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {co.achieved_attainment_pct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
