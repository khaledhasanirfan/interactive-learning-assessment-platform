'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Repository } from '@/lib/firebase/repository';
import { Quiz, QuizVersion } from '@/lib/validations/quiz';
import { Question } from '@/lib/validations/question';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Clock, 
  FileText, 
  Sparkles,
  HelpCircle,
  Cpu,
  Layers,
  Check
} from 'lucide-react';

interface CustomMCQQuestion {
  type: 'mcq';
  title: string;
  prompt: string;
  points: number; // always 1 by default
  options: string[]; // 3 to 10 options
  correctOptionIndex: number;
  explanation: string;
}

interface CustomTextualQuestion {
  type: 'textual';
  title: string;
  prompt: string;
  points: number; // admin fixes how many marks
  sampleAnswer: string;
  explanation: string;
}

interface CustomScenarioQuestion {
  type: 'scenario';
  title: string;
  prompt: string;
  points: number;
  scenarioType: 'paging' | 'disk';
  explanation: string;
}

type QuestionDraft = CustomMCQQuestion | CustomTextualQuestion | CustomScenarioQuestion;

export default function CreateAssignmentPage() {
  const router = useRouter();

  // Step 1: Assignment Info
  const [title, setTitle] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(25);
  const [instructions, setInstructions] = useState('Answer all questions carefully. Text answers will be evaluated based on technical understanding.');
  
  // Step 2: Questions List - starts completely clean with 0 default questions!
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  
  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Add MCQ Question (default 1 mark, 4 initial options, range 3 to 10)
  const addMCQ = () => {
    setQuestions([
      ...questions,
      {
        type: 'mcq',
        title: `MCQ Question ${questions.length + 1}`,
        prompt: '',
        points: 1, // Always 1 mark by default
        options: ['Option A', 'Option B', 'Option C', 'Option D'], // starts with 4, range 3-10
        correctOptionIndex: 0,
        explanation: '',
      }
    ]);
  };

  // Add Textual Question (admin fixes marks)
  const addTextual = () => {
    setQuestions([
      ...questions,
      {
        type: 'textual',
        title: `Textual Question ${questions.length + 1}`,
        prompt: '',
        points: 3, // customizable by admin
        sampleAnswer: '',
        explanation: '',
      }
    ]);
  };

  // Add Scenario Question
  const addScenario = () => {
    setQuestions([
      ...questions,
      {
        type: 'scenario',
        title: `Paging Simulation ${questions.length + 1}`,
        prompt: 'Calculate the Physical Address given Logical Address 0x1234 using Page Size 4KB.',
        points: 5,
        scenarioType: 'paging',
        explanation: 'Hardware MMU bit translation.',
      }
    ]);
  };

  // Remove question
  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // Update question field
  const updateQuestion = (index: number, updates: Partial<QuestionDraft>) => {
    setQuestions(questions.map((q, i) => i === index ? { ...q, ...updates } as QuestionDraft : q));
  };

  // MCQ Options Helpers (3 to 10 options)
  const addOptionToMCQ = (qIndex: number) => {
    const q = questions[qIndex];
    if (q.type !== 'mcq' || q.options.length >= 10) return;
    const newOptions = [...q.options, `Option ${String.fromCharCode(65 + q.options.length)}`];
    updateQuestion(qIndex, { options: newOptions });
  };

  const removeOptionFromMCQ = (qIndex: number, optIndex: number) => {
    const q = questions[qIndex];
    if (q.type !== 'mcq' || q.options.length <= 3) return;
    const newOptions = q.options.filter((_, i) => i !== optIndex);
    let newCorrect = q.correctOptionIndex;
    if (newCorrect >= newOptions.length) {
      newCorrect = newOptions.length - 1;
    }
    updateQuestion(qIndex, { options: newOptions, correctOptionIndex: newCorrect });
  };

  const updateOptionText = (qIndex: number, optIndex: number, val: string) => {
    const q = questions[qIndex];
    if (q.type !== 'mcq') return;
    const newOptions = [...q.options];
    newOptions[optIndex] = val;
    updateQuestion(qIndex, { options: newOptions });
  };

  // Handle Form Submit & Publish
  const handlePublishAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setSubmitStatus('error');
      setErrorMessage('Please provide an Assignment Name / Title.');
      setTimeout(() => setSubmitStatus('idle'), 2500);
      return;
    }

    if (questions.length === 0) {
      setSubmitStatus('error');
      setErrorMessage('Please add at least 1 question to the assignment.');
      setTimeout(() => setSubmitStatus('idle'), 2500);
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) {
        setSubmitStatus('error');
        setErrorMessage(`Question #${i + 1} is missing a prompt / question text.`);
        setTimeout(() => setSubmitStatus('idle'), 2500);
        return;
      }
      if (q.type === 'mcq') {
        if (q.options.some(opt => !opt.trim())) {
          setSubmitStatus('error');
          setErrorMessage(`MCQ Question #${i + 1} has empty options.`);
          setTimeout(() => setSubmitStatus('idle'), 2500);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const quizId = `quiz-${Date.now()}`;
      const versionId = `ver-${quizId}-v1`;

      const formattedQuestions: Question[] = questions.map((q, idx) => {
        const qId = `q-${idx}-${Date.now()}`;
        if (q.type === 'mcq') {
          return {
            id: qId,
            type: 'mcq-single' as const,
            title: q.title || `Question ${idx + 1}`,
            prompt: q.prompt.trim(),
            difficulty: 'medium' as const,
            points: q.points || 1, // 1 mark by default
            topic: 'Operating Systems',
            tags: ['os', 'mcq'],
            explanation: q.explanation.trim() || 'Selected option verified against OS curriculum standard.',
            shuffleOptions: true,
            options: q.options.map((text, oIdx) => ({
              id: `opt-${oIdx}`,
              text: text.trim(),
              isCorrect: oIdx === q.correctOptionIndex,
            })),
          };
        } else if (q.type === 'textual') {
          return {
            id: qId,
            type: 'short-text' as const,
            title: q.title || `Textual Question ${idx + 1}`,
            prompt: q.prompt.trim(),
            difficulty: 'medium' as const,
            points: Number(q.points) || 3, // admin custom marks
            topic: 'Operating Systems',
            tags: ['os', 'theory'],
            acceptedAnswers: [q.sampleAnswer.trim()],
            caseSensitive: false,
            trimWhitespace: true,
            explanation: q.explanation.trim() || q.sampleAnswer.trim() || 'Evaluated for conceptual keywords and accuracy.',
          };
        } else {
          return {
            id: qId,
            type: 'scenario' as const,
            title: q.title || `Simulation ${idx + 1}`,
            prompt: q.prompt.trim(),
            difficulty: 'medium' as const,
            points: Number(q.points) || 5,
            topic: 'Operating Systems',
            tags: ['os', 'simulation'],
            explanation: q.explanation.trim() || 'Hardware address translation verification.',
            scenarioType: q.scenarioType === 'disk' ? 'disk-scheduling' : 'paging-translation',
            scenarioConfig: q.scenarioType === 'disk'
              ? { initialHead: 50, requests: [98, 183, 37, 122, 14, 124, 65, 67], totalCylinders: 200 }
              : { processSize: 4, pageSize: 2, ramSize: 16, frameSize: 2, pageTable: { 0: 5, 1: 2 } },
          };
        }
      });

      const totalPoints = formattedQuestions.reduce((sum, q) => sum + (q.points || 1), 0);
      const nowIso = new Date().toISOString();

      const newQuiz: Quiz = {
        id: quizId,
        courseId: 'course-cse307-spring2026',
        title: title.trim(),
        description: 'Assigned by Admin Khaled for OS Assessment',
        instructions: instructions.trim(),
        assignedSectionIds: [],
        mode: 'assessment',
        availableFrom: nowIso,
        dueAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        timeLimitMinutes: Number(timeLimitMinutes) || 25,
        maxAttempts: 999, // unlimited attempts allowed
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
        timeLimitMinutes: Number(timeLimitMinutes) || 25,
        collectConfidence: true,
        immediateFeedback: true,
        revealCorrectAnswer: true,
        revealExplanation: true,
        showScoreImmediately: true,
      };

      await Repository.createAndPublishQuiz(newQuiz, newVersion);

      setSubmitStatus('success');

      // Return to admin dashboard home page after short delay
      setTimeout(() => {
        router.push('/instructor/dashboard');
      }, 1200);

    } catch (err: any) {
      setSubmitStatus('error');
      setErrorMessage(err?.message || 'Failed to create and publish assignment.');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCalculatedPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 1), 0);

  return (
    <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 xl:px-12 py-6 sm:py-8 space-y-8">
      {/* Top Header & Return Link */}
      <div className="flex items-center justify-between">
        <Link 
          href="/instructor/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-white/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-emerald-100 hover:border-emerald-300 transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Home</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            {questions.length} Questions &bull; {totalCalculatedPoints} Total Marks
          </span>
        </div>
      </div>

      {/* Main Page Title Banner (Mint Gradient) */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curriculum &amp; Exam Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Create &amp; Assign Assignment
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl font-medium">
            Name your assignment, set the time limit, customize marks for textual and multiple-choice questions (3 to 10 options), and publish live for students.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="p-3.5 rounded-2xl bg-white/10 border border-white/20 text-white shadow-inner">
            <Clock className="w-7 h-7" />
          </span>
        </div>
      </div>

      {/* Form Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-xs sm:text-sm text-rose-800 font-semibold animate-shake-error">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePublishAssignment} className="space-y-8">
        {/* SECTION 1: ASSIGNMENT DETAILS (NAME & TIME) */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-100 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-emerald-50">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              1
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Assignment Configuration
              </h2>
              <p className="text-xs text-slate-500">Specify assignment title, allocated time limit, and student instructions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assignment Name / Title *
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CSE-307 Live Assessment: CPU Scheduling & Memory"
                required
                className="rounded-xl border-emerald-200/90 focus:border-emerald-500 focus:ring-emerald-500 text-sm h-11"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assign Time Limit (Minutes) *
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="5"
                  max="180"
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  required
                  className="rounded-xl border-emerald-200/90 focus:border-emerald-500 focus:ring-emerald-500 text-sm h-11 pr-12 font-mono font-bold"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  min
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Student Instructions &amp; Guidelines
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Instructions for students taking this live assignment..."
              className="w-full rounded-xl border border-emerald-200/90 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500 shadow-xs resize-none"
            />
          </div>
        </div>

        {/* SECTION 2: ADDING QUESTIONS */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-100 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-emerald-50">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                2
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Questions Builder ({questions.length})
                </h2>
                <p className="text-xs text-slate-500">Add MCQs (1 mark default, 3 to 10 options) or Textual questions (custom marks)</p>
              </div>
            </div>

            {/* Question Type Adding Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={addMCQ}
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold border-emerald-200 text-emerald-800 hover:bg-emerald-50 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add MCQ (1 Mark)</span>
              </Button>

              <Button
                type="button"
                onClick={addTextual}
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold border-teal-200 text-teal-800 hover:bg-teal-50 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Textual Question</span>
              </Button>

              <Button
                type="button"
                onClick={addScenario}
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold border-emerald-200 text-emerald-800 hover:bg-emerald-50 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Simulation</span>
              </Button>
            </div>
          </div>

          {/* EMPTY QUESTIONS STATE */}
          {questions.length === 0 ? (
            <div className="text-center py-14 border-2 border-dashed border-emerald-200 rounded-3xl p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Clean Slate — No Questions Added Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click &ldquo;+ Add MCQ&rdquo; or &ldquo;+ Add Textual Question&rdquo; above to start building questions for this assignment.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((q, qIndex) => (
                <div 
                  key={qIndex}
                  className="rounded-2xl border border-emerald-100 bg-slate-50/60 p-5 sm:p-6 space-y-4 hover:border-emerald-300 transition-all shadow-xs"
                >
                  {/* Card Header: Type, Title, Marks, Delete */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-700 text-white">
                        #{qIndex + 1}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        q.type === 'mcq'
                          ? 'bg-blue-100 text-blue-800'
                          : q.type === 'textual'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {q.type === 'mcq' ? 'MCQ (Single Choice)' : q.type === 'textual' ? 'Textual Question' : 'Hardware Simulation'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Customizable Marks */}
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                        <span>Marks:</span>
                        {q.type === 'mcq' ? (
                          <span className="font-mono text-emerald-700">1 (Default)</span>
                        ) : (
                          <input
                            type="number"
                            min="0.5"
                            max="50"
                            step="0.5"
                            value={q.points}
                            onChange={(e) => updateQuestion(qIndex, { points: parseFloat(e.target.value) || 1 })}
                            className="w-14 font-mono text-emerald-700 text-xs font-bold border border-emerald-200 rounded px-1.5 py-0.5 focus:outline-emerald-500"
                          />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Question Prompt / Statement *
                    </label>
                    <textarea
                      rows={2}
                      value={q.prompt}
                      onChange={(e) => updateQuestion(qIndex, { prompt: e.target.value })}
                      placeholder={
                        q.type === 'mcq' 
                          ? 'e.g. Which of the following page replacement algorithms suffers from Belady’s anomaly?' 
                          : 'e.g. Define Thrashing in Operating Systems and explain how the working set model mitigates it.'
                      }
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500 resize-none shadow-xs"
                    />
                  </div>

                  {/* SPECIFIC TO MCQ: Options (Range 3 to 10) */}
                  {q.type === 'mcq' && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Answer Options ({q.options.length} / 10 options &bull; Select Radio for Correct Answer)
                        </label>

                        {q.options.length < 10 && (
                          <Button
                            type="button"
                            onClick={() => addOptionToMCQ(qIndex)}
                            variant="ghost"
                            size="sm"
                            className="text-emerald-700 hover:text-emerald-800 text-xs font-bold hover:bg-emerald-50 h-7 px-2.5"
                          >
                            + Add Option ({q.options.length + 1})
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((optText, oIdx) => (
                          <div 
                            key={oIdx} 
                            className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                              q.correctOptionIndex === oIdx 
                                ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-300' 
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={q.correctOptionIndex === oIdx}
                              onChange={() => updateQuestion(qIndex, { correctOptionIndex: oIdx })}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              title="Mark as correct answer"
                            />
                            <span className="text-xs font-bold font-mono text-slate-500">
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            <input
                              type="text"
                              value={optText}
                              onChange={(e) => updateOptionText(qIndex, oIdx, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + oIdx)} text`}
                              required
                              className="flex-1 text-xs border-none bg-transparent focus:outline-none text-slate-800 font-medium"
                            />
                            {q.options.length > 3 && (
                              <button
                                type="button"
                                onClick={() => removeOptionFromMCQ(qIndex, oIdx)}
                                className="text-slate-300 hover:text-rose-500 p-1 text-xs"
                                title="Delete this option (minimum 3)"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SPECIFIC TO TEXTUAL: Sample Answer & Expected Concepts */}
                  {q.type === 'textual' && (
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Expected Model Answer / Key Concepts (Used for Semantic Scoring)
                        </label>
                        <textarea
                          rows={2}
                          value={q.sampleAnswer}
                          onChange={(e) => updateQuestion(qIndex, { sampleAnswer: e.target.value })}
                          placeholder="e.g. Thrashing happens when page fault overhead exceeds CPU execution time. Resolved by reducing degree of multiprogramming."
                          required
                          className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500 resize-none shadow-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Pedagogical Explanation / Justification */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Pedagogical Justification / Solution Explanation (Shown to Students Post-Submission)
                    </label>
                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => updateQuestion(qIndex, { explanation: e.target.value })}
                      placeholder="Why is this answer correct? Explanation will appear in the student's review session."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3: PUBLISH ACTION & RETURN TO ADMIN */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-100 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-700 block">
              Total Questions: {questions.length} &bull; Total Marks: {totalCalculatedPoints} pts &bull; Time: {timeLimitMinutes} min
            </span>
            <p className="text-[11px] text-slate-400">
              Upon publishing, the assignment will be live for students and you will return to the Admin Home dashboard.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link href="/instructor/dashboard" className="w-full sm:w-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto rounded-xl text-xs font-bold border-slate-300 text-slate-700">
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              disabled={isSubmitting || questions.length === 0}
              className={`w-full sm:w-auto rounded-xl text-white font-bold text-xs px-8 py-3 shadow-md transition-all duration-300 flex items-center justify-center gap-2 ${
                submitStatus === 'success'
                  ? 'bg-emerald-600 ring-4 ring-emerald-300 animate-pop-success'
                  : submitStatus === 'error'
                  ? 'bg-rose-600 ring-4 ring-rose-300 animate-shake-error'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 hover:scale-[1.02]'
              }`}
            >
              {isSubmitting ? (
                <span>Publishing Assignment...</span>
              ) : submitStatus === 'success' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Published! Returning to Home...</span>
                </>
              ) : submitStatus === 'error' ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span>Check Requirements</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Publish &amp; Return to Admin Home</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
