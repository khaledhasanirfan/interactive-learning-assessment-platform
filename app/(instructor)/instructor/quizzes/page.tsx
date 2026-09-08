'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Repository } from '@/lib/firebase/repository';
import { Quiz, QuizVersion } from '@/lib/validations/quiz';
import { QuestionBank } from '@/lib/validations/question';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Clock, 
  BarChart3, 
  Download, 
  CheckCircle2, 
  Layers, 
  ShieldCheck,
  Send,
  Eye
} from 'lucide-react';

export default function InstructorQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [mode, setMode] = useState<'assessment' | 'practice'>('assessment');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('30');
  const [maxAttempts, setMaxAttempts] = useState('1');
  const [immediateFeedback, setImmediateFeedback] = useState(false);
  const [collectConfidence, setCollectConfidence] = useState(true);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const qList = await Repository.getQuizzes();
      setQuizzes(qList);

      const bList = await Repository.getQuestionBanks();
      setBanks(bList);
      if (bList.length > 0) {
        // Pre-select first 4 questions for easy creation
        const firstFour = bList[0]!.questions.slice(0, 4).map(q => q.id);
        setSelectedQuestionIds(new Set(firstFour));
      }
    }
    load();
  }, []);

  const handleCreateAndPublishQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const bank = banks[0];
    const allQuestions = bank ? bank.questions : [];
    const chosenQuestions = allQuestions.filter(q => selectedQuestionIds.has(q.id));
    const totalPoints = chosenQuestions.reduce((acc, q) => acc + (q.points || 1), 0);

    const newQuizId = `quiz-${Date.now()}`;
    const newVersionId = `ver-${newQuizId}-v1`;

    const newQuiz: Quiz = {
      id: newQuizId,
      courseId: 'course-cse307-spring2026',
      title,
      description,
      instructions: instructions || 'Read all questions carefully. Responses autosave continuously.',
      assignedSectionIds: [],
      mode,
      availableFrom: new Date().toISOString(),
      dueAt: new Date(Date.now() + 3600 * 1000 * 72).toISOString(),
      timeLimitMinutes: Number(timeLimitMinutes) || 0,
      maxAttempts: mode === 'practice' ? 0 : Number(maxAttempts) || 1,
      shuffleQuestions: false,
      shuffleOptions: true,
      immediateFeedback,
      revealCorrectAnswer: immediateFeedback,
      revealExplanation: immediateFeedback,
      showScoreImmediately: immediateFeedback,
      collectConfidence,
      isPublished: true,
      activeVersionId: newVersionId,
      questionIds: Array.from(selectedQuestionIds),
      createdBy: 'demo-instructor-turing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create immutable version snapshot
    const newVersion: QuizVersion = {
      id: newVersionId,
      quizId: newQuizId,
      versionNumber: 1,
      publishedAt: new Date().toISOString(),
      publishedBy: 'demo-instructor-turing',
      questions: chosenQuestions,
      totalPoints,
      mode,
      timeLimitMinutes: Number(timeLimitMinutes) || 0,
      collectConfidence,
      immediateFeedback,
      revealCorrectAnswer: immediateFeedback,
      revealExplanation: immediateFeedback,
      showScoreImmediately: immediateFeedback,
    };

    await Repository.publishQuizVersion(newQuizId, newVersion);
    await Repository.saveQuiz(newQuiz);

    setQuizzes(prev => [newQuiz, ...prev]);
    setIsCreateModalOpen(false);
    setTitle('');
    setDescription('');
  };

  const allAvailableQuestions = banks[0]?.questions || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Assessment Management
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Quizzes &amp; Versioned Releases
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure assessments with immutable snapshot versioning to ensure grading integrity.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-1.5 text-xs">
          <Plus className="h-4 w-4" /> Create &amp; Publish Quiz
        </Button>
      </div>

      {/* Quizzes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="flex flex-col justify-between hover:border-slate-300 transition-all">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <Badge variant={quiz.mode === 'assessment' ? 'purple' : 'info'}>
                  {quiz.mode.toUpperCase()} MODE
                </Badge>
                <Badge variant={quiz.isPublished ? 'success' : 'warning'}>
                  {quiz.isPublished ? 'Published & Sealed' : 'Draft'}
                </Badge>
              </div>
              <CardTitle className="mt-2 text-base">{quiz.title}</CardTitle>
              <CardDescription>{quiz.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono">
                <div>
                  <span className="text-slate-400 block text-[11px]">Due Date:</span>
                  <strong>{new Date(quiz.dueAt).toLocaleDateString()}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Time Limit:</span>
                  <strong>{quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} min` : 'No limit'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Questions:</span>
                  <strong>{quiz.questionIds.length} items</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Feedback:</span>
                  <strong className={quiz.immediateFeedback ? 'text-emerald-700' : 'text-slate-700'}>
                    {quiz.immediateFeedback ? 'Immediate' : 'Delayed'}
                  </strong>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Link href={`/student/quizzes/${quiz.id}/attempt/preview`}>
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-slate-600">
                  <Eye className="h-3.5 w-3.5" /> Preview
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Link href={`/instructor/analytics/${quiz.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <BarChart3 className="h-3.5 w-3.5 text-blue-600" /> Analytics
                  </Button>
                </Link>
                <Link href={`/instructor/export/${quiz.id}`}>
                  <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                    <Download className="h-3.5 w-3.5" /> Export CSV
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Create & Publish Quiz Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create &amp; Publish New Quiz"
        description="Select questions and configure timing, attempts, and feedback release policy."
        size="xl"
      >
        <form onSubmit={handleCreateAndPublishQuiz} className="space-y-4 text-xs">
          <Input
            label="Quiz Title"
            placeholder="e.g. Quiz 2: CPU Scheduling & Deadlocks"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Description"
            placeholder="e.g. Covers round-robin and banker's algorithm..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Assessment Mode
              </label>
              <select
                value={mode}
                onChange={(e) => {
                  const m = e.target.value as 'assessment' | 'practice';
                  setMode(m);
                  if (m === 'practice') {
                    setImmediateFeedback(true);
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="assessment">Assessment Mode (Graded, Timed, Delayed Feedback)</option>
                <option value="practice">Practice Mode (Unlimited Retries, Immediate Solutions)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Time Limit (Minutes)
              </label>
              <input
                type="number"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(e.target.value)}
                placeholder="0 for unlimited"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Feedback & Option Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={immediateFeedback}
                onChange={(e) => setImmediateFeedback(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="font-medium text-slate-700">Immediate Feedback &amp; Explanations</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={collectConfidence}
                onChange={(e) => setCollectConfidence(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="font-medium text-slate-700">Collect Confidence Ratings (1–5)</span>
            </label>
          </div>

          {/* Question Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">
                Pick Questions from Question Bank ({selectedQuestionIds.size} selected):
              </span>
              <button
                type="button"
                onClick={() => setSelectedQuestionIds(new Set(allAvailableQuestions.map(q => q.id)))}
                className="text-blue-600 hover:underline cursor-pointer"
              >
                Select All ({allAvailableQuestions.length})
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
              {allAvailableQuestions.map((q) => {
                const isChecked = selectedQuestionIds.has(q.id);
                return (
                  <label
                    key={q.id}
                    className="flex items-center gap-3 p-2.5 hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const next = new Set(selectedQuestionIds);
                        if (e.target.checked) next.add(q.id);
                        else next.delete(q.id);
                        setSelectedQuestionIds(next);
                      }}
                      className="rounded text-blue-600"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-slate-800">{q.title}</span>
                      <span className="text-slate-400 font-mono text-[10px] ml-2">[{q.type}] &bull; {q.points} pts</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={selectedQuestionIds.size === 0 || !title.trim()}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" /> Publish Immutable Version
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
