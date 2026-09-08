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
  BookOpen, 
  History, 
  Award,
  AlertCircle
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
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

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
    if (!feedbackMsg.trim()) {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 1500);
      return;
    }

    setFeedbackSubmitting(true);
    const feedbackItem: UserFeedback = {
      id: `fb-${Date.now()}`,
      studentId: profile?.email?.split('@')[0] || profile?.id || '202014019',
      studentName: profile?.displayName || 'Student',
      category: feedbackCategory,
      message: feedbackMsg.trim(),
      submittedAt: new Date().toISOString(),
      status: 'new',
    };

    await Repository.submitFeedback(feedbackItem);
    setFeedbackSubmitting(false);
    setFeedbackMsg('');
    setSubmitStatus('success');
    setFeedbackSuccess('✨ Thank you! Your feedback has been transmitted directly to Admin Khaled.');

    setTimeout(() => {
      setSubmitStatus('idle');
      setFeedbackSuccess('');
    }, 5000);
  };

  // Split into active quizzes vs completed attempts
  const completedQuizIds = new Set(attempts.filter(a => a.status === 'submitted' || a.status === 'timed-out').map(a => a.quizId));
  const activeQuizzes = quizzes.filter(q => !completedQuizIds.has(q.id));
  const completedAttempts = attempts.filter(a => a.status === 'submitted' || a.status === 'timed-out');

  return (
    <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 xl:px-12 py-6 sm:py-8 space-y-8">
      {/* Student Welcome Card (Mint Theme) */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="z-10 space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
            <span>👋 Hello, {profile?.displayName || 'Student'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Ready to Master Operating Systems? 🚀
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-lg font-medium">
            Complete your assigned live class tasks, review detailed justifications of past answers, or submit direct feedback below.
          </p>
        </div>

        {/* Mascot Mini Buddy */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 relative rounded-2xl bg-white/10 p-2 border border-white/30 backdrop-blur-xs flex items-center justify-center shrink-0 animate-buddy-float">
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
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Active Assigned Quizzes &amp; Tasks
              </h2>
              <p className="text-xs text-slate-500">Live assessments assigned for your class</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            {activeQuizzes.length} Available
          </span>
        </div>

        {activeQuizzes.length === 0 ? (
          <div className="bg-white/90 rounded-3xl border border-emerald-100 p-8 text-center text-slate-500 shadow-xs">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-bold text-slate-800">You&apos;re all caught up!</h3>
            <p className="text-xs text-slate-400 mt-1">No pending quizzes at this moment. Review your completed sessions below.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeQuizzes.map((quiz) => (
              <div 
                key={quiz.id}
                className="bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-100 p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all hover:scale-[1.01] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Live Class Task
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      {quiz.timeLimitMinutes || 25} mins
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1.5 leading-snug">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                    {quiz.description || 'Master key Operating Systems mechanisms with interactive, textual, and MCQ questions.'}
                  </p>
                </div>

                <Link href={`/student/quizzes/${quiz.id}/attempt/new`}>
                  <Button 
                    className="w-full rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm py-2.5 shadow-sm transition-all flex items-center justify-center gap-2 group"
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
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <History className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Completed Assessment Sessions
              </h2>
              <p className="text-xs text-slate-500">Your historical score records and performance</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            {completedAttempts.length} Completed
          </span>
        </div>

        {completedAttempts.length === 0 ? (
          <div className="bg-white/80 rounded-3xl border border-emerald-100/80 p-6 text-center text-slate-500 shadow-xs">
            <p className="text-xs">No completed sessions yet. Start an active quiz above to build your progress history!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {completedAttempts.map((att) => (
              <div 
                key={att.id}
                className="bg-white/95 rounded-3xl border border-emerald-100 p-5 shadow-xs flex items-center justify-between hover:border-emerald-200 transition-all"
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
                  <div className="text-lg font-extrabold text-emerald-800">
                    {att.percentage !== undefined ? `${Math.round(att.percentage)}%` : (att.score !== undefined ? `${att.score}/${att.maxScore}` : 'Graded')}
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Recorded
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: DEDICATED PERSISTENT FEEDBACK / COMPLAIN INPUT */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-200/90 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Help Us Improve KernelBuddy 💡
            </h2>
            <p className="text-xs text-slate-500">
              Share your user experience, complaints, issues you are facing, or features you want. Submissions go straight to Admin Khaled!
            </p>
          </div>
        </div>

        {feedbackSuccess && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-pop-success">
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
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-600 border-emerald-100 hover:bg-emerald-50'
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
              className="w-full rounded-2xl border border-emerald-200/90 bg-white p-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500 shadow-xs resize-none"
            />
          </div>

          {/* Submit Button with animated states */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={feedbackSubmitting || !feedbackMsg.trim()}
              className={`rounded-full text-white font-bold text-xs px-7 py-2.5 shadow-xs flex items-center gap-1.5 transition-all duration-300 ${
                submitStatus === 'success'
                  ? 'bg-emerald-600 ring-4 ring-emerald-300 animate-pop-success'
                  : submitStatus === 'error'
                  ? 'bg-rose-600 ring-4 ring-rose-300 animate-shake-error'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 hover:scale-[1.02]'
              }`}
            >
              {feedbackSubmitting ? (
                <span>Sending...</span>
              ) : submitStatus === 'success' ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Submitted Successfully!</span>
                </>
              ) : submitStatus === 'error' ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span>Enter a Message</span>
                </>
              ) : (
                <>
                  <span>Submit to Admin</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
