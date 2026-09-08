'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/auth-context';
import { Repository, RegisteredStudent, UserFeedback } from '@/lib/firebase/repository';
import { Quiz } from '@/lib/validations/quiz';
import { Attempt } from '@/lib/validations/attempt';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Activity, 
  PlusCircle, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Trash2, 
  Send,
  Eye,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Award,
  History,
  ArrowRight,
  BookOpen
} from 'lucide-react';

export default function AdminDashboard() {
  const { profile } = useAuth();

  // Metric states
  const [students, setStudents] = useState<RegisteredStudent[]>([]);
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'quizzes' | 'logs' | 'students' | 'feedbacks'>('quizzes');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sList, fList, qList, aList] = await Promise.all([
        Repository.getRegisteredStudents(),
        Repository.getFeedbacks(),
        Repository.getQuizzes(),
        Repository.getAllAttempts(),
      ]);
      setStudents(sList);
      setFeedbacks(fList);
      setQuizzes(qList);
      setAttempts(aList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  return (
    <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 xl:px-12 py-6 sm:py-8 space-y-8">
      {/* Top Banner (Mint Theme) */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="z-10 space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {profile?.displayName || 'Admin'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl font-medium">
            Manage your registered students, live platform traffic, create &amp; assign new quizzes, and inspect student session logs and feedbacks.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
          <Link href="/student/dashboard">
            <Button 
              variant="outline" 
              className="rounded-full bg-white/95 text-emerald-900 border-white hover:bg-white text-xs font-bold px-5 shadow-sm"
            >
              <Eye className="w-4 h-4 mr-1.5" />
              <span>Preview Student View</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Analytics Metrics (Clean Dynamic Data) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Registered Students */}
        <div 
          onClick={() => setActiveTab('students')}
          className={`bg-white/95 backdrop-blur-md rounded-3xl border p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group ${
            activeTab === 'students' ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-emerald-100 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Live DB
            </span>
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Registered Students
          </h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              {students.length}
            </span>
            <span className="text-xs font-semibold text-emerald-700">Enrolled Students</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Click to view student IDs &amp; roster
          </p>
        </div>

        {/* Card 2: Website Traffic & Live Submissions */}
        <div 
          onClick={() => setActiveTab('logs')}
          className={`bg-white/95 backdrop-blur-md rounded-3xl border p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group ${
            activeTab === 'logs' ? 'border-teal-500 ring-2 ring-teal-200' : 'border-emerald-100 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
              Active Online
            </span>
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Platform Traffic &amp; Submissions
          </h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              {attempts.length}
            </span>
            <span className="text-xs font-semibold text-teal-700">Submissions Processed</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Click to inspect student session logs
          </p>
        </div>

        {/* Card 3: Feedbacks & Complaints */}
        <div 
          onClick={() => setActiveTab('feedbacks')}
          className={`bg-white/95 backdrop-blur-md rounded-3xl border p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group ${
            activeTab === 'feedbacks' ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-emerald-100 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {feedbacks.length} Total
            </span>
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            User Feedbacks &amp; Complaints
          </h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              {feedbacks.length}
            </span>
            <span className="text-xs font-semibold text-amber-700">Needs Review</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Click to read suggestions &amp; issue reports
          </p>
        </div>
      </div>

      {/* PROMINENT CARD: CREATE & ASSIGN ASSIGNMENT */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-mint-50 rounded-3xl border-2 border-emerald-300/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-extrabold tracking-wide shadow-xs">
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Assignment Authoring Studio</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-950">
            Create &amp; Assign Assignment
          </h2>
          <p className="text-xs sm:text-sm text-emerald-900/80 max-w-2xl font-medium">
            Start with a clean slate without default questions. Name your assignment, assign time limits, create MCQs with 3 to 10 options (1 mark default), specify custom marks for textual questions, and publish live.
          </p>
        </div>

        <Link href="/instructor/quizzes/create" className="shrink-0 w-full sm:w-auto">
          <Button 
            size="lg"
            className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm px-8 py-6 shadow-md hover:shadow-xl transition-all hover:scale-[1.03] flex items-center justify-center gap-2 group"
          >
            <span>+ Create &amp; Assign Assignment</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>

      {/* Nav Tabs for Admin Views */}
      <div className="flex flex-wrap items-center gap-2 border-b border-emerald-100/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('quizzes')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'quizzes'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white/80 text-slate-600 hover:bg-emerald-50 hover:text-emerald-950 border border-emerald-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Past Created Quizzes ({quizzes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white/80 text-slate-600 hover:bg-emerald-50 hover:text-emerald-950 border border-emerald-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Past Sessions &amp; Submissions Log ({attempts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'students'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white/80 text-slate-600 hover:bg-emerald-50 hover:text-emerald-950 border border-emerald-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registered Students ({students.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('feedbacks')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'feedbacks'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white/80 text-slate-600 hover:bg-emerald-50 hover:text-emerald-950 border border-emerald-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Feedbacks &amp; Complaints ({feedbacks.length})</span>
        </button>
      </div>

      {/* TAB 1: PAST CREATED QUIZZES & ASSIGNMENTS */}
      {activeTab === 'quizzes' && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-100 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Past Created Quizzes &amp; Assignments
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All live and past assessments published to students on the platform.
              </p>
            </div>

            <Link href="/instructor/quizzes/create">
              <Button size="sm" className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Create New Assignment</span>
              </Button>
            </Link>
          </div>

          {quizzes.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-700">No quizzes created yet.</p>
              <p className="text-xs text-slate-500">Click &ldquo;Create &amp; Assign Assignment&rdquo; above to publish your first task.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {quizzes.map((quiz) => {
                const quizAttempts = attempts.filter(a => a.quizId === quiz.id);
                return (
                  <div 
                    key={quiz.id}
                    className="bg-slate-50/70 rounded-2xl border border-emerald-100 p-5 flex flex-col justify-between hover:border-emerald-300 transition-all shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {quiz.mode.toUpperCase()}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          {quiz.timeLimitMinutes} mins
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 line-clamp-2 mb-1">
                        {quiz.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                        {quiz.description || 'Assigned OS Assessment'}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 py-2 border-t border-slate-200/60">
                        <span>📝 {quiz.questionIds?.length || 5} Questions</span>
                        <span>&bull;</span>
                        <span>👥 {quizAttempts.length} Submissions</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Created: {new Date(quiz.createdAt).toLocaleDateString()}
                      </span>
                      <Link href={`/student/quizzes/${quiz.id}/attempt/new`}>
                        <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold border-emerald-200 text-emerald-800 hover:bg-emerald-50 h-7 px-3">
                          Test / View
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LOGS & PAST SESSIONS */}
      {activeTab === 'logs' && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-100 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Student Past Sessions &amp; Submissions Log
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Full chronological audit trail of all student assessment submissions and evaluations.
              </p>
            </div>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              {attempts.length} Total Sessions
            </span>
          </div>

          {attempts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30 text-teal-600" />
              <p className="text-sm font-semibold text-slate-700">No session logs yet.</p>
              <p className="text-xs text-slate-500">Student submissions will appear here in real-time as they complete assessments.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-emerald-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Quiz / Assignment</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4">Submitted At</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attempts.map((att) => {
                    const score = att.score ?? 0;
                    const max = att.maxScore ?? 15;
                    const pct = att.percentage ?? (max > 0 ? Math.round((score / max) * 100) : 0);
                    const quizItem = quizzes.find(q => q.id === att.quizId);

                    return (
                      <tr key={att.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                          {att.userId}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {att.userName || 'Student'}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700 max-w-xs truncate">
                          {quizItem?.title || att.quizId}
                        </td>
                        <td className="py-3.5 px-4 font-bold font-mono text-slate-800">
                          {score} / {max}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                            pct >= 80 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : pct >= 50 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {pct}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(att.submittedAt || att.startedAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Submitted
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link href={`/student/quizzes/${att.quizId}/attempt/${att.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-emerald-700 hover:bg-emerald-50">
                              View Answers
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REGISTERED STUDENTS */}
      {activeTab === 'students' && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-100 p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Registered Students Roster
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              All students who have created an account or enrolled in the platform.
            </p>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-700">No registered students yet.</p>
              <p className="text-xs text-slate-500">Students can create an account on the portal page using their Student ID (e.g. 202014019).</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-emerald-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Registration Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {s.studentId}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {s.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(s.registeredAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FEEDBACKS & COMPLAINTS */}
      {activeTab === 'feedbacks' && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-100 p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Student Feedbacks, Issues &amp; Feature Requests
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live submissions received from the dedicated feedback input field on the student home page.
            </p>
          </div>

          {feedbacks.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-700">No feedback submissions yet.</p>
              <p className="text-xs text-slate-500">When students submit feedback from their dashboard, it will appear here live.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedbacks.map((fb) => (
                <div key={fb.id} className="bg-slate-50 rounded-2xl border border-emerald-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        fb.category === 'issue' || fb.category === 'complaint'
                          ? 'bg-rose-100 text-rose-700'
                          : fb.category === 'feature_request'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {fb.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {fb.studentName} ({fb.studentId})
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 font-medium">
                      &ldquo;{fb.message}&rdquo;
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(fb.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
