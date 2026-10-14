import React, { useMemo, useState } from 'react';
import {
  Plus,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  X,
  ArrowRight,
} from 'lucide-react';
import { OmniERPDatabase } from '../data/datasetGenerator';
import {
  UserRole,
  PortalEnrollmentRequest,
  BoothEnrollmentRequest,
} from '../data/operationalStore';
import { validatePasswordRules } from './AuthLoginAndEnrollPortal';

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_REGEX = /^[0-9]{10}$/;

interface AddBoothModalProps {
  db: OmniERPDatabase;
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    departmentCode: string;
  };
  boothRequests: BoothEnrollmentRequest[];
  onSubmitBoothRequest: (req: BoothEnrollmentRequest) => void;
  onQuickSwitchToHOD: () => void;
}

export const AddBoothModal: React.FC<AddBoothModalProps> = ({
  db,
  isOpen,
  onClose,
  currentUser,
  boothRequests,
  onSubmitBoothRequest,
  onQuickSwitchToHOD,
}) => {
  // Students can ONLY enroll in their own department booth!
  // Faculties and admins can enroll in different booths/departments.
  const availableDepartments = useMemo(() => {
    if (currentUser.role === 'STUDENT' && currentUser.departmentCode) {
      const match = db.departments.filter(
        (d) => d.department_code === currentUser.departmentCode
      );
      return match.length > 0 ? match : db.departments.slice(0, 1);
    }
    return db.departments;
  }, [db.departments, currentUser.role, currentUser.departmentCode]);

  const [selectedBoothCode, setSelectedBoothCode] = useState<string>(
    currentUser.departmentCode || availableDepartments[0]?.department_code || 'CSE'
  );
  const [verifyEmail, setVerifyEmail] = useState<string>(currentUser.email || '');
  const [verifyPhone, setVerifyPhone] = useState<string>('');
  const [verifyPassword, setVerifyPassword] = useState<string>('');
  const [sentRequestReceipt, setSentRequestReceipt] =
    useState<BoothEnrollmentRequest | null>(null);

  if (!isOpen) return null;

  const isEmailValid = EMAIL_REGEX.test(verifyEmail.trim());
  const isPhoneValid = PHONE_REGEX.test(verifyPhone.trim());
  const pwRules = validatePasswordRules(verifyPassword);
  const isPasswordValid =
    pwRules.minLength &&
    pwRules.hasUpper &&
    pwRules.hasLower &&
    pwRules.hasDigit &&
    pwRules.hasSpecial;

  const isFormCleared =
    Boolean(selectedBoothCode) && isEmailValid && isPhoneValid && isPasswordValid;

  const existingReqForSelectedBooth = boothRequests.find(
    (r) =>
      r.requester_email.toLowerCase() === currentUser.email.toLowerCase() &&
      r.booth_department_code === selectedBoothCode
  );

  const handleEnrollBoothSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormCleared) return;

    if (existingReqForSelectedBooth) {
      setSentRequestReceipt(existingReqForSelectedBooth);
      return;
    }

    const deptObj =
      db.departments.find((d) => d.department_code === selectedBoothCode) ||
      availableDepartments[0];

    const newReq: BoothEnrollmentRequest = {
      id: `BTH-REQ-${Date.now().toString().slice(-4)}`,
      requester_id: currentUser.id,
      requester_name: currentUser.name,
      requester_email: verifyEmail.trim().toLowerCase(),
      requester_role: currentUser.role,
      booth_department_code: deptObj.department_code,
      booth_department_name: deptObj.department_name,
      status: 'PENDING_HOD_APPROVAL',
      submitted_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    onSubmitBoothRequest(newReq);
    setSentRequestReceipt(newReq);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-900" />
            <h3 className="text-lg font-bold text-slate-900">
              Add & Enroll to Department Booth
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setSentRequestReceipt(null);
              onClose();
            }}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {sentRequestReceipt ? (
          <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-4">
            <div className="flex items-center gap-2 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <h4 className="text-base font-bold">Request to enroll is sent</h4>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Your request to enroll in the{' '}
              <strong>
                {sentRequestReceipt.booth_department_name} ({sentRequestReceipt.booth_department_code}) Booth
              </strong>{' '}
              has been routed to the <strong>Head of Department (HOD)</strong>. Entry to this booth will be granted{' '}
              <strong>only after approval by the HOD</strong>.
            </p>
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-xs font-mono space-y-1 text-slate-700">
              <div>Booth Request ID: <span className="font-bold text-slate-900">{sentRequestReceipt.id}</span></div>
              <div>Selected Booth: <span className="font-bold text-slate-900">{sentRequestReceipt.booth_department_name} ({sentRequestReceipt.booth_department_code})</span></div>
              <div>Applicant: {sentRequestReceipt.requester_name} ({sentRequestReceipt.requester_email})</div>
              <div>Role: {sentRequestReceipt.requester_role}</div>
              <div>Status: <span className="text-amber-700 font-bold">PENDING HOD APPROVAL</span></div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {currentUser.role !== 'STUDENT' && (
                <button
                  type="button"
                  onClick={() => {
                    setSentRequestReceipt(null);
                    onClose();
                    onQuickSwitchToHOD();
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Review in HOD Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSentRequestReceipt(null);
                  onClose();
                }}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleEnrollBoothSubmit} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
              {currentUser.role === 'STUDENT' ? (
                <span>
                  <strong>Student Booth Policy:</strong> As a student, you can only enroll in your registered department booth (<strong>{currentUser.departmentCode}</strong>). Enter your registered email, 10-digit phone number, and password to submit an enrollment request to your HOD. Entry will be granted only after approval by the HOD.
                </span>
              ) : (
                <span>
                  Select any departmental booth to request enrollment. Enter your registered email, 10-digit phone number, and password. Entry to the booth is granted only after HOD approval.
                </span>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                {currentUser.role === 'STUDENT'
                  ? 'Your Registered Department Booth'
                  : 'Select Department Booth to Enroll'}
              </label>
              <select
                value={selectedBoothCode}
                onChange={(e) => setSelectedBoothCode(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
              >
                {availableDepartments.map((d) => {
                  const isHome = d.department_code === currentUser.departmentCode;
                  return (
                    <option key={d.department_code} value={d.department_code}>
                      {d.department_code} Booth — {d.department_name} (HOD: {d.hod_name})
                      {isHome ? ' [Your Department]' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={verifyEmail}
                    onChange={(e) => setVerifyEmail(e.target.value)}
                    placeholder="user@ushamartin.edu.in"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Registered Phone (10 Digits)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    maxLength={10}
                    value={verifyPhone}
                    onChange={(e) => setVerifyPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="9876543210"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono tabular-nums text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Confirm Portal Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={verifyPassword}
                  onChange={(e) => setVerifyPassword(e.target.value)}
                  placeholder="Min 8 chars, upper, lower, digit, special char"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                />
              </div>
            </div>

            {/* Format Validation Gate */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  Format Validation Gate (Restricts Submit until cleared):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setVerifyEmail(currentUser.email);
                    setVerifyPhone('9876543210');
                    setVerifyPassword('Verify@2026');
                  }}
                  className="text-[11px] font-semibold text-slate-900 underline cursor-pointer"
                >
                  Auto-Fill Valid Format
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-1">
                <div className={isEmailValid ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  {isEmailValid ? '✓' : '○'} Valid Email Format
                </div>
                <div className={isPhoneValid ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  {isPhoneValid ? '✓' : '○'} 10-Digit Phone ({verifyPhone.length}/10)
                </div>
                <div className={pwRules.minLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  {pwRules.minLength ? '✓' : '○'} Password 8+ Chars
                </div>
                <div
                  className={
                    isPasswordValid ? 'text-emerald-700 font-medium' : 'text-slate-500'
                  }
                >
                  {isPasswordValid ? '✓' : '○'} Upper, Lower, Digit & Special
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormCleared}
                className={`px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
                  isFormCleared
                    ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isFormCleared
                    ? `Enroll to ${selectedBoothCode} Booth (Send to HOD)`
                    : 'Complete Format Validation to Submit'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

interface HODApprovalConsoleProps {
  portalRequests: PortalEnrollmentRequest[];
  boothRequests: BoothEnrollmentRequest[];
  hodName: string;
  onReviewPortalRequest: (reqId: string, status: 'APPROVED' | 'REJECTED') => void;
  onReviewBoothRequest: (reqId: string, status: 'APPROVED' | 'REJECTED') => void;
}

export const HODApprovalConsole: React.FC<HODApprovalConsoleProps> = ({
  portalRequests,
  boothRequests,
  hodName,
  onReviewPortalRequest,
  onReviewBoothRequest,
}) => {
  const pendingPortal = portalRequests.filter((r) => r.status === 'PENDING_HOD_APPROVAL');
  const pendingBooth = boothRequests.filter((r) => r.status === 'PENDING_HOD_APPROVAL');

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            HOD Enrollment & Booth Access Approval Center
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Review and approve new Student Portal Registration requests and "+ Add Booth" Enrollment requests. Students and Faculty gain entry only after approval below.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-600 tabular-nums shrink-0">
          Pending Portal Requests: <span className="font-bold text-slate-900">{pendingPortal.length}</span> · Pending Booth Requests: <span className="font-bold text-slate-900">{pendingBooth.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue 1: New Student Portal Enrollment Requests */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900">
              1. New Student Portal Enrollment Requests ({portalRequests.length})
            </h3>
          </div>
          {portalRequests.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No student portal enrollment requests submitted yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 max-h-[320px] overflow-y-auto">
              {portalRequests.map((req) => (
                <div key={req.id} className="p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">
                      {req.full_name}{' '}
                      <span className="font-mono text-xs text-slate-500">
                        ({req.student_id_assigned})
                      </span>
                    </span>
                    <span className="font-mono font-semibold">
                      {req.status === 'PENDING_HOD_APPROVAL' ? (
                        <span className="text-amber-700">PENDING HOD</span>
                      ) : req.status === 'APPROVED' ? (
                        <span className="text-emerald-700">APPROVED</span>
                      ) : (
                        <span className="text-red-600">REJECTED</span>
                      )}
                    </span>
                  </div>
                  <div className="font-mono text-slate-600">
                    Email: {req.email} · Phone: {req.phone}
                  </div>
                  <div className="text-slate-600">
                    Department: <strong>{req.department_name} ({req.department_code})</strong> · Semester {req.semester}
                  </div>
                  {req.status === 'PENDING_HOD_APPROVAL' && (
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onReviewPortalRequest(req.id, 'APPROVED')}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-md flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Portal Entry</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onReviewPortalRequest(req.id, 'REJECTED')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-red-700 font-semibold rounded-md flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Queue 2: "+ Add Booth" Enrollment Requests */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900">
              2. Department Booth Enrollment Requests ("+ Add Booth") ({boothRequests.length})
            </h3>
          </div>
          {boothRequests.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No booth enrollment requests submitted yet. Click "+ Add Booth" in the portal bar to request entry to a booth.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 max-h-[320px] overflow-y-auto">
              {boothRequests.map((breq) => (
                <div key={breq.id} className="p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">
                      {breq.booth_department_name} ({breq.booth_department_code} Booth)
                    </span>
                    <span className="font-mono font-semibold">
                      {breq.status === 'PENDING_HOD_APPROVAL' ? (
                        <span className="text-amber-700">PENDING HOD</span>
                      ) : breq.status === 'APPROVED' ? (
                        <span className="text-emerald-700">APPROVED</span>
                      ) : (
                        <span className="text-red-600">REJECTED</span>
                      )}
                    </span>
                  </div>
                  <div className="text-slate-700">
                    Requester: <strong>{breq.requester_name}</strong> ({breq.requester_role} ·{' '}
                    <span className="font-mono">{breq.requester_email}</span>)
                  </div>
                  {breq.status === 'PENDING_HOD_APPROVAL' && (
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onReviewBoothRequest(breq.id, 'APPROVED')}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-md flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Booth Entry</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onReviewBoothRequest(breq.id, 'REJECTED')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-red-700 font-semibold rounded-md flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
