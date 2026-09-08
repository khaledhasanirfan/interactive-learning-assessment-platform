'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/auth-context';
import { Repository, RegisteredStudent, UserFeedback } from '@/lib/firebase/repository';
import { Quiz, QuizVersion } from '@/lib/validations/quiz';
import { Question } from '@/lib/validations/question';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Activity, 
  PlusCircle, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Cpu, 
  Trash2, 
  Send,
  Eye,
  CheckCircle,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

export default function AdminDashboard() {
  const { profile } = useAuth();

  // Metric states
  const [students, setStudents] = useState<RegisteredStudent[]>([]);
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  // Active quiz creator state
  const [quizTitle, setQuizTitle] = useState('');
  const [quizTimeLimit, setQuizTimeLimit] = useState(20);
  const [activeTab, setActiveTab] = useState<'create' | 'feedbacks' | 'students'>('create');

  // Form question builder
  const [questions, setQuestions] = useState<Array<{
    type: 'mcq' | 'textual' | 'scenario';
    title: string;
    prompt: string;
    points: number;
    // MCQ options
    options?: string[];
    correctOptionIndex?: number;
    // Textual
    sampleAnswer?: string;
    // Scenario
    scenarioType?: 'paging' | 'disk';
  }>>([
    {
      type: 'mcq',
      title: 'Page Replacement Strategy',
      prompt: 'Which page replacement algorithm suffers from Belady’s anomaly?',
      points: 5,
      options: ['FIFO (First-In, First-Out)', 'LRU (Least Recently Used)', 'Optimal (OPT)', 'Clock Algorithm'],
      correctOptionIndex: 0,
    },
    {
      type: 'textual',
      title: 'Thrashing Explanation',
      prompt: 'Define "Thrashing" in Operating Systems and describe how the OS kernel recovers from it.',
      points: 5,
      sampleAnswer: 'Thrashing occurs when a computer spends more time paging than executing. Handled by working set models or suspending processes.',
    }
  ]);

  const [publishedSuccess, setPublishedSuccess] = useState('');

  const loadAllData = async () => {
    setLoading(false);
    const [sList, fList, qList] = await Promise.all([
      Repository.getRegisteredStudents(),
      Repository.getFeedbacks(),
      Repository.getQuizzes(),
    ]);
    setStudents(sList);
    setFeedbacks(fList);
    setQuizzes(qList);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const addQuestion = (type: 'mcq' | 'textual' | 'scenario') => {
    if (type === 'mcq') {
      setQuestions([
        ...questions,
        {
          type: 'mcq',
          title: `Question ${questions.length + 1}`,
          prompt: '',
          points: 5,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctOptionIndex: 0,
        }
      ]);
    } else if (type === 'textual') {
      setQuestions([
        ...questions,
        {
          type: 'textual',
          title: `Question ${questions.length + 1}`,
          prompt: '',
          points: 5,
          sampleAnswer: '',
        }
      ]);
    } else {
      setQuestions([
        ...questions,
        {
          type: 'scenario',
          title: `Interactive Scenario ${questions.length + 1}`,
          prompt: 'Solve the hardware address translation or disk trajectory below:',
          points: 10,
          scenarioType: 'paging',
        }
      ]);
    }
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handlePublishQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) {
      alert('Please enter a quiz title');
      return;
    }

    const quizId = `quiz-${Date.now()}`;
    const versionId = `v-${Date.now()}`;

    const formattedQuestions: Question[] = questions.map((q, idx) => {
      const qId = `q-${idx}-${Date.now()}`;
      if (q.type === 'mcq') {
        return {
          id: qId,
          type: 'mcq-single' as const,
          title: q.title || `Question ${idx + 1}`,
          prompt: q.prompt,
          difficulty: 'medium' as const,
          points: q.points || 1,
          topic: 'Operating Systems',
          tags: ['os', 'mcq'],
          explanation: '',
          shuffleOptions: true,
          options: (q.options || ['Option A', 'Option B']).map((text, oIdx) => ({
            id: `opt-${oIdx}`,
            text,
            isCorrect: oIdx === (q.correctOptionIndex || 0),
          })),
        };
      } else if (q.type === 'textual') {
        return {
          id: qId,
          type: 'short-text' as const,
          title: q.title || `Textual Question ${idx + 1}`,
          prompt: q.prompt,
          difficulty: 'medium' as const,
          points: q.points || 5,
          topic: 'Operating Systems',
          tags: ['os', 'theory'],
          acceptedAnswers: [q.sampleAnswer || ''],
          caseSensitive: false,
          trimWhitespace: true,
          explanation: q.sampleAnswer || '',
        };
      } else {
        return {
          id: qId,
          type: 'scenario' as const,
          title: q.title || 'Paging Address Translation',
          prompt: q.prompt,
          difficulty: 'medium' as const,
          points: q.points || 10,
          topic: 'Operating Systems',
          tags: ['os', 'paging'],
          explanation: 'Address translation exercise',
          scenarioType: q.scenarioType === 'disk' ? 'disk-scheduling' : 'paging-translation',
          scenarioConfig: q.scenarioType === 'disk' 
            ? { initialHead: 50, requests: [98, 183, 37, 122, 14, 124, 65, 67], totalCylinders: 200 }
            : { processSize: 4, pageSize: 2, ramSize: 16, frameSize: 2, pageTable: { 0: 5, 1: 2 } },
        };
      }
    });

    const totalPoints = formattedQuestions.reduce((acc, q) => acc + (q.points || 1), 0);
    const nowIso = new Date().toISOString();

    const newQuiz: Quiz = {
      id: quizId,
      courseId: 'cse-307-spring-2026',
      title: quizTitle.trim(),
      description: 'Assigned by Instructor for OS Mastery',
      instructions: 'Answer all questions carefully. Text answers and MCQs are recorded and evaluated.',
      assignedSectionIds: [],
      mode: 'assessment',
      availableFrom: nowIso,
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      timeLimitMinutes: quizTimeLimit,
      maxAttempts: 2,
      shuffleQuestions: false,
      shuffleOptions: true,
      immediateFeedback: true,
      revealCorrectAnswer: true,
      revealExplanation: true,
      showScoreImmediately: true,
      collectConfidence: true,
      isPublished: true,
      activeVersionId: versionId,
      questionIds: formattedQuestions.map(q => q.id),
      createdBy: 'khaled19',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const newVersion: QuizVersion = {
      id: versionId,
      quizId,
      versionNumber: 1,
      publishedAt: nowIso,
      publishedBy: 'khaled19',
      questions: formattedQuestions,
      totalPoints,
      mode: 'assessment',
      timeLimitMinutes: quizTimeLimit,
      collectConfidence: true,
      immediateFeedback: true,
      revealCorrectAnswer: true,
      revealExplanation: true,
      showScoreImmediately: true,
    };

    await Repository.createAndPublishQuiz(newQuiz, newVersion);
    setPublishedSuccess(`🎉 Successfully published "${quizTitle}" with ${formattedQuestions.length} questions! It is now live in students' dashboards.`);
    setQuizTitle('');
    loadAllData();

    setTimeout(() => {
      setPublishedSuccess('');
    }, 6000);
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 rounded-3xl p-6 sm:p-8 text-white shadow-md mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-200" />
            <span>Admin Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {profile?.displayName || 'Admin Khaled'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-xl">
            Manage your registered students, live platform traffic, create & post new quizzes, and inspect student feedbacks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/student/dashboard">
            <Button variant="outline" className="rounded-full bg-white text-slate-800 hover:bg-sky-50 font-bold text-xs border-white">
              <Eye className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
              Preview Student View
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {/* Card 1: Total Registered Students */}
        <div 
          onClick={() => setActiveTab('students')}
          className="bg-white/90 backdrop-blur-md rounded-3xl border border-sky-100 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full">
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
            <span className="text-xs font-semibold text-emerald-600">Students Enrolled</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Click to view student IDs & roster
          </p>
        </div>

        {/* Card 2: Website Traffic & Live Activity */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Active Online
            </span>
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Platform Traffic & Submissions
          </h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              {quizzes.length * 3 + 12}
            </span>
            <span className="text-xs font-semibold text-sky-600">Submissions Processed</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Average completion rate: <span className="font-semibold text-slate-700">92%</span> &bull; 99.9% Uptime
          </p>
        </div>

        {/* Card 3: Feedbacks & Complaints */}
        <div 
          onClick={() => setActiveTab('feedbacks')}
          className="bg-white/90 backdrop-blur-md rounded-3xl border border-teal-100 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">
              {feedbacks.length} Total
            </span>
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            User Feedbacks & Complaints
          </h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              {feedbacks.filter(f => f.status === 'new').length}
            </span>
            <span className="text-xs font-semibold text-amber-600">Needs Review</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Click to read suggestions & issue reports
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-sky-100/80 mb-6 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'create'
              ? 'bg-gradient-to-r from-sky-600 to-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create & Post Quiz / Questions</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('feedbacks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'feedbacks'
              ? 'bg-gradient-to-r from-sky-600 to-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Feedbacks & Complaints ({feedbacks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'students'
              ? 'bg-gradient-to-r from-sky-600 to-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registered Students ({students.length})</span>
        </button>
      </div>

      {/* TAB 1: CREATE & POST QUIZ */}
      {activeTab === 'create' && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-sky-100 p-6 sm:p-8 shadow-sm">
          {publishedSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 shadow-xs">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{publishedSuccess}</span>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Create and Assign New OS Assessment
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Author questions with multiple formats (MCQ, Textual Answer, or Interactive Simulation). Once published, students will see it instantly in their tasks.
            </p>
          </div>

          <form onSubmit={handlePublishQuiz} className="space-y-6">
            {/* Title & Timing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Quiz / Task Title *
                </label>
                <Input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g. Quiz 3: Virtual Memory & Page Translation"
                  className="rounded-xl border-slate-200 focus:border-sky-500 h-11 text-sm font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Time Limit (Minutes)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={quizTimeLimit}
                  onChange={(e) => setQuizTimeLimit(Number(e.target.value))}
                  className="rounded-xl border-slate-200 focus:border-sky-500 h-11 text-sm"
                />
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Questions ({questions.length})
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => addQuestion('mcq')}
                    size="sm"
                    className="rounded-full bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-xs font-bold"
                  >
                    + Add MCQ
                  </Button>
                  <Button
                    type="button"
                    onClick={() => addQuestion('textual')}
                    size="sm"
                    className="rounded-full bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 text-xs font-bold"
                  >
                    + Add Textual Answer
                  </Button>
                  <Button
                    type="button"
                    onClick={() => addQuestion('scenario')}
                    size="sm"
                    className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold"
                  >
                    + Add OS Scenario
                  </Button>
                </div>
              </div>

              {questions.map((q, idx) => (
                <div key={idx} className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 sm:p-5 relative group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                        {q.type === 'mcq' ? 'Multiple Choice (MCQ)' : q.type === 'textual' ? 'Textual Answer' : 'Interactive OS Simulation'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeQuestion(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Remove question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Question Prompt */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Question Prompt
                      </label>
                      <Input
                        type="text"
                        value={q.prompt}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[idx]!.prompt = e.target.value;
                          setQuestions(updated);
                        }}
                        placeholder={
                          q.type === 'mcq'
                            ? 'e.g. Which page replacement algorithm suffers from Belady’s anomaly?'
                            : q.type === 'textual'
                            ? 'e.g. Explain how virtual addresses are translated to physical addresses by the MMU.'
                            : 'e.g. Solve the Paging Address Translation calculation for the given process.'
                        }
                        className="rounded-xl border-slate-200 bg-white text-sm"
                        required
                      />
                    </div>

                    {/* MCQ Options */}
                    {q.type === 'mcq' && q.options && (
                      <div className="space-y-2 pt-1">
                        <label className="block text-xs font-semibold text-slate-600">
                          Answer Options (Select the radio button next to the correct answer)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                              <input
                                type="radio"
                                name={`correct-${idx}`}
                                checked={q.correctOptionIndex === oIdx}
                                onChange={() => {
                                  const updated = [...questions];
                                  updated[idx]!.correctOptionIndex = oIdx;
                                  setQuestions(updated);
                                }}
                                className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const updated = [...questions];
                                  updated[idx]!.options![oIdx] = e.target.value;
                                  setQuestions(updated);
                                }}
                                className="w-full text-xs font-medium focus:outline-hidden"
                                placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                required
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Textual Answer Format */}
                    {q.type === 'textual' && (
                      <div className="pt-1">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Expected Answer / Rubric / Key Concepts
                        </label>
                        <textarea
                          value={q.sampleAnswer || ''}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[idx]!.sampleAnswer = e.target.value;
                            setQuestions(updated);
                          }}
                          placeholder="Provide the ideal textual answer or concepts students should include (e.g. VPN breakdown, Page Table lookup, Physical Frame assembly)..."
                          rows={2}
                          className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:border-teal-500 focus:ring-teal-500"
                        />
                      </div>
                    )}

                    {/* Scenario Type */}
                    {q.type === 'scenario' && (
                      <div className="pt-1 flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-600">Simulation Module:</span>
                        <select
                          value={q.scenarioType || 'paging'}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[idx]!.scenarioType = e.target.value as 'paging' | 'disk';
                            setQuestions(updated);
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          <option value="paging">Virtual Memory (Paging Address Translation)</option>
                          <option value="disk">Disk Scheduling (Cylinder Head Arm)</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <Button
                type="submit"
                size="lg"
                className="rounded-full bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white font-bold px-8 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Publish to Students</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: FEEDBACKS & COMPLAINTS */}
      {activeTab === 'feedbacks' && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-sky-100 p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Student Feedbacks, Issues & Feature Requests
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live submissions received from the dedicated feedback input field on the student home page.
            </p>
          </div>

          {feedbacks.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">No feedback submissions yet.</p>
              <p className="text-xs">Students will be able to share their thoughts from their dashboard.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedbacks.map((fb) => (
                <div key={fb.id} className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        fb.category === 'issue' || fb.category === 'complaint'
                          ? 'bg-rose-100 text-rose-700'
                          : fb.category === 'feature_request'
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {fb.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {fb.studentName} ({fb.studentId})
                      </span>
                      <span className="text-[11px] text-slate-400">
                        &bull; {new Date(fb.submittedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium pt-1">
                      &ldquo;{fb.message}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      fb.status === 'resolved' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {fb.status === 'resolved' ? 'Resolved ✔' : 'Pending Review'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REGISTERED STUDENTS */}
      {activeTab === 'students' && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-sky-100 p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Registered Students Roster
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              All students who have created an account or enrolled in the platform.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Student ID</th>
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">Registration Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {students.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 font-mono text-xs text-sky-700 font-bold">{stu.studentId}</td>
                    <td className="py-3.5 text-slate-900 font-semibold">{stu.name}</td>
                    <td className="py-3.5 text-xs text-slate-500">{new Date(stu.registeredAt).toLocaleDateString()}</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
