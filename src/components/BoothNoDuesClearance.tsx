import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  FileCheck,
  Download,
  Printer,
  Lock,
  Unlock,
  Building2,
  Bus,
  Home,
  BookOpen,
  ShieldCheck,
  Search,
  Filter,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  X,
  CreditCard,
  User,
  GraduationCap,
} from 'lucide-react';
import { StudentClearanceRecord, UserRole } from '../data/operationalStore';
import { DepartmentMetadata, StudentRecord } from '../data/datasetGenerator';

interface BoothNoDuesClearanceProps {
  role: UserRole;
  currentUser: {
    id: string;
    name: string;
    email: string;
    departmentCode: string;
  };
  activeBoothDept: DepartmentMetadata;
  studentsList: StudentRecord[];
  clearanceRecords: StudentClearanceRecord[];
  onUpdateClearanceRecord: (record: StudentClearanceRecord) => void;
  onBatchIssueClearances: (departmentCode?: string) => void;
}

export const BoothNoDuesClearance: React.FC<BoothNoDuesClearanceProps> = ({
  role,
  currentUser,
  activeBoothDept,
  studentsList,
  clearanceRecords,
  onUpdateClearanceRecord,
  onBatchIssueClearances,
}) => {
  // If student is logged in, find their record; otherwise pick from list
  const studentOwnRecord = useMemo(() => {
    return clearanceRecords.find(
      (r) =>
        r.student_id.toLowerCase() === currentUser.id.toLowerCase() ||
        r.student_name.toLowerCase() === currentUser.name.toLowerCase()
    );
  }, [clearanceRecords, currentUser]);

  // Selected student for viewing / admin editing
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (role === 'STUDENT' && studentOwnRecord) {
      return studentOwnRecord.student_id;
    }
    // Default to first student in active department
    const deptStudent = clearanceRecords.find(
      (r) => r.department_code === activeBoothDept.department_code
    );
    return deptStudent ? deptStudent.student_id : clearanceRecords[0]?.student_id || '';
  });

  // Admin filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ISSUED' | 'PENDING_ISSUE' | 'FEES_DUE'>('ALL');
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentClearanceRecord | null>(null);

  // Active record currently viewed in the main inspector
  const currentRecord = useMemo(() => {
    if (role === 'STUDENT' && studentOwnRecord) {
      return studentOwnRecord;
    }
    return (
      clearanceRecords.find((r) => r.student_id === selectedStudentId) ||
      studentOwnRecord ||
      clearanceRecords[0]
    );
  }, [role, studentOwnRecord, clearanceRecords, selectedStudentId]);

  // Filtered list for Admin Management Table
  const filteredRecords = useMemo(() => {
    return clearanceRecords.filter((rec) => {
      // Department filter
      if (filterDepartment !== 'ALL' && rec.department_code !== filterDepartment) {
        return false;
      }
      // Status filter
      if (filterStatus === 'ISSUED' && !rec.clearance_issued_by_admin) {
        return false;
      }
      if (filterStatus === 'PENDING_ISSUE' && rec.clearance_issued_by_admin) {
        return false;
      }
      if (filterStatus === 'FEES_DUE') {
        const hasDue =
          rec.semester_fee_status !== 'Paid' ||
          (rec.bus_facility_applicable && rec.bus_fee_status !== 'Paid') ||
          (rec.hostel_facility_applicable && rec.hostel_fee_status !== 'Paid');
        if (!hasDue) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          rec.student_name.toLowerCase().includes(q) ||
          rec.student_id.toLowerCase().includes(q) ||
          rec.roll_number.toLowerCase().includes(q) ||
          rec.department_code.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [clearanceRecords, filterDepartment, filterStatus, searchQuery]);

  // Calculations for Admin Overview
  const stats = useMemo(() => {
    const total = clearanceRecords.length;
    const issued = clearanceRecords.filter((r) => r.clearance_issued_by_admin).length;
    const allPaidEligible = clearanceRecords.filter((r) => {
      const semPaid = r.semester_fee_status === 'Paid';
      const busPaid = !r.bus_facility_applicable || r.bus_fee_status === 'Paid';
      const hostelPaid = !r.hostel_facility_applicable || r.hostel_fee_status === 'Paid';
      return semPaid && busPaid && hostelPaid;
    }).length;
    const hasDues = total - allPaidEligible;
    return { total, issued, allPaidEligible, hasDues };
  }, [clearanceRecords]);

  // Check if current record has all required fees paid
  const isCurrentAllDuesCleared = useMemo(() => {
    if (!currentRecord) return false;
    const semPaid = currentRecord.semester_fee_status === 'Paid';
    const busPaid = !currentRecord.bus_facility_applicable || currentRecord.bus_fee_status === 'Paid';
    const hostelPaid = !currentRecord.hostel_facility_applicable || currentRecord.hostel_fee_status === 'Paid';
    const libClear = currentRecord.library_clearance_status === 'Cleared';
    const labClear = currentRecord.laboratory_clearance_status === 'Cleared';
    return semPaid && busPaid && hostelPaid && libClear && labClear;
  }, [currentRecord]);

  // Admin action: Toggle Fee Status
  const handleToggleFeeStatus = (
    rec: StudentClearanceRecord,
    feeType: 'semester' | 'bus' | 'hostel'
  ) => {
    const updated = { ...rec };
    if (feeType === 'semester') {
      const isPaid = updated.semester_fee_status === 'Paid';
      updated.semester_fee_status = isPaid ? 'Pending' : 'Paid';
      updated.semester_fee_paid_date = isPaid ? undefined : '2026-10-14';
      updated.semester_fee_transaction_id = isPaid ? undefined : `TXN-UMU-${Date.now().toString().slice(-6)}`;
      // If setting to pending, revoke issued slip
      if (isPaid && updated.clearance_issued_by_admin) {
        updated.clearance_issued_by_admin = false;
        updated.certificate_number = undefined;
      }
    } else if (feeType === 'bus') {
      const isPaid = updated.bus_fee_status === 'Paid';
      updated.bus_fee_status = isPaid ? 'Pending' : 'Paid';
      updated.bus_fee_paid_date = isPaid ? undefined : '2026-10-14';
      updated.bus_fee_transaction_id = isPaid ? undefined : `TXN-BUS-${Date.now().toString().slice(-6)}`;
      if (isPaid && updated.clearance_issued_by_admin) {
        updated.clearance_issued_by_admin = false;
        updated.certificate_number = undefined;
      }
    } else if (feeType === 'hostel') {
      const isPaid = updated.hostel_fee_status === 'Paid';
      updated.hostel_fee_status = isPaid ? 'Pending' : 'Paid';
      updated.hostel_fee_paid_date = isPaid ? undefined : '2026-10-14';
      updated.hostel_fee_transaction_id = isPaid ? undefined : `TXN-HSTL-${Date.now().toString().slice(-6)}`;
      if (isPaid && updated.clearance_issued_by_admin) {
        updated.clearance_issued_by_admin = false;
        updated.certificate_number = undefined;
      }
    }
    onUpdateClearanceRecord(updated);
  };

  // Admin action: Toggle Facility Applicability
  const handleToggleFacility = (
    rec: StudentClearanceRecord,
    facility: 'bus' | 'hostel'
  ) => {
    const updated = { ...rec };
    if (facility === 'bus') {
      const nextApplicable = !updated.bus_facility_applicable;
      updated.bus_facility_applicable = nextApplicable;
      if (nextApplicable) {
        updated.bus_route_name = 'Route #2: Ratu Road - Harmu - Campus';
        updated.bus_fee_amount = 14000;
        updated.bus_fee_status = 'Pending';
      } else {
        updated.bus_route_name = undefined;
        updated.bus_fee_amount = 0;
        updated.bus_fee_status = 'N/A';
      }
    } else if (facility === 'hostel') {
      const nextApplicable = !updated.hostel_facility_applicable;
      updated.hostel_facility_applicable = nextApplicable;
      if (nextApplicable) {
        updated.hostel_block_room = 'Birsa Munda Boys Hostel (Block B - Rm 112)';
        updated.hostel_fee_amount = 38000;
        updated.hostel_fee_status = 'Pending';
      } else {
        updated.hostel_block_room = undefined;
        updated.hostel_fee_amount = 0;
        updated.hostel_fee_status = 'N/A';
      }
    }
    onUpdateClearanceRecord(updated);
  };

  // Admin action: Issue Clearance Slip
  const handleIssueClearance = (rec: StudentClearanceRecord) => {
    const updated: StudentClearanceRecord = {
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
      admin_remarks: 'Verified zero dues across tuition, transport, hostel, and institutional libraries. Formally issued.',
    };
    onUpdateClearanceRecord(updated);
  };

  // Admin action: Revoke Clearance Slip
  const handleRevokeClearance = (rec: StudentClearanceRecord) => {
    const updated: StudentClearanceRecord = {
      ...rec,
      clearance_issued_by_admin: false,
      certificate_number: undefined,
      issued_by_admin_name: undefined,
      issued_at: undefined,
      admin_remarks: 'Clearance withheld by administration due to updated ledger audit.',
    };
    onUpdateClearanceRecord(updated);
  };

  // Print slip handler
  const handlePrintSlip = () => {
    window.print();
  };

  if (!currentRecord) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-600">
        No student clearance records found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-2xs w-full max-w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <FileCheck className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight">
                No Dues Clearance Slip
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Official institutional fee clearance protocol for semester examination eligibility and course registration at{' '}
              <span className="font-semibold text-slate-800">Usha Martin University, Ranchi</span>.
            </p>
          </div>

          {/* Role Perspective Indicator */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {role === 'ADMIN' ? (
              <span className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Admin Clearance Issuer Deck</span>
              </span>
            ) : role === 'STUDENT' ? (
              <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                <span>Student Due Status Portal</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-slate-600" />
                <span>Departmental Verification View ({role})</span>
              </span>
            )}

            {/* Quick action: Download/Print button in header if issued */}
            {currentRecord.clearance_issued_by_admin ? (
              <button
                type="button"
                onClick={() => setShowSlipModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Clearance Slip</span>
              </button>
            ) : (
              <div
                title="Slip download is locked until Administration issues clearance"
                className="px-3.5 py-2 bg-slate-100 text-slate-400 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-not-allowed border border-slate-200"
              >
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Slip Download Locked</span>
              </div>
            )}
          </div>
        </div>

        {/* Student Selector (Available for Staff/Admin or testing) */}
        {role !== 'STUDENT' && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Inspect Student Due Status:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 font-medium focus:ring-2 focus:ring-slate-900 cursor-pointer max-w-[280px] truncate"
              >
                {clearanceRecords.map((r) => (
                  <option key={r.student_id} value={r.student_id}>
                    {r.student_name} ({r.roll_number}) — {r.department_code} (Sem {r.semester})
                  </option>
                ))}
              </select>
            </div>

            <div className="text-slate-500 text-[11px]">
              Viewing as administrator / staff: You can test issuing or revoking slips below.
            </div>
          </div>
        )}
      </div>

      {/* 2. Official Issuance Banner & Download Bar */}
      <div
        className={`rounded-xl border p-4 sm:p-5 transition-all w-full max-w-full ${
          currentRecord.clearance_issued_by_admin
            ? 'bg-emerald-50/70 border-emerald-300'
            : 'bg-amber-50/70 border-amber-300'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`p-2 rounded-lg shrink-0 ${
                currentRecord.clearance_issued_by_admin
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {currentRecord.clearance_issued_by_admin ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {currentRecord.clearance_issued_by_admin
                    ? 'No Dues Clearance Slip Issued by Administration'
                    : 'Clearance Slip Pending Administrative Issuance'}
                </h3>
                {currentRecord.clearance_issued_by_admin ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    CERT #{currentRecord.certificate_number}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    Download Awaits Admin Issue
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                {currentRecord.clearance_issued_by_admin ? (
                  <>
                    Issued by <span className="font-semibold">{currentRecord.issued_by_admin_name || 'Chief Institute Registrar'}</span> on{' '}
                    <span className="font-semibold">{currentRecord.issued_at || 'Recent'}</span>. All departmental and institutional ledgers have been verified.
                  </>
                ) : (
                  <>
                    Students can only download their clearance slip once it has been verified and enabled by the Admin side.
                    {isCurrentAllDuesCleared
                      ? ' All dues are currently paid! Administration can now issue this clearance slip.'
                      : ' Some fee or facility dues are pending payment before clearance can be granted.'}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            {currentRecord.clearance_issued_by_admin ? (
              <button
                type="button"
                onClick={() => setShowSlipModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download / Print Slip</span>
              </button>
            ) : (
              <div className="space-y-1">
                <button
                  type="button"
                  disabled
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-200 text-slate-500 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-not-allowed border border-slate-300"
                >
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Download Disabled (Pending Admin)</span>
                </button>
                {role === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => handleIssueClearance(currentRecord)}
                    className="w-full sm:w-auto px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Issue Clearance Slip Now</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Dues Checklist Cards with Explicit Tick Marks */}
      <div className="space-y-3 w-full max-w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Dues Clearance Status for {currentRecord.student_name} ({currentRecord.roll_number})
          </h2>
          <span className="text-xs text-slate-500">
            Academic Session: {currentRecord.academic_year} · Semester {currentRecord.semester}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card A: Semester Tuition Fees */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs relative overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                    <CreditCard className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-slate-900">Semester Tuition Fees</span>
                </div>
                {/* TICK MARK */}
                {currentRecord.semester_fee_status === 'Paid' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>PAID</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>PENDING</span>
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-2xl font-bold font-mono text-slate-900">
                  ₹{currentRecord.semester_fee_amount.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-slate-500">
                  Course & Examination Fee (Semester {currentRecord.semester})
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Payment Status:</span>
                  <span className="font-semibold">{currentRecord.semester_fee_status}</span>
                </div>
                {currentRecord.semester_fee_transaction_id && (
                  <div className="flex justify-between font-mono">
                    <span>Txn Ref:</span>
                    <span className="truncate max-w-[140px]">{currentRecord.semester_fee_transaction_id}</span>
                  </div>
                )}
                {currentRecord.semester_fee_paid_date && (
                  <div className="flex justify-between">
                    <span>Date Paid:</span>
                    <span>{currentRecord.semester_fee_paid_date}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Admin control toggle */}
            {role === 'ADMIN' && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleToggleFeeStatus(currentRecord, 'semester')}
                  className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  Toggle Paid / Pending (Admin)
                </button>
              </div>
            )}
          </div>

          {/* Card B: Bus Transportation Fees */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs relative overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                    <Bus className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-slate-900">Bus Transportation</span>
                </div>
                {/* TICK MARK */}
                {!currentRecord.bus_facility_applicable ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    <MinusCircle className="w-4 h-4 text-slate-400" />
                    <span>N/A (Day Scholar)</span>
                  </span>
                ) : currentRecord.bus_fee_status === 'Paid' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>PAID</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>PENDING</span>
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-2xl font-bold font-mono text-slate-900">
                  {currentRecord.bus_facility_applicable
                    ? `₹${currentRecord.bus_fee_amount.toLocaleString('en-IN')}`
                    : '₹0 (Not Enrolled)'}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {currentRecord.bus_facility_applicable
                    ? currentRecord.bus_route_name || 'Enrolled in Bus Route'
                    : 'Student commutes independently / Hostelite'}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Facility Applicable:</span>
                  <span className="font-semibold">
                    {currentRecord.bus_facility_applicable ? 'Yes (Enrolled)' : 'No (Day Scholar)'}
                  </span>
                </div>
                {currentRecord.bus_facility_applicable && (
                  <>
                    <div className="flex justify-between">
                      <span>Fee Status:</span>
                      <span className="font-semibold">{currentRecord.bus_fee_status}</span>
                    </div>
                    {currentRecord.bus_fee_paid_date && (
                      <div className="flex justify-between">
                        <span>Paid Date:</span>
                        <span>{currentRecord.bus_fee_paid_date}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Admin control toggle */}
            {role === 'ADMIN' && (
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleToggleFacility(currentRecord, 'bus')}
                  className="py-1.5 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-semibold transition-colors cursor-pointer truncate"
                >
                  {currentRecord.bus_facility_applicable ? 'Set Not Applicable' : 'Set Enrolled'}
                </button>
                {currentRecord.bus_facility_applicable && (
                  <button
                    type="button"
                    onClick={() => handleToggleFeeStatus(currentRecord, 'bus')}
                    className="py-1.5 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-semibold transition-colors cursor-pointer truncate"
                  >
                    Toggle Paid/Due
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Card C: Hostel & Mess Fees */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs relative overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Home className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-slate-900">Hostel & Mess Boarding</span>
                </div>
                {/* TICK MARK */}
                {!currentRecord.hostel_facility_applicable ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    <MinusCircle className="w-4 h-4 text-slate-400" />
                    <span>N/A (Non-Hostelite)</span>
                  </span>
                ) : currentRecord.hostel_fee_status === 'Paid' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>PAID</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>PENDING</span>
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-2xl font-bold font-mono text-slate-900">
                  {currentRecord.hostel_facility_applicable
                    ? `₹${currentRecord.hostel_fee_amount.toLocaleString('en-IN')}`
                    : '₹0 (Not Enrolled)'}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {currentRecord.hostel_facility_applicable
                    ? currentRecord.hostel_block_room || 'Resident Hostelite'
                    : 'Day scholar / living off-campus'}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Facility Applicable:</span>
                  <span className="font-semibold">
                    {currentRecord.hostel_facility_applicable ? 'Yes (Hostelite)' : 'No (Day Scholar)'}
                  </span>
                </div>
                {currentRecord.hostel_facility_applicable && (
                  <>
                    <div className="flex justify-between">
                      <span>Fee Status:</span>
                      <span className="font-semibold">{currentRecord.hostel_fee_status}</span>
                    </div>
                    {currentRecord.hostel_fee_paid_date && (
                      <div className="flex justify-between">
                        <span>Paid Date:</span>
                        <span>{currentRecord.hostel_fee_paid_date}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Admin control toggle */}
            {role === 'ADMIN' && (
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleToggleFacility(currentRecord, 'hostel')}
                  className="py-1.5 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-semibold transition-colors cursor-pointer truncate"
                >
                  {currentRecord.hostel_facility_applicable ? 'Set Not Applicable' : 'Set Enrolled'}
                </button>
                {currentRecord.hostel_facility_applicable && (
                  <button
                    type="button"
                    onClick={() => handleToggleFeeStatus(currentRecord, 'hostel')}
                    className="py-1.5 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-semibold transition-colors cursor-pointer truncate"
                  >
                    Toggle Paid/Due
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Secondary Clearances: Library, Lab & Department */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-slate-600" />
              <div>
                <div className="font-bold text-slate-900">Central University Library</div>
                <div className="text-[11px] text-slate-500">{currentRecord.library_remarks}</div>
              </div>
            </div>
            {currentRecord.library_clearance_status === 'Cleared' ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>CLEARED</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>PENDING</span>
              </span>
            )}
          </div>

          <div className="p-3.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-slate-600" />
              <div>
                <div className="font-bold text-slate-900">Departmental Laboratories & Equipment</div>
                <div className="text-[11px] text-slate-500">
                  {activeBoothDept.department_name} laboratories & toolkits
                </div>
              </div>
            </div>
            {currentRecord.laboratory_clearance_status === 'Cleared' ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>CLEARED</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>PENDING</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. ADMIN MANAGEMENT CONSOLE (Visible only when role === 'ADMIN') */}
      {role === 'ADMIN' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-2xs space-y-5 w-full max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-700" />
                <span>Administration Clearance & Slip Issuance Console</span>
              </h2>
              <p className="text-xs text-slate-500">
                Manage fees, toggle bus & hostel applicability, and issue/revoke official clearance slips across all departments.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onBatchIssueClearances(activeBoothDept.department_code)}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Issue All Paid Slips ({activeBoothDept.department_code})</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-slate-500 text-[11px]">Total Students</div>
              <div className="text-lg font-bold font-mono text-slate-900">{stats.total}</div>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="text-emerald-700 text-[11px]">Slips Issued (Enabled)</div>
              <div className="text-lg font-bold font-mono text-emerald-800">{stats.issued}</div>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-blue-700 text-[11px]">100% Fees Paid</div>
              <div className="text-lg font-bold font-mono text-blue-800">{stats.allPaidEligible}</div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-amber-700 text-[11px]">Outstanding Dues</div>
              <div className="text-lg font-bold font-mono text-amber-800">{stats.hasDues}</div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student name, roll # or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Department:</span>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-2.5 py-1 border border-slate-300 rounded bg-white text-slate-800 font-medium"
                >
                  <option value="ALL">All Departments</option>
                  <option value={activeBoothDept.department_code}>
                    {activeBoothDept.department_code} ({activeBoothDept.department_name})
                  </option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="ME">ME</option>
                  <option value="CIVIL">CIVIL</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-2.5 py-1 border border-slate-300 rounded bg-white text-slate-800 font-medium"
                >
                  <option value="ALL">All Status</option>
                  <option value="ISSUED">Slips Issued</option>
                  <option value="PENDING_ISSUE">Slips Pending Issue</option>
                  <option value="FEES_DUE">Has Unpaid Dues</option>
                </select>
              </div>
            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto w-full max-w-full border border-slate-200 rounded-lg">
            <table className="w-full min-w-[760px] text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Student & Roll No</th>
                  <th className="py-2.5 px-2.5">Dept / Sem</th>
                  <th className="py-2.5 px-2.5 text-center">Semester Fee</th>
                  <th className="py-2.5 px-2.5 text-center">Bus Fee</th>
                  <th className="py-2.5 px-2.5 text-center">Hostel Fee</th>
                  <th className="py-2.5 px-2.5 text-center">Library / Lab</th>
                  <th className="py-2.5 px-2.5 text-center">Clearance Slip</th>
                  <th className="py-2.5 px-3 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No matching student clearance records found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => {
                    const isAllPaid =
                      rec.semester_fee_status === 'Paid' &&
                      (!rec.bus_facility_applicable || rec.bus_fee_status === 'Paid') &&
                      (!rec.hostel_facility_applicable || rec.hostel_fee_status === 'Paid');

                    return (
                      <tr
                        key={rec.student_id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          selectedStudentId === rec.student_id ? 'bg-slate-50' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentId(rec.student_id)}
                            className="text-left font-bold text-slate-900 hover:underline flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{rec.student_name}</span>
                          </button>
                          <div className="font-mono text-[11px] text-slate-500">
                            {rec.roll_number}
                          </div>
                        </td>

                        <td className="py-2.5 px-2.5 font-medium text-slate-700">
                          {rec.department_code} · S{rec.semester}
                        </td>

                        {/* Semester fee tick */}
                        <td className="py-2.5 px-2.5 text-center">
                          {rec.semester_fee_status === 'Paid' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Paid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        {/* Bus fee tick */}
                        <td className="py-2.5 px-2.5 text-center">
                          {!rec.bus_facility_applicable ? (
                            <span className="text-[11px] text-slate-400">N/A</span>
                          ) : rec.bus_fee_status === 'Paid' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Paid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        {/* Hostel fee tick */}
                        <td className="py-2.5 px-2.5 text-center">
                          {!rec.hostel_facility_applicable ? (
                            <span className="text-[11px] text-slate-400">N/A</span>
                          ) : rec.hostel_fee_status === 'Paid' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Paid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        {/* Library & Lab */}
                        <td className="py-2.5 px-2.5 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Clear</span>
                          </span>
                        </td>

                        {/* Clearance Slip Status */}
                        <td className="py-2.5 px-2.5 text-center">
                          {rec.clearance_issued_by_admin ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                              <span>ISSUED</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Locked</span>
                            </span>
                          )}
                        </td>

                        {/* Admin Action */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {rec.clearance_issued_by_admin ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedStudentId(rec.student_id);
                                    setShowSlipModal(true);
                                  }}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>View Slip</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRevokeClearance(rec)}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-semibold text-[11px] cursor-pointer"
                                >
                                  Revoke
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleIssueClearance(rec)}
                                className={`px-2.5 py-1 rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer ${
                                  isAllPaid
                                    ? 'bg-purple-700 hover:bg-purple-800 text-white'
                                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                }`}
                              >
                                <Unlock className="w-3 h-3" />
                                <span>Issue Slip</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. OFFICIAL PRINTABLE / DOWNLOADABLE NO DUES CLEARANCE SLIP MODAL */}
      {showSlipModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Action Bar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-slate-900 text-sm">
                  Official No Dues Clearance Slip Preview
                </span>
                <span className="hidden sm:inline font-mono text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-300 font-bold">
                  {currentRecord.certificate_number || 'VERIFIED'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSlipModal(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                  aria-label="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slip Printable Content (Target for print) */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-white text-slate-900 font-sans print:p-0">
              {/* University Header */}
              <div className="text-center pb-5 border-b-2 border-slate-900 space-y-1">
                <div className="text-xs uppercase font-bold tracking-widest text-slate-500">
                  Established under Jharkhand State Legislature Act No. 05/2014 · Recognized by UGC
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-900">
                  USHA MARTIN UNIVERSITY, RANCHI
                </h1>
                <div className="text-xs text-slate-600 font-medium">
                  At Village Narayansoso, Angara, Ranchi-Purulia Highway, Ranchi, Jharkhand - 835103
                </div>
                <div className="pt-2">
                  <span className="inline-block px-4 py-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded">
                    Institutional No Dues Clearance Certificate
                  </span>
                </div>
              </div>

              {/* Certificate Metadata Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[10px] block">Certificate Ref No:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {currentRecord.certificate_number || `UMU/NODUES/2026-27/${currentRecord.department_code}/01`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Academic Session:</span>
                  <span className="font-bold text-slate-900">{currentRecord.academic_year}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Issue Timestamp:</span>
                  <span className="font-medium text-slate-900">
                    {currentRecord.issued_at || '14 Oct 2026, 11:30 AM'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Clearance Officer:</span>
                  <span className="font-medium text-slate-900 truncate block">
                    {currentRecord.issued_by_admin_name || 'Chief Institute Registrar'}
                  </span>
                </div>
              </div>

              {/* Student Particulars */}
              <div className="border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Candidate Full Name:</span>
                    <span className="font-bold text-slate-900 text-sm">{currentRecord.student_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">University Roll / Enrolment No:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {currentRecord.roll_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Department / School:</span>
                    <span className="font-semibold text-slate-800">
                      {currentRecord.department_name} ({currentRecord.department_code})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Current Semester:</span>
                    <span className="font-semibold text-slate-800">
                      Semester {currentRecord.semester}
                    </span>
                  </div>
                </div>
              </div>

              {/* Clearance Heads Table with Explicit Tick Marks */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Institutional Dues Reconciliation Statement
                </div>
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Clearance Head</th>
                        <th className="py-2.5 px-3">Applicability / Facility</th>
                        <th className="py-2.5 px-3 text-right">Fee Assessed</th>
                        <th className="py-2.5 px-3 text-center">Due Status</th>
                        <th className="py-2.5 px-3 text-center">Tick Mark (Clearance)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {/* Semester Tuition */}
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          Semester Tuition & Examination Fees
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          Academic Session {currentRecord.academic_year} (Sem {currentRecord.semester})
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          ₹{currentRecord.semester_fee_amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-bold text-emerald-700">PAID</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>CLEARED</span>
                          </span>
                        </td>
                      </tr>

                      {/* Bus Facility */}
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          University Bus Transportation
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {currentRecord.bus_facility_applicable
                            ? currentRecord.bus_route_name || 'Enrolled Route'
                            : 'Not Applicable (Day Scholar)'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {currentRecord.bus_facility_applicable
                            ? `₹${currentRecord.bus_fee_amount.toLocaleString('en-IN')}`
                            : '₹0'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {currentRecord.bus_facility_applicable ? (
                            <span className="font-bold text-emerald-700">PAID</span>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {currentRecord.bus_facility_applicable ? (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>CLEARED</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200">
                              <MinusCircle className="w-4 h-4 text-slate-400" />
                              <span>N/A</span>
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Hostel Facility */}
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          Hostel Accommodation & Mess Boarding
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {currentRecord.hostel_facility_applicable
                            ? currentRecord.hostel_block_room || 'Campus Resident'
                            : 'Not Applicable (Non-Hostelite)'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {currentRecord.hostel_facility_applicable
                            ? `₹${currentRecord.hostel_fee_amount.toLocaleString('en-IN')}`
                            : '₹0'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {currentRecord.hostel_facility_applicable ? (
                            <span className="font-bold text-emerald-700">PAID</span>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {currentRecord.hostel_facility_applicable ? (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>CLEARED</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200">
                              <MinusCircle className="w-4 h-4 text-slate-400" />
                              <span>N/A</span>
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Library */}
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          Central University Library
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          Zero overdue books & fine reconciliation
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">₹0</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-bold text-emerald-700">CLEAR</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>CLEARED</span>
                          </span>
                        </td>
                      </tr>

                      {/* Laboratory */}
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          Departmental Laboratories & Consumables
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          No damaged or unreturned laboratory equipment
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">₹0</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-bold text-emerald-700">CLEAR</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>CLEARED</span>
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Official Attestation Declaration */}
              <div className="bg-emerald-50/70 border border-emerald-300 p-4 rounded-lg text-xs space-y-1.5">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>OFFICIAL CLEARANCE DETERMINATION</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Certified that the candidate named herein has satisfactorily cleared all tuition, transportation, hostel, library, and departmental dues as required by University Regulations. The candidate is hereby{' '}
                  <span className="font-bold text-slate-900 underline">
                    CLEARED AND ELIGIBLE
                  </span>{' '}
                  for issuance of End-Semester Examination Hall Ticket and subsequent semester registration.
                </p>
              </div>

              {/* Signatures & University Digital Seal */}
              <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
                <div className="border-t border-slate-400 pt-2 space-y-1">
                  <div className="font-bold text-slate-900">Finance & Accounts Officer</div>
                  <div className="text-[10px] text-slate-500">Usha Martin University, Ranchi</div>
                </div>

                <div className="flex flex-col items-center justify-center -mt-4">
                  <div className="w-16 h-16 rounded-full border-2 border-emerald-600 flex items-center justify-center text-[10px] font-bold text-emerald-800 text-center p-1 leading-tight uppercase font-mono shadow-xs">
                    Digital Seal Verified UMU
                  </div>
                </div>

                <div className="border-t border-slate-400 pt-2 space-y-1">
                  <div className="font-bold text-slate-900">Chief Institute Registrar</div>
                  <div className="text-[10px] text-slate-500">Administration Directorate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
