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
  AlertCircle,
  RotateCcw
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

  const studentIdentifier = profile?.email?.split('@')[0] || profile?.id || '202014019';

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const quizList = await Repository.getQuizzes();
        setQuizzes(quizList);

        const studentAttempts = await Repository.getAttemptsByUser(studentIdentifier);
        setAttempts(studentAttempts);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [studentIdentifier]);

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
      studentId: studentIdentifier,
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

  return (
    <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 xl:px-12 py-6 sm:py-8 space-y-8">
      {/* Student Welcome Card (Mint Theme) */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="z-10 space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
            <span>👋 Hello, {profile?.displayName || 'Student'} ({studentIdentifier})</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Ready to Master Operating Systems? 🚀
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-lg font-medium">
            Take your assigned live tasks, re-attempt anytime to master core concepts, review past attempt logs, or send direct feedback below.
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

      {/* SECTION 1: ASSIGNED ASSESSMENTS (ALWAYS ACCESSIBLE TO START / RE-ATTEMPT) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Assigned Quizzes &amp; Live Tasks
              </h2>
              <p className="text-xs text-slate-500">Always accessible &bull; Attempt count tracked automatically</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            {quizzes.length} Available
          </span>
        </div>

        {quizzes.length === 0 ? (
          <div className="bg-white/90 rounded-3xl border border-emerald-100 p-8 text-center text-slate-500 shadow-xs">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-bold text-slate-800">No active tasks right now</h3>
            <p className="text-xs text-slate-400 mt-1">Instructor will post new live assignments shortly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {quizzes.map((quiz) => {
              const quizAttempts = attempts.filter(a => a.quizId === quiz.id);
              const attemptCount = quizAttempts.length;
              const bestScore = attemptCount > 0 
                ? Math.max(...quizAttempts.map(a => a.score ?? 0)) 
                : null;

              return (
                <div 
                  key={quiz.id}
                  className="bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-100 p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all hover:scale-[1.01] flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Live Class Task
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        {quiz.timeLimitMinutes} mins
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug mb-1">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                      {quiz.description}
                    </p>

                    {/* Attempt Log Status Badge */}
                    <div className="pt-3 border-t border-emerald-50/80 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          attemptCount > 0
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          Attempted: {attemptCount} {attemptCount === 1 ? 'time' : 'times'}
                        </span>
                      </div>

                      {bestScore !== null && (
                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          Best: {bestScore} pts
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Always Can Start / Re-Attempt Button */}
                  <div className="pt-2">
                    <Link href={`/student/quizzes/${quiz.id}/attempt/new`} className="w-full block">
                      <Button className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs py-3 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group">
                        {attemptCount === 0 ? (
                          <>
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Start Assessment</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Re-attempt Assessment</span>
                          </>
                        )}
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: MY ASSESSMENT SESSIONS & ACTIVITY LOG */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-100 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-emerald-50 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <History className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                My Past Sessions &amp; Submissions Log
              </h2>
              <p className="text-xs text-slate-500">Track your completed sessions, scores, and review full question justifications</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            {attempts.length} Total Attempts
          </span>
        </div>

        {attempts.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <History className="w-10 h-10 mx-auto mb-2 opacity-30 text-teal-600" />
            <p className="text-xs font-semibold text-slate-600">No assessment attempts recorded yet.</p>
            <p className="text-[11px] text-slate-400">When you complete an assessment, your scores and question explanations will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-emerald-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4">Assessment Title</th>
                  <th className="py-3 px-4">Score Earned</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4 text-right">Review Answers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((att, idx) => {
                  const score = att.score ?? 0;
                  const max = att.maxScore ?? 15;
                  const pct = att.percentage ?? (max > 0 ? Math.round((score / max) * 100) : 0);
                  const quizItem = quizzes.find(q => q.id === att.quizId);

                  return (
                    <tr key={att.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        Session #{attempts.length - idx}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                        {quizItem?.title || att.quizId}
                      </td>
                      <td className="py-3 px-4 font-bold font-mono text-emerald-700">
                        {score} / {max} pts
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(att.submittedAt || att.startedAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/student/quizzes/${att.quizId}/attempt/${att.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs font-bold border-emerald-200 text-emerald-800 hover:bg-emerald-50">
                            Review Answers &amp; Explanations
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

      {/* SECTION 3: DEDICATED STUDENT FEEDBACK & COMPLAINTS */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-100 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Have Feedback, an Issue, or a Feature Suggestion?
            </h2>
            <p className="text-xs text-slate-500">
              Submit your direct comments to Admin Khaled. Your feedback will appear live on the Admin Dashboard.
            </p>
          </div>
        </div>

        {feedbackSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 font-semibold flex items-center gap-2 animate-pop-success">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackSuccess}</span>
          </div>
        )}

        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          {/* Category Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 mr-2">Category:</span>
            {[
              { id: 'feedback', label: '💡 General Feedback' },
              { id: 'feature_request', label: '🚀 Feature Request' },
              { id: 'issue', label: '⚠️ Technical Issue' },
              { id: 'complaint', label: '📢 Complaint' },
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
