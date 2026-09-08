'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/firebase/auth-context';
import { Repository, UserFeedback } from '@/lib/firebase/repository';
import { Quiz } from '@/lib/validations/quiz';
import { Attempt } from '@/lib/validations/attempt';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  MessageSquare, 
  Send, 
  CheckCircle,
  HelpCircle,
  BookOpen,
  History,
  Award
} from 'lucide-react';

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Feedback State
  const [feedbackCategory, setFeedbackCategory] = useState<'feedback' | 'feature_request' | 'issue' | 'complaint'>('feedback');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const quizList = await Repository.getQuizzes();
        setQuizzes(quizList);

        if (profile?.id) {
          const studentAttempts = await Repository.getAttemptsByUser(profile.id);
          setAttempts(studentAttempts);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [profile?.id]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMsg.trim()) return;

    setFeedbackSubmitting(true);
    const feedbackItem: UserFeedback = {
      id: `fb-${Date.now()}`,
      studentId: profile?.email?.split('@')[0] || profile?.id || 'STU-2026',
      studentName: profile?.displayName || 'Student',
      category: feedbackCategory,
      message: feedbackMsg.trim(),
      submittedAt: new Date().toISOString(),
      status: 'new',
    };

    await Repository.submitFeedback(feedbackItem);
    setFeedbackSubmitting(false);
    setFeedbackMsg('');
    setFeedbackSuccess('✨ Thank you! Your feedback has been sent directly to the Admin.');

    setTimeout(() => {
      setFeedbackSuccess('');
    }, 5000);
  };

  // Split into active quizzes vs completed attempts
  const completedQuizIds = new Set(attempts.filter(a => a.status === 'submitted' || a.status === 'timed-out').map(a => a.quizId));
  const activeQuizzes = quizzes.filter(q => !completedQuizIds.has(q.id));
  const completedAttempts = attempts.filter(a => a.status === 'submitted' || a.status === 'timed-out');

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8">
      {/* Student Welcome Card */}
      <div className="bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="z-10 space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
            <span>👋 Hello, {profile?.displayName || 'Student'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to Ace Operating Systems? 🚀
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 max-w-md">
            Complete your assigned quizzes, review past performance, or launch hands-on simulations below.
          </p>
        </div>

        {/* Mascot Mini Buddy */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 relative rounded-2xl bg-white/10 p-2 border border-white/30 backdrop-blur-xs flex items-center justify-center shrink-0">
          <Image
            src="/images/buddy-avatar.png"
            alt="KernelBuddy"
            width={110}
            height={110}
            className="object-contain drop-shadow-md"
            priority
          />
        </div>
      </div>

      {/* SECTION 1: ACTIVE QUIZZES / TASKS ASSIGNED */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Active Quizzes & Tasks
              </h2>
              <p className="text-xs text-slate-500">Assigned by your instructor for CSE-307</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            {activeQuizzes.length} Available
          </span>
        </div>

        {activeQuizzes.length === 0 ? (
          <div className="bg-white/80 rounded-3xl border border-sky-100 p-8 text-center text-slate-500 shadow-xs">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-bold text-slate-800">You&apos;re all caught up!</h3>
            <p className="text-xs text-slate-400 mt-1">No active quizzes pending at this moment. Check past sessions below.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeQuizzes.map((quiz) => (
              <div 
                key={quiz.id}
                className="bg-white/95 backdrop-blur-md rounded-3xl border border-sky-100 p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active Assessment
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-sky-500" />
                      {quiz.timeLimitMinutes || 20} mins
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1 leading-snug">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                    {quiz.description || 'Master key Operating Systems mechanisms with interactive and textual questions.'}
                  </p>
                </div>

                <Link href={`/student/quizzes/${quiz.id}/attempt/new`}>
                  <Button 
                    className="w-full rounded-full bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white font-bold text-xs sm:text-sm py-2.5 shadow-sm transition-all flex items-center justify-center gap-2 group"
                  >
                    <span>Start Assessment</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: PAST SESSIONS DONE */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <History className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Past Sessions & History
              </h2>
              <p className="text-xs text-slate-500">Review your past scores and submissions</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {completedAttempts.length} Completed
          </span>
        </div>

        {completedAttempts.length === 0 ? (
          <div className="bg-white/80 rounded-3xl border border-slate-200/80 p-6 text-center text-slate-500 shadow-xs">
            <p className="text-xs">No completed sessions yet. Start an active quiz above to build your progress history!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {completedAttempts.map((att) => (
              <div 
                key={att.id}
                className="bg-white/95 rounded-3xl border border-slate-200 p-5 shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-700">Completed Session</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {quizzes.find(q => q.id === att.quizId)?.title || 'Operating Systems Assessment'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {new Date(att.submittedAt || att.startedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-lg font-extrabold text-slate-900">
                    {att.percentage !== undefined ? `${Math.round(att.percentage)}%` : (att.score !== undefined ? `${att.score}/${att.maxScore}` : 'Graded')}
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Recorded
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: DEDICATED PERSISTENT FEEDBACK & COMPLAINT BOX */}
      <div className="bg-gradient-to-br from-sky-50 via-teal-50/40 to-emerald-50/50 rounded-3xl border border-sky-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-sky-100 flex items-center justify-center text-sky-600">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Help Us Improve KernelBuddy 💡
            </h2>
            <p className="text-xs text-slate-500">
              Share your user experience, complaints, issues you are facing, or features you want. Submissions go straight to the Admin!
            </p>
          </div>
        </div>

        {feedbackSuccess && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackSuccess}</span>
          </div>
        )}

        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          {/* Category Selector Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'feedback', label: '✨ General Feedback' },
              { id: 'feature_request', label: '💡 Feature Request' },
              { id: 'issue', label: '🐛 Bug / Issue' },
              { id: 'complaint', label: '⚠️ Complain' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFeedbackCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  feedbackCategory === cat.id
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Dedicated Input Area */}
          <div>
            <textarea
              value={feedbackMsg}
              onChange={(e) => setFeedbackMsg(e.target.value)}
              placeholder="Type your feedback, complain, or requested feature here..."
              rows={3}
              required
              className="w-full rounded-2xl border border-sky-200 bg-white p-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:ring-sky-500 shadow-xs resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={feedbackSubmitting || !feedbackMsg.trim()}
              className="rounded-full bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-bold text-xs px-6 py-2 shadow-xs flex items-center gap-1.5 transition-all hover:scale-[1.02]"
            >
              <span>{feedbackSubmitting ? 'Sending...' : 'Submit to Admin'}</span>
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
