'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/auth-context';
import { Repository, RegisteredStudent, UserFeedback } from '@/lib/firebase/repository';
import { Quiz, QuizVersion } from '@/lib/validations/quiz';
import { Question } from '@/lib/validations/question';
import { Attempt } from '@/lib/validations/attempt';
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
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

export default function AdminDashboard() {
  const { profile } = useAuth();

  // Metric states
  const [students, setStudents] = useState<RegisteredStudent[]>([]);
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Active quiz creator state
  const [quizTitle, setQuizTitle] = useState('');
  const [quizTimeLimit, setQuizTimeLimit] = useState(20);
  const [activeTab, setActiveTab] = useState<'create' | 'feedbacks' | 'students'>('create');
  const [publishStatus, setPublishStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [publishedSuccess, setPublishedSuccess] = useState('');

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

  const loadAllData = async () => {
    setLoading(false);
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
          title: `Text Question ${questions.length + 1}`,
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
      setPublishStatus('error');
      setTimeout(() => setPublishStatus('idle'), 1500);
      alert('Please enter an assessment title before publishing.');
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
    setPublishStatus('success');
    setPublishedSuccess(`🎉 Successfully published "${quizTitle}" with ${formattedQuestions.length} questions! Live in student dashboards.`);
    setQuizTitle('');
    loadAllData();

    setTimeout(() => {
      setPublishStatus('idle');
      setPublishedSuccess('');
    }, 6000);
  };

  return (
    <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 xl:px-12 py-6 sm:py-8 space-y-8">
      {/* Top Banner (Mint Gradient) */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-100" />
            <span>Admin Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {profile?.displayName || 'Admin Khaled'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl font-medium">
            Manage your registered students, live platform traffic, create & post new quizzes, and inspect student feedbacks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/student/dashboard">
            <Button variant="outline" className="rounded-full bg-white text-emerald-950 hover:bg-emerald-50 font-bold text-xs border-white shadow-xs">
              <Eye className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
              Preview Student View
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 3 Metric Cards (Clean DB numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
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
            Click to view student IDs & roster
          </p>
        </div>

        {/* Card 2: Website Traffic & Live Activity */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
              Active Online
            </span>
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Platform Traffic & Submissions
          </h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              {attempts.length}
            </span>
            <span className="text-xs font-semibold text-teal-700">Submissions Processed</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Live assessment sessions submitted by students
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
            <div className="w-12 h-12 rounded-2xl bg-mint-100 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {feedbacks.length} Total
            </span>
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            User Feedbacks & Complaints
          </h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              {feedbacks.length}
            </span>
            <span className="text-xs font-semibold text-amber-700">Needs Review</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Click to read suggestions & issue reports
          </p>
        </div>
      </div>

      {/* Nav Tabs for Admin Views */}
      <div className="flex flex-wrap items-center gap-2 border-b border-emerald-100/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'create'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white/80 text-slate-600 hover:bg-emerald-50 hover:text-emerald-950 border border-emerald-100'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create & Post Quiz / Questions</span>
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
          <span>Feedbacks & Complaints ({feedbacks.length})</span>
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
      </div>

      {/* TAB 1: CREATE QUIZ / QUESTIONS */}
      {activeTab === 'create' && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-100 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Create & Assign Assessment
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Build MCQs, textual questions, and interactive hardware scenarios, then publish live to students.
              </p>
            </div>

            {/* Add question type buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={() => addQuestion('mcq')}
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold border-emerald-200 text-emerald-800 hover:bg-emerald-50"
              >
                + Add MCQ
              </Button>
              <Button
                type="button"
                onClick={() => addQuestion('textual')}
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold border-teal-200 text-teal-800 hover:bg-teal-50"
              >
                + Add Textual
              </Button>
              <Button
                type="button"
                onClick={() => addQuestion('scenario')}
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold border-emerald-300 text-emerald-900 hover:bg-emerald-50"
              >
                + Add Simulation
              </Button>
            </div>
          </div>

          {publishedSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-pop-success">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{publishedSuccess}</span>
            </div>
          )}

          <form onSubmit={handlePublishQuiz} className="space-y-6">
            {/* Assessment Meta Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Assessment Title
                </label>
                <Input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g. CSE-307 Midterm Assessment: CPU & Virtual Memory"
                  className="rounded-xl border-emerald-200 bg-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Time Limit (Minutes)
                </label>
                <Input
                  type="number"
                  value={quizTimeLimit}
                  onChange={(e) => setQuizTimeLimit(Number(e.target.value))}
                  min={5}
                  max={180}
                  className="rounded-xl border-emerald-200 bg-white text-sm"
                />
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-50/80 rounded-2xl border border-emerald-100/90 p-5 space-y-4 relative transition-all"
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-600 text-white">
                        #{idx + 1}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        q.type === 'mcq'
                          ? 'bg-emerald-100 text-emerald-800'
                          : q.type === 'textual'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-mint-200 text-emerald-950'
                      }`}>
                        {q.type === 'mcq' ? 'Multiple Choice' : q.type === 'textual' ? 'Textual Answer' : 'Interactive Simulation'}
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
                        className="rounded-xl border-emerald-200/80 bg-white text-sm"
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
                            <div key={oIdx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-emerald-100">
                              <input
                                type="radio"
                                name={`correct-${idx}`}
                                checked={q.correctOptionIndex === oIdx}
                                onChange={() => {
                                  const updated = [...questions];
                                  updated[idx]!.correctOptionIndex = oIdx;
                                  setQuestions(updated);
                                }}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
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
                          className="w-full rounded-xl border border-emerald-200/80 bg-white p-2.5 text-xs focus:border-emerald-500 focus:ring-emerald-500"
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
                          className="rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
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

            {/* Submit Button with Animation */}
            <div className="pt-4 border-t border-emerald-100 flex items-center justify-end">
              <Button
                type="submit"
                size="lg"
                className={`rounded-full text-white font-bold px-8 shadow-md transition-all duration-300 flex items-center gap-2 ${
                  publishStatus === 'success'
                    ? 'bg-emerald-600 ring-4 ring-emerald-300 animate-pop-success'
                    : publishStatus === 'error'
                    ? 'bg-rose-600 ring-4 ring-rose-300 animate-shake-error'
                    : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 hover:scale-[1.02]'
                }`}
              >
                {publishStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Published Successfully!</span>
                  </>
                ) : publishStatus === 'error' ? (
                  <>
                    <AlertCircle className="w-5 h-5" />
                    <span>Provide Title & Details</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Publish Assessment to Students</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: FEEDBACKS & COMPLAINTS */}
      {activeTab === 'feedbacks' && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-100 p-6 sm:p-8 shadow-sm">
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
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
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
    </div>
  );
}
