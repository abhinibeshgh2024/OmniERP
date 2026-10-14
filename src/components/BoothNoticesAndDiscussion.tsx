import React, { useMemo, useState } from 'react';
import {
  Megaphone,
  MessageSquare,
  Plus,
  Send,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import {
  OmniERPDatabase,
  StudentRecord,
  FacultyRecord,
  DepartmentMetadata,
} from '../data/datasetGenerator';
import {
  UserRole,
  PublicNoticeItem,
  DiscussionThread,
} from '../data/operationalStore';

interface BoothNoticesAndDiscussionProps {
  db: OmniERPDatabase;
  activeBoothDept: DepartmentMetadata;
  role: UserRole;
  loggedInStudent: StudentRecord;
  loggedInFaculty: FacultyRecord;
  notices: PublicNoticeItem[];
  onPublishNotice: (notice: PublicNoticeItem) => void;
  discussions: DiscussionThread[];
  onCreateDiscussionThread: (thread: DiscussionThread) => void;
  onReplyToThread: (threadId: string, authorId: string, authorName: string, role: UserRole, message: string) => void;
}

export const BoothNoticesAndDiscussion: React.FC<BoothNoticesAndDiscussionProps> = ({
  db,
  activeBoothDept,
  role,
  loggedInStudent,
  loggedInFaculty,
  notices,
  onPublishNotice,
  discussions,
  onCreateDiscussionThread,
  onReplyToThread,
}) => {
  const [subTab, setSubTab] = useState<'DISCUSSION_PANEL' | 'NOTICES_REGULATIONS'>('DISCUSSION_PANEL');

  // New Discussion Thread State
  const deptCourses = activeBoothDept.courses;
  const [newThreadCourse, setNewThreadCourse] = useState<string>(deptCourses[0]?.course_code || '');
  const [newThreadTitle, setNewThreadTitle] = useState<string>('');
  const [newThreadBody, setNewThreadBody] = useState<string>('');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  // New Public Notice State (Faculty/Admin)
  const [noticeTitle, setNoticeTitle] = useState<string>('');
  const [noticeCategory, setNoticeCategory] =
    useState<PublicNoticeItem['category']>('Examination Circular');
  const [noticeScope, setNoticeScope] = useState<string>(activeBoothDept.department_code);
  const [noticePriority, setNoticePriority] = useState<PublicNoticeItem['priority']>('Standard');
  const [noticeBody, setNoticeBody] = useState<string>('');

  React.useEffect(() => {
    if (deptCourses[0]) {
      setNewThreadCourse(deptCourses[0].course_code);
    }
    setNoticeScope(activeBoothDept.department_code);
  }, [activeBoothDept.department_code, deptCourses]);

  const boothDiscussions = useMemo(
    () => discussions.filter((d) => d.department_code === activeBoothDept.department_code),
    [discussions, activeBoothDept.department_code]
  );

  const boothNotices = useMemo(
    () =>
      notices.filter(
        (n) =>
          n.target_department_code === 'ALL' ||
          n.target_department_code === activeBoothDept.department_code
      ),
    [notices, activeBoothDept.department_code]
  );

  const currentAuthor = useMemo(() => {
    if (role === 'STUDENT') {
      return { id: loggedInStudent.student_id, name: loggedInStudent.full_name };
    }
    if (role === 'FACULTY') {
      return { id: loggedInFaculty.faculty_id, name: loggedInFaculty.name };
    }
    return { id: 'ADMIN-REG-01', name: 'Office of the Registrar (Admin)' };
  }, [role, loggedInStudent, loggedInFaculty]);

  const handleStartDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !newThreadBody.trim()) return;

    const newThread: DiscussionThread = {
      id: `DISC-${activeBoothDept.department_code}-${Date.now().toString().slice(-4)}`,
      department_code: activeBoothDept.department_code,
      course_code: newThreadCourse,
      title: newThreadTitle.trim(),
      author_id: currentAuthor.id,
      author_name: currentAuthor.name,
      author_role: role,
      created_at: '2026-10-11 09:15',
      body: newThreadBody.trim(),
      replies: [],
    };
    onCreateDiscussionThread(newThread);
    setNewThreadTitle('');
    setNewThreadBody('');
  };

  const handlePostReply = (threadId: string) => {
    const msg = (replyInputs[threadId] || '').trim();
    if (!msg) return;
    onReplyToThread(threadId, currentAuthor.id, currentAuthor.name, role, msg);
    setReplyInputs((prev) => ({ ...prev, [threadId]: '' }));
  };

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeBody.trim()) return;

    const item: PublicNoticeItem = {
      id: `NOT-${Date.now().toString().slice(-4)}`,
      title: noticeTitle.trim(),
      category: noticeCategory,
      target_department_code: noticeScope,
      published_by: currentAuthor.name,
      published_date: '2026-10-11',
      priority: noticePriority,
      body: noticeBody.trim(),
    };
    onPublishNotice(item);
    setNoticeTitle('');
    setNoticeBody('');
  };

  return (
    <div className="space-y-6">
      {/* Sub-Header & Mode Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {activeBoothDept.department_name} ({activeBoothDept.department_code} Booth) — Discussion Panel & Public Notices
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Collaborate with faculty and students in the {activeBoothDept.department_code} Booth Discussion Forum or inspect statutory university regulations and circulars.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setSubTab('DISCUSSION_PANEL')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'DISCUSSION_PANEL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Booth Discussion Panel ({boothDiscussions.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('NOTICES_REGULATIONS')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'NOTICES_REGULATIONS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Notices & Regulations ({boothNotices.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: DEPARTMENTAL DISCUSSION PANEL */}
      {subTab === 'DISCUSSION_PANEL' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Active Threads List */}
          <div className="lg:col-span-8 space-y-4">
            {boothDiscussions.map((thread) => (
              <div
                key={thread.id}
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
              >
                <div className="pb-3 border-b border-slate-200">
                  <div className="text-xs text-slate-500 font-mono mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-bold text-slate-900">{thread.course_code}</span>
                    <span>·</span>
                    <span>Posted by {thread.author_name} ({thread.author_role})</span>
                    <span>·</span>
                    <span>{thread.created_at}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 break-words">{thread.title}</h3>
                  <p className="text-xs text-slate-700 leading-relaxed mt-2 break-words">{thread.body}</p>
                </div>

                {/* Replies */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-700">
                    Responses ({thread.replies.length}):
                  </div>
                  {thread.replies.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-3 sm:p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1 w-full max-w-full"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1 text-slate-500">
                        <span className="font-semibold text-slate-900 break-words">
                          {rep.author_name}{' '}
                          <span className="font-mono font-normal text-slate-500">
                            ({rep.author_role} · {rep.author_id})
                          </span>
                        </span>
                        <span className="font-mono text-[11px]">{rep.created_at}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed break-words">{rep.message}</p>
                    </div>
                  ))}
                </div>

                {/* Reply Input */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full max-w-full">
                  <input
                    type="text"
                    value={replyInputs[thread.id] || ''}
                    onChange={(e) =>
                      setReplyInputs((prev) => ({ ...prev, [thread.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handlePostReply(thread.id);
                      }
                    }}
                    placeholder={`Reply as ${currentAuthor.name} (${role})...`}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => handlePostReply(thread.id)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Reply</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Start New Discussion Thread Form */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-900 pb-3 mb-4 border-b border-slate-200">
              Start New Discussion in {activeBoothDept.department_code} Booth
            </h3>
            <form onSubmit={handleStartDiscussion} className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-500">Posting Identity</div>
                <div className="font-semibold text-slate-900 mt-0.5">
                  {currentAuthor.name} ({role})
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Course Context</label>
                <select
                  value={newThreadCourse}
                  onChange={(e) => setNewThreadCourse(e.target.value)}
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
                <label className="block font-medium text-slate-700 mb-1">Discussion Topic Title</label>
                <input
                  type="text"
                  required
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  placeholder="e.g., Doubt regarding Assignment 2 boundary conditions"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Question / Discussion Details</label>
                <textarea
                  rows={4}
                  required
                  value={newThreadBody}
                  onChange={(e) => setNewThreadBody(e.target.value)}
                  placeholder="Write your academic query, lab observation, or announcement..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Publish Thread to Booth</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUBTAB 2: PUBLIC NOTICES & UNIVERSITY REGULATIONS */}
      {subTab === 'NOTICES_REGULATIONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className={`${role !== 'STUDENT' ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
            {boothNotices.map((notice) => (
              <div
                key={notice.id}
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="font-mono text-slate-500">
                    <span className="font-bold text-slate-900">{notice.id}</span>
                    <span className="mx-2">·</span>
                    <span className="font-sans font-semibold text-slate-800">{notice.category}</span>
                    <span className="mx-2">·</span>
                    <span>
                      Scope:{' '}
                      {notice.target_department_code === 'ALL'
                        ? 'All 20 University Booths'
                        : `${notice.target_department_code} Booth`}
                    </span>
                  </div>
                  <div className="font-mono">
                    {notice.priority === 'Statutory Regulation' || notice.priority === 'Urgent' ? (
                      <span className="text-red-700 font-semibold">{notice.priority}</span>
                    ) : (
                      <span className="text-slate-600">{notice.priority}</span>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900">{notice.title}</h3>
                <p className="text-xs text-slate-700 leading-relaxed">{notice.body}</p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Issued by: {notice.published_by}</span>
                  <span className="font-mono">{notice.published_date}</span>
                </div>
              </div>
            ))}
          </div>

          {role !== 'STUDENT' && (
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-900 pb-3 mb-4 border-b border-slate-200">
                Publish Official Circular / Regulation
              </h3>
              <form onSubmit={handleCreateNotice} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Target Booth Scope</label>
                  <select
                    value={noticeScope}
                    onChange={(e) => setNoticeScope(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value={activeBoothDept.department_code}>
                      {activeBoothDept.department_code} Booth Only ({activeBoothDept.department_name})
                    </option>
                    <option value="ALL">Broadcast to All 20 Department Booths</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Category</label>
                    <select
                      value={noticeCategory}
                      onChange={(e) =>
                        setNoticeCategory(e.target.value as PublicNoticeItem['category'])
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    >
                      <option value="Examination Circular">Examination Circular</option>
                      <option value="Academic Regulation">Academic Regulation</option>
                      <option value="Departmental Seminar">Departmental Seminar</option>
                      <option value="Scholarship & Fee Circular">Scholarship & Fee Circular</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Priority</label>
                    <select
                      value={noticePriority}
                      onChange={(e) =>
                        setNoticePriority(e.target.value as PublicNoticeItem['priority'])
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Statutory Regulation">Statutory Regulation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Notice Title</label>
                  <input
                    type="text"
                    required
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="e.g., Revised End-Semester Practical Viva Schedule"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Official Text</label>
                  <textarea
                    rows={4}
                    required
                    value={noticeBody}
                    onChange={(e) => setNoticeBody(e.target.value)}
                    placeholder="Enter official circular or regulation details..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Megaphone className="w-4 h-4" />
                  <span>Publish Official Notice</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
