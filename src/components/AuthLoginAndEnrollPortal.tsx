import React, { useMemo, useState } from 'react';
import {
  Lock,
  Mail,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Clock,
  ArrowRight,
  KeyRound,
} from 'lucide-react';
import {
  OmniERPDatabase,
  StudentRecord,
  FacultyRecord,
} from '../data/datasetGenerator';
import {
  UserRole,
  PortalEnrollmentRequest,
} from '../data/operationalStore';

interface AuthLoginAndEnrollPortalProps {
  db: OmniERPDatabase;
  studentsList: StudentRecord[];
  portalRequests: PortalEnrollmentRequest[];
  onSubmitPortalEnrollment: (req: PortalEnrollmentRequest) => void;
  onLoginSuccess: (
    role: UserRole,
    identity: {
      id: string;
      name: string;
      email: string;
      departmentCode: string;
    }
  ) => void;
}

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_REGEX = /^[0-9]{10}$/;
const NAME_REGEX = /^[A-Za-z\s.]{3,60}$/;

export function validatePasswordRules(pw: string) {
  return {
    minLength: pw.length >= 8,
    hasUpper: /[A-Z]/.test(pw),
    hasLower: /[a-z]/.test(pw),
    hasDigit: /[0-9]/.test(pw),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw),
  };
}

export const AuthLoginAndEnrollPortal: React.FC<AuthLoginAndEnrollPortalProps> = ({
  db,
  studentsList,
  portalRequests,
  onSubmitPortalEnrollment,
  onLoginSuccess,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [studentMode, setStudentMode] = useState<'LOGIN' | 'NEW_ENROLL'>('LOGIN');

  // Form Fields
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [deptCode, setDeptCode] = useState<string>('CSE');
  const [semester, setSemester] = useState<number>(1);

  // Feedback States
  const [authError, setAuthError] = useState<string | null>(null);
  const [enrollSentConfirmation, setEnrollSentConfirmation] =
    useState<PortalEnrollmentRequest | null>(null);

  // Live Format Validation Computations
  const isEmailValid = useMemo(() => EMAIL_REGEX.test(email.trim()), [email]);
  const pwRules = useMemo(() => validatePasswordRules(password), [password]);
  const isPasswordValid =
    pwRules.minLength &&
    pwRules.hasUpper &&
    pwRules.hasLower &&
    pwRules.hasDigit &&
    pwRules.hasSpecial;
  const isPhoneValid = useMemo(() => PHONE_REGEX.test(phone.trim()), [phone]);
  const isNameValid = useMemo(() => NAME_REGEX.test(fullName.trim()), [fullName]);

  const isLoginFormCleared = isEmailValid && isPasswordValid;
  const isEnrollFormCleared =
    isNameValid && isEmailValid && isPhoneValid && isPasswordValid;

  const pendingPortalCount = useMemo(
    () => portalRequests.filter((r) => r.status === 'PENDING_HOD_APPROVAL').length,
    [portalRequests]
  );

  // Quick-fill helper for demo testing while obeying all format validation rules
  const handleFillDemoAccount = (targetRole: UserRole) => {
    setSelectedRole(targetRole);
    setStudentMode('LOGIN');
    setAuthError(null);
    setEnrollSentConfirmation(null);

    if (targetRole === 'STUDENT') {
      const stu = studentsList[0];
      setEmail(stu.email);
      setPassword('Student@2026');
    } else if (targetRole === 'FACULTY') {
      const fac = db.faculty[1];
      setEmail(fac.email);
      setPassword('Faculty@2026');
    } else if (targetRole === 'HOD') {
      const hodFac = db.faculty[0];
      setEmail(hodFac.email);
      setPassword('HodAdmin@2026');
    } else {
      setEmail('registrar@ushamartin.edu.in');
      setPassword('Admin@2026');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!isLoginFormCleared) return;

    const normalizedEmail = email.trim().toLowerCase();

    if (selectedRole === 'STUDENT') {
      // 1. Check if this email has a pending or rejected request in portalRequests
      const matchingReq = portalRequests.find(
        (r) => r.email.toLowerCase() === normalizedEmail
      );

      if (matchingReq) {
        if (matchingReq.status === 'PENDING_HOD_APPROVAL') {
          setAuthError(
            'Request to enroll is sent — Your student enrollment request is currently awaiting approval from the Head of Department (HOD). Entry is granted only after HOD approval.'
          );
          return;
        }
        if (matchingReq.status === 'REJECTED') {
          setAuthError(
            'Your enrollment request was declined by the HOD. Please contact the Department Office.'
          );
          return;
        }
        // Approved new student!
        onLoginSuccess('STUDENT', {
          id: matchingReq.student_id_assigned,
          name: matchingReq.full_name,
          email: matchingReq.email,
          departmentCode: matchingReq.department_code,
        });
        return;
      }

      // 2. Check if student already exists in the 300-student roster
      const existingStu = studentsList.find(
        (s) => s.email.toLowerCase() === normalizedEmail
      );
      if (existingStu) {
        onLoginSuccess('STUDENT', {
          id: existingStu.student_id,
          name: existingStu.full_name,
          email: existingStu.email,
          departmentCode: existingStu.department_code,
        });
        return;
      }

      // Not found in portal -> guide them to New Student Enrollment
      setAuthError(
        'Email not found in registered student roster. Since you are not in the portal yet, please switch to "New Student Enrollment (Not in Portal)" above to send an enrollment request to the HOD.'
      );
      return;
    }

    if (selectedRole === 'FACULTY') {
      const existingFac =
        db.faculty.find((f) => f.email.toLowerCase() === normalizedEmail) ||
        db.faculty[1];
      onLoginSuccess('FACULTY', {
        id: existingFac.faculty_id,
        name: existingFac.name,
        email: normalizedEmail,
        departmentCode: existingFac.department_code,
      });
      return;
    }

    if (selectedRole === 'HOD') {
      const matchingHod =
        db.faculty.find((f) => f.email.toLowerCase() === normalizedEmail) ||
        db.faculty[0];
      onLoginSuccess('HOD', {
        id: matchingHod.faculty_id,
        name: `${matchingHod.name} (HOD)`,
        email: normalizedEmail,
        departmentCode: matchingHod.department_code,
      });
      return;
    }

    if (selectedRole === 'ADMIN') {
      onLoginSuccess('ADMIN', {
        id: 'ADMIN-REG-001',
        name: 'Chief Institute Registrar (Admin)',
        email: normalizedEmail,
        departmentCode: 'CSE',
      });
    }
  };

  const handleNewStudentEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!isEnrollFormCleared) return;

    const normalizedEmail = email.trim().toLowerCase();
    const existingReq = portalRequests.find(
      (r) => r.email.toLowerCase() === normalizedEmail
    );
    if (existingReq) {
      setEnrollSentConfirmation(existingReq);
      return;
    }

    const deptObj =
      db.departments.find((d) => d.department_code === deptCode) ||
      db.departments[0];

    const newReq: PortalEnrollmentRequest = {
      id: `ENR-REQ-${Date.now().toString().slice(-4)}`,
      student_id_assigned: `STU-2026-${String(301 + portalRequests.length).padStart(4, '0')}`,
      full_name: fullName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      department_code: deptObj.department_code,
      department_name: deptObj.department_name,
      semester,
      status: 'PENDING_HOD_APPROVAL',
      submitted_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    onSubmitPortalEnrollment(newReq);
    setEnrollSentConfirmation(newReq);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between">
      {/* Top Bar Contract */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-8">
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Martinet
          </span>
          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
            Usha Martin University, Ranchi
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
          <span className="whitespace-nowrap">Role-Based Portals</span>
          <span>·</span>
          <span className="whitespace-nowrap">HOD Approval Gatekeeper</span>
          <span>·</span>
          <span className="whitespace-nowrap">20 Department Booths</span>
        </nav>
        <div className="text-xs font-mono text-slate-600 tabular-nums shrink-0">
          Pending HOD Approvals: <span className="font-bold text-slate-900">{pendingPortalCount}</span>
        </div>
      </header>

      {/* Main Authentication & Enrollment Split Container */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Role Login & Student Enrollment Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 sm:p-8 space-y-5 sm:space-y-6">
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1">
              USHA MARTIN UNIVERSITY, RANCHI — OFFICIAL ERP
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Martinet Portal Login & Student Enrollment
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Select your role to sign in. Students who are not yet registered in the portal must fill out the New Student Enrollment form with registered email, phone number, and name to send an enrollment request to the HOD.
            </p>
          </div>

          {/* 4-Role Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'STUDENT', label: 'Student' },
                { id: 'FACULTY', label: 'Faculty' },
                { id: 'HOD', label: `HOD (${pendingPortalCount})` },
                { id: 'ADMIN', label: 'Admin' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedRole(tab.id);
                  setAuthError(null);
                  setEnrollSentConfirmation(null);
                }}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  selectedRole === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Student Sub-Mode Toggle: Registered Login vs New Student Enrollment */}
          {selectedRole === 'STUDENT' && (
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-1 border-b border-slate-200 pb-4">
              <button
                type="button"
                onClick={() => {
                  setStudentMode('LOGIN');
                  setAuthError(null);
                  setEnrollSentConfirmation(null);
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                  studentMode === 'LOGIN'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Registered Student Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setStudentMode('NEW_ENROLL');
                  setAuthError(null);
                  setEnrollSentConfirmation(null);
                  setEmail('');
                  setPassword('');
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                  studentMode === 'NEW_ENROLL'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                New Student Enrollment (Not in Portal)
              </button>
            </div>
          )}

          {/* Confirmation Screen when a New Student submits Enrollment Request */}
          {selectedRole === 'STUDENT' &&
          studentMode === 'NEW_ENROLL' &&
          enrollSentConfirmation ? (
            <div className="p-6 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-4">
              <div className="flex items-center gap-2.5 text-emerald-900">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <h2 className="text-lg font-bold tracking-tight">
                  Request to enroll is sent
                </h2>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Your student enrollment request has been registered and routed to the{' '}
                <strong>Head of Department (HOD)</strong> of{' '}
                <strong>{enrollSentConfirmation.department_name}</strong>. Portal entry will be granted{' '}
                <strong>only after your request is approved by the HOD</strong>.
              </p>
              <div className="p-4 rounded-lg bg-white border border-slate-200 text-xs font-mono space-y-1.5 text-slate-700">
                <div>Request ID: <span className="font-bold text-slate-900">{enrollSentConfirmation.id}</span></div>
                <div>Provisional Student ID: <span className="font-bold text-slate-900">{enrollSentConfirmation.student_id_assigned}</span></div>
                <div>Applicant Name: <span className="font-sans font-semibold text-slate-900">{enrollSentConfirmation.full_name}</span></div>
                <div>Registered Email: {enrollSentConfirmation.email}</div>
                <div>Phone Number: {enrollSentConfirmation.phone}</div>
                <div>Status: <span className="text-amber-700 font-bold">PENDING HOD APPROVAL</span></div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleFillDemoAccount('HOD')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <span>Switch to HOD Login to Approve This Request</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEnrollSentConfirmation(null);
                    setStudentMode('LOGIN');
                  }}
                  className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Back to Student Login
                </button>
              </div>
            </div>
          ) : selectedRole === 'STUDENT' && studentMode === 'NEW_ENROLL' ? (
            /* NEW STUDENT ENROLLMENT FORM */
            <form onSubmit={handleNewStudentEnrollSubmit} className="space-y-4">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <strong>New Student Portal Registration:</strong> Enter your full name, registered email, 10-digit phone number, and password. Upon submitting, your request will be sent to the HOD for approval.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (Alphabetic, min 3 characters)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Rohan Deshmukh"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g., rohan.d@omnierp.univ.edu"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Phone Number (10 Digits)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g., 9876543210"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono tabular-nums focus:outline-none focus:bg-white focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Department (For HOD Routing)
                  </label>
                  <select
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
                  >
                    {db.departments.map((d) => (
                      <option key={d.department_code} value={d.department_code}>
                        {d.department_code} — {d.department_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Create Portal Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars, 1 upper, 1 lower, 1 digit, 1 special"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Strict Format Validation Checklist */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="font-semibold text-slate-800 mb-1">
                  Mandatory Format Validation Rules (Submit is restricted until all clear):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <div className={isNameValid ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    {isNameValid ? '✓' : '○'} Full Name (3+ alphabetic chars)
                  </div>
                  <div className={isEmailValid ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    {isEmailValid ? '✓' : '○'} Valid Email (user@domain.tld)
                  </div>
                  <div className={isPhoneValid ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    {isPhoneValid ? '✓' : '○'} 10-Digit Phone Number ({phone.length}/10)
                  </div>
                  <div className={pwRules.minLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    {pwRules.minLength ? '✓' : '○'} Password Min 8 Characters
                  </div>
                  <div
                    className={
                      pwRules.hasUpper && pwRules.hasLower
                        ? 'text-emerald-700 font-medium'
                        : 'text-slate-500'
                    }
                  >
                    {pwRules.hasUpper && pwRules.hasLower ? '✓' : '○'} Uppercase & Lowercase Letters
                  </div>
                  <div
                    className={
                      pwRules.hasDigit && pwRules.hasSpecial
                        ? 'text-emerald-700 font-medium'
                        : 'text-slate-500'
                    }
                  >
                    {pwRules.hasDigit && pwRules.hasSpecial ? '✓' : '○'} Number (0-9) & Special (@#$%)
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!isEnrollFormCleared}
                className={`w-full py-3 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  isEnrollFormCleared
                    ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isEnrollFormCleared
                    ? 'Submit Enrollment Request to HOD'
                    : 'Complete All Format Validations Above to Enable Submit'}
                </span>
              </button>
            </form>
          ) : (
            /* STANDARD LOGIN FORM FOR STUDENT / FACULTY / HOD / ADMIN */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {authError && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-2">
                  <div className="flex items-start gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                  {authError.includes('Request to enroll is sent') && (
                    <button
                      type="button"
                      onClick={() => handleFillDemoAccount('HOD')}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-md font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Switch to HOD Login to Approve Request</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered {selectedRole} Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={`e.g., ${selectedRole.toLowerCase()}@omnierp.univ.edu`}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Portal Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars, uppercase, lowercase, digit & special char"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Strict Format Validation Checklist */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="font-semibold text-slate-800 mb-1">
                  Login Format Validation Gate (Submit disabled until cleared):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <div className={isEmailValid ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    {isEmailValid ? '✓' : '○'} Valid Email Format (user@domain.tld)
                  </div>
                  <div className={pwRules.minLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    {pwRules.minLength ? '✓' : '○'} Password Min 8 Characters
                  </div>
                  <div
                    className={
                      pwRules.hasUpper && pwRules.hasLower
                        ? 'text-emerald-700 font-medium'
                        : 'text-slate-500'
                    }
                  >
                    {pwRules.hasUpper && pwRules.hasLower ? '✓' : '○'} Uppercase & Lowercase Letters
                  </div>
                  <div
                    className={
                      pwRules.hasDigit && pwRules.hasSpecial
                        ? 'text-emerald-700 font-medium'
                        : 'text-slate-500'
                    }
                  >
                    {pwRules.hasDigit && pwRules.hasSpecial ? '✓' : '○'} Number (0-9) & Special (@#$%)
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!isLoginFormCleared}
                className={`w-full py-3 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  isLoginFormCleared
                    ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>
                  {isLoginFormCleared
                    ? `Sign In to ${selectedRole} Portal`
                    : 'Enter Valid Email & Strong Password to Enable Sign In'}
                </span>
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Quick Validated Credential Presets & Pending HOD Queue Summary */}
        <div className="lg:col-span-5 space-y-6">
          {/* One-Click Validated Demo Credentials */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                One-Click Validated Demo Credentials
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any role card below to auto-fill format-compliant credentials and test the Student, Faculty, HOD Approval, and Admin workflows.
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <button
                type="button"
                onClick={() => handleFillDemoAccount('STUDENT')}
                className="w-full text-left p-3.5 rounded-lg border border-slate-200 hover:border-slate-900 bg-slate-50 hover:bg-white transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900">Registered Student Account</div>
                  <div className="font-mono text-slate-600 mt-0.5">
                    {studentsList[0].email} · Pass: Student@2026
                  </div>
                </div>
                <span className="font-semibold text-slate-900 shrink-0">Fill →</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('STUDENT');
                  setStudentMode('NEW_ENROLL');
                  setFullName('Aarav Mehta');
                  setEmail('aarav.mehta@ushamartin.edu.in');
                  setPhone('9845012345');
                  setPassword('NewStudent@2026');
                  setAuthError(null);
                  setEnrollSentConfirmation(null);
                }}
                className="w-full text-left p-3.5 rounded-lg border border-slate-200 hover:border-slate-900 bg-slate-50 hover:bg-white transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    Unregistered Student (Test "Request to enroll is sent")
                  </div>
                  <div className="font-mono text-slate-600 mt-0.5">
                    aarav.mehta@ushamartin.edu.in · Phone: 9845012345
                  </div>
                </div>
                <span className="font-semibold text-slate-900 shrink-0">Fill →</span>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemoAccount('HOD')}
                className="w-full text-left p-3.5 rounded-lg border border-slate-200 hover:border-slate-900 bg-slate-50 hover:bg-white transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    Head of Department (HOD — Approves Enrollments & Booths)
                  </div>
                  <div className="font-mono text-slate-600 mt-0.5">
                    {db.faculty[0].email} · Pass: HodAdmin@2026
                  </div>
                </div>
                <span className="font-semibold text-slate-900 shrink-0">Fill →</span>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemoAccount('FACULTY')}
                className="w-full text-left p-3.5 rounded-lg border border-slate-200 hover:border-slate-900 bg-slate-50 hover:bg-white transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900">Faculty Member Account</div>
                  <div className="font-mono text-slate-600 mt-0.5">
                    {db.faculty[1].email} · Pass: Faculty@2026
                  </div>
                </div>
                <span className="font-semibold text-slate-900 shrink-0">Fill →</span>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemoAccount('ADMIN')}
                className="w-full text-left p-3.5 rounded-lg border border-slate-200 hover:border-slate-900 bg-slate-50 hover:bg-white transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900">University Administrator Account</div>
                  <div className="font-mono text-slate-600 mt-0.5">
                    registrar@ushamartin.edu.in · Pass: Admin@2026
                  </div>
                </div>
                <span className="font-semibold text-slate-900 shrink-0">Fill →</span>
              </button>
            </div>
          </div>

          {/* Live Status of Portal Enrollment Requests */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Student Portal Enrollment Requests ({portalRequests.length})
            </h3>
            {portalRequests.length === 0 ? (
              <p className="text-xs text-slate-500">
                No new student enrollment requests submitted yet. Use the "New Student Enrollment" tab to submit one.
              </p>
            ) : (
              <div className="space-y-2">
                {portalRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {req.full_name} ({req.department_code})
                      </div>
                      <div className="font-mono text-slate-500">
                        {req.email} · {req.phone}
                      </div>
                    </div>
                    <div className="font-mono font-semibold shrink-0">
                      {req.status === 'PENDING_HOD_APPROVAL' ? (
                        <span className="inline-flex items-center gap-1 text-amber-700">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending HOD</span>
                        </span>
                      ) : req.status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approved</span>
                        </span>
                      ) : (
                        <span className="text-red-600">Rejected</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 px-6 py-4 text-center text-xs text-slate-500">
        Martinet ERP · Usha Martin University, Ranchi · Role-Based Security & HOD Approval Gatekeeper
      </footer>
    </div>
  );
};
