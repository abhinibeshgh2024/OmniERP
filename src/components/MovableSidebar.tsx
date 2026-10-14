import React, { useEffect } from 'react';
import {
  Calendar,
  Award,
  BookOpen,
  Megaphone,
  ShieldCheck,
  Building2,
  Plus,
  LogOut,
  Download,
  X,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  FileCheck,
} from 'lucide-react';
import { UserRole } from '../data/operationalStore';

export type InstituteWorkspaceTab =
  | 'CLASSES_AND_ATTENDANCE'
  | 'EXAMS_AND_MARKSHEETS'
  | 'MATERIALS_AND_LEAVES'
  | 'NOTICES_AND_DISCUSS'
  | 'NO_DUES_CLEARANCE'
  | 'HOD_AND_ADMIN';

interface MovableSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: InstituteWorkspaceTab;
  onSelectTab: (tab: InstituteWorkspaceTab) => void;
  role: UserRole;
  currentUser: {
    id: string;
    name: string;
    email: string;
    departmentCode: string;
  };
  enrolledBoothCodes: string[];
  activeBoothCode: string;
  onSelectBooth: (code: string) => void;
  pendingBoothRequestsCount: number;
  pendingPortalRequestsCount: number;
  onOpenAddBooth: () => void;
  onSignOut: () => void;
  onExportJSON: () => void;
  onSwitchStaffRole?: (targetRole: 'FACULTY' | 'HOD' | 'ADMIN') => void;
  isPinnedDesktop?: boolean;
  onTogglePinDesktop?: () => void;
}

export const MovableSidebar: React.FC<MovableSidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  role,
  currentUser,
  enrolledBoothCodes,
  activeBoothCode,
  onSelectBooth,
  pendingBoothRequestsCount,
  pendingPortalRequestsCount,
  onOpenAddBooth,
  onSignOut,
  onExportJSON,
  onSwitchStaffRole,
  isPinnedDesktop = false,
  onTogglePinDesktop,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Pending approvals visible ONLY to HOD and Admin
  const isApprovalsReviewer = role === 'HOD' || role === 'ADMIN';
  const totalHODPending = isApprovalsReviewer
    ? pendingPortalRequestsCount + pendingBoothRequestsCount
    : 0;

  const navItems = [
    {
      id: 'CLASSES_AND_ATTENDANCE' as InstituteWorkspaceTab,
      label: 'Classes & Attendance',
      subtext: 'Timetables, schedule & daily roll call',
      icon: Calendar,
      badge: null,
    },
    {
      id: 'EXAMS_AND_MARKSHEETS' as InstituteWorkspaceTab,
      label: 'Exams & Marksheets',
      subtext: 'Official transcripts & semester grades',
      icon: Award,
      badge: null,
    },
    {
      id: 'MATERIALS_AND_LEAVES' as InstituteWorkspaceTab,
      label: 'Materials & Leaves',
      subtext: 'Notes, syllabus & leave applications',
      icon: BookOpen,
      badge: null,
    },
    {
      id: 'NOTICES_AND_DISCUSS' as InstituteWorkspaceTab,
      label: 'Notices & Discuss',
      subtext: 'University circulars & student forums',
      icon: Megaphone,
      badge: null,
    },
    {
      id: 'NO_DUES_CLEARANCE' as InstituteWorkspaceTab,
      label: 'No Dues Clearance Slip',
      subtext: 'Semester, bus & hostel dues status & slip',
      icon: FileCheck,
      badge: null,
    },
    ...(isApprovalsReviewer
      ? [
          {
            id: 'HOD_AND_ADMIN' as InstituteWorkspaceTab,
            label: 'HOD & Admin Governance',
            subtext: 'Approval center & departmental oversight',
            icon: ShieldCheck,
            badge: totalHODPending > 0 ? `${totalHODPending} Pending` : null,
          },
        ]
      : []),
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none w-full">
      {/* Brand & University Header (Always on Left side) */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold font-display text-sm shrink-0">
              M
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 tracking-tight truncate font-display">
                Martinet ERP
              </h2>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                Usha Martin University, Ranchi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Desktop Pin Toggle */}
            {onTogglePinDesktop && (
              <button
                type="button"
                onClick={onTogglePinDesktop}
                title={isPinnedDesktop ? 'Unpin sidebar on desktop' : 'Pin sidebar on desktop'}
                className="hidden lg:inline-flex p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
                aria-label="Toggle pin"
              >
                {isPinnedDesktop ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Close button for mobile & tablet drawer */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* User Profile Badge */}
        <div className="mt-3.5 p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 shrink-0 font-semibold text-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 truncate">
                {currentUser.name}
              </div>
              <div className="text-[11px] font-mono text-slate-500 truncate">
                {currentUser.email}
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider shrink-0 ${
                role === 'STUDENT'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : role === 'HOD'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : role === 'ADMIN'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {role}
            </span>
          </div>

          {role === 'STUDENT' ? (
            <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1 border-t border-slate-100 pt-1.5">
              <GraduationCap className="w-3 h-3 text-slate-400" />
              <span>Dept: {currentUser.departmentCode} · Role strictly secured</span>
            </div>
          ) : (
            onSwitchStaffRole && (
              <div className="mt-2 pt-1.5 border-t border-slate-100">
                <div className="text-[10px] font-semibold text-slate-500 mb-1">
                  Staff Role Perspective:
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {(['FACULTY', 'HOD', 'ADMIN'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onSwitchStaffRole(r)}
                      className={`text-[10px] py-1 px-1.5 rounded font-semibold text-center transition-colors cursor-pointer ${
                        role === r
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {r}
                      {/* Only show pending count on HOD or ADMIN buttons */}
                      {r === 'HOD' && totalHODPending > 0 ? ` (${totalHODPending})` : ''}
                    </button>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Main Navigation Items (Timetable, marksheets, clearance all here ONLY) */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-6">
        <div>
          <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 px-2 mb-1.5">
            Academic Modules
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    // On small screens, close sidebar upon selection
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold leading-tight truncate">
                        {item.label}
                      </div>
                      <div
                        className={`text-[10px] leading-tight truncate ${
                          isActive ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        {item.subtext}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                        isActive
                          ? 'bg-amber-400 text-slate-900'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Departmental Booths Section */}
        <div className="pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3 h-3" />
              <span>Enrolled Booths ({enrolledBoothCodes.length})</span>
            </span>
            <button
              type="button"
              onClick={() => {
                onOpenAddBooth();
                if (window.innerWidth < 1024) onClose();
              }}
              className="text-[11px] font-semibold text-slate-900 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Booth</span>
            </button>
          </div>

          {enrolledBoothCodes.length === 0 ? (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <p className="text-[11px] text-slate-500 leading-snug">
                No booths unlocked yet.
              </p>
              <button
                type="button"
                onClick={() => {
                  onOpenAddBooth();
                  if (window.innerWidth < 1024) onClose();
                }}
                className="mt-2 w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Enroll in Booth (+ HOD)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {enrolledBoothCodes.map((bCode) => {
                const isCurrent = activeBoothCode === bCode;
                return (
                  <button
                    key={bCode}
                    type="button"
                    onClick={() => {
                      onSelectBooth(bCode);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-900 font-bold border border-slate-300'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${
                          isCurrent ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      />
                      <span>{bCode} Booth</span>
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-sans font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Pending booth requests badge: only show if relevant */}
          {pendingBoothRequestsCount > 0 && role === 'STUDENT' && (
            <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200 text-[10px] text-amber-800 flex items-center gap-1.5">
              <Clock className="w-3 h-3 shrink-0" />
              <span>
                {pendingBoothRequestsCount} Booth Request awaiting HOD Approval
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50/80 space-y-2">
        <button
          type="button"
          onClick={onExportJSON}
          className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Martinet Data (JSON)</span>
        </button>

        <button
          type="button"
          onClick={onSignOut}
          className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>

        <div className="text-center text-[10px] text-slate-400 pt-1">
          Sidebar docked strictly on Left · Touch Friendly
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Backdrop Overlay for Mobile/Tablet */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* 2. Slide-out Drawer strictly docked on the LEFT side */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 max-w-[85vw] shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Institute Sidebar"
      >
        {sidebarContent}
      </aside>
    </>
  );
};
