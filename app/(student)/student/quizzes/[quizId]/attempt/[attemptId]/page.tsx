'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/auth-context';
import { Repository } from '@/lib/firebase/repository';
import { Quiz, QuizVersion } from '@/lib/validations/quiz';
import { Attempt, StudentResponse } from '@/lib/validations/attempt';
import { Question } from '@/lib/validations/question';
import { evaluateQuestionAnswer, EvaluationResult } from '@/lib/grading';
import { QuestionRenderer } from '@/components/questions/QuestionRenderer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Modal } from '@/components/ui/modal';
import { 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Award,
  HelpCircle,
  Sparkles,
  BookOpen,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';

interface AttemptPageProps {
  params: Promise<{ quizId: string; attemptId: string }>;
}

export default function AssessmentAttemptPage({ params }: AttemptPageProps) {
  const { quizId, attemptId } = use(params);
  const router = useRouter();
  const { profile } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [version, setVersion] = useState<QuizVersion | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Student Responses State: map of questionId -> answer
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [confidenceRatings, setConfidenceRatings] = useState<Record<string, number>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Telemetry references
  const questionStartTimeRef = useRef<number>(Date.now());
  const responseTimesRef = useRef<Record<string, number>>({});
  const changedCountsRef = useRef<Record<string, number>>({});

  // Initialize or fetch Attempt & Quiz snapshot
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const q = await Repository.getQuizById(quizId);
        if (!q) {
          router.push('/student/dashboard');
          return;
        }
        setQuiz(q);

        const versionId = q.activeVersionId;
        if (!versionId) return;

        const qv = await Repository.getQuizVersion(quizId, versionId);
        if (!qv) return;
        setVersion(qv);
        setQuestions(qv.questions);

        const userId = profile?.email?.split('@')[0] || profile?.id || '202014019';
        const userEmail = profile?.email || `${userId}@student.mist.ac.bd`;
        const userName = profile?.displayName || 'Student';

        let existingAttempt: Attempt | null = null;
        if (attemptId !== 'new') {
          existingAttempt = await Repository.getAttemptById(attemptId);
        }

        if (!existingAttempt) {
          const prevAttempts = await Repository.getAttemptsByUser(userId);
          const quizAttempts = prevAttempts.filter(a => a.quizId === q.id);
          const attemptNumber = quizAttempts.length + 1;

          const newAttempt: Attempt = {
            id: `att-${Date.now()}`,
            userId,
            userEmail,
            userName,
            courseId: q.courseId,
            quizId: q.id,
            quizVersionId: qv.id,
            attemptNumber,
            startedAt: new Date().toISOString(),
            status: 'in-progress',
            maxScore: qv.totalPoints,
          };
          await Repository.saveAttempt(newAttempt);
          setAttempt(newAttempt);
        } else {
          setAttempt(existingAttempt);
          const savedResponses = await Repository.getResponsesByAttempt(existingAttempt.id);
          const answerMap: Record<string, any> = {};
          const confMap: Record<string, number> = {};
          savedResponses.forEach(r => {
            answerMap[r.questionId] = r.answer;
            if (r.confidenceRating) confMap[r.questionId] = r.confidenceRating;
          });
          setAnswers(answerMap);
          setConfidenceRatings(confMap);
        }
      } finally {
        setLoading(false);
        questionStartTimeRef.current = Date.now();
      }
    }

    init();
  }, [quizId, attemptId, profile, router]);

  // Answer modification with autosave
  const handleAnswerChange = async (val: any) => {
    if (!attempt || attempt.status === 'submitted') return;

    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    changedCountsRef.current[currentQ.id] = (changedCountsRef.current[currentQ.id] || 0) + 1;

    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: val,
    }));

    setSaveStatus('saving');
    const spentMs = (responseTimesRef.current[currentQ.id] || 0) + (Date.now() - questionStartTimeRef.current);
    responseTimesRef.current[currentQ.id] = spentMs;
    questionStartTimeRef.current = Date.now();

    const responseRecord: StudentResponse = {
      questionId: currentQ.id,
      attemptId: attempt.id,
      userId: attempt.userId,
      answer: val,
      responseTimeMs: spentMs,
      confidenceRating: confidenceRatings[currentQ.id] as any,
      changedAnswerCount: changedCountsRef.current[currentQ.id] || 0,
      hintUsed: false,
      updatedAt: new Date().toISOString(),
    };

    try {
      await Repository.saveResponse(attempt.id, responseRecord);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('idle');
    }
  };

  const handleConfidenceChange = (rating: 1 | 2 | 3 | 4 | 5) => {
    if (!attempt || attempt.status === 'submitted') return;
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    setConfidenceRatings(prev => ({
      ...prev,
      [currentQ.id]: rating,
    }));

    if (answers[currentQ.id] !== undefined) {
      handleAnswerChange(answers[currentQ.id]);
    }
  };

  const recordQuestionTime = () => {
    const currentQ = questions[currentIndex];
    if (currentQ) {
      const now = Date.now();
      const elapsed = now - questionStartTimeRef.current;
      responseTimesRef.current[currentQ.id] = (responseTimesRef.current[currentQ.id] || 0) + elapsed;
      questionStartTimeRef.current = now;
    }
  };

  const goToNextQuestion = () => {
    recordQuestionTime();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevQuestion = () => {
    recordQuestionTime();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Final Submission with smart semantic evaluation
  const handleFinalSubmit = async () => {
    if (!attempt || !version) return;
    setIsSubmitting(true);
    recordQuestionTime();

    try {
      let totalEarned = 0;
      const responseList: StudentResponse[] = [];

      for (const q of questions) {
        const studentAns = answers[q.id];
        const evalRes = evaluateQuestionAnswer(q, studentAns);
        totalEarned += evalRes.pointsEarned;

        const respRecord: StudentResponse = {
          questionId: q.id,
          attemptId: attempt.id,
          userId: attempt.userId,
          answer: studentAns,
          isCorrect: evalRes.isCorrect,
          pointsEarned: evalRes.pointsEarned,
          responseTimeMs: responseTimesRef.current[q.id] || 0,
          confidenceRating: confidenceRatings[q.id] as any,
          changedAnswerCount: changedCountsRef.current[q.id] || 0,
          hintUsed: false,
          updatedAt: new Date().toISOString(),
        };

        await Repository.saveResponse(attempt.id, respRecord);
        responseList.push(respRecord);
      }

      totalEarned = Math.round(totalEarned * 10) / 10;
      const maxScore = version.totalPoints || questions.reduce((acc, q) => acc + (q.points || 1), 0);
      const percentage = Math.round((totalEarned / maxScore) * 100);

      const updatedAttempt: Attempt = {
        ...attempt,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        score: totalEarned,
        maxScore,
        percentage,
      };

      await Repository.saveAttempt(updatedAttempt);
      setAttempt(updatedAttempt);
      setIsSubmitModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !quiz) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <Clock className="h-6 w-6 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold text-slate-700">Loading assessment environment...</p>
        </div>
      </div>
    );
  }

  const activeQuestion = questions[currentIndex];
  const isSubmitted = attempt?.status === 'submitted';
  const showSolutionsNow = isSubmitted;
  const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== '').length;

  return (
    <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 xl:px-12 py-6 sm:py-8 space-y-6">
      {/* Top Banner with Navigation & Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/student/dashboard">
            <Button variant="ghost" size="sm" className="gap-1 text-slate-600 hover:text-emerald-900">
              <ArrowLeft className="h-4 w-4" /> Exit
            </Button>
          </Link>
          <div className="h-4 w-px bg-emerald-100" />
          <div>
            <span className="text-sm font-bold text-slate-900">{quiz.title}</span>
            <span className="text-xs text-slate-500 block">
              {!isSubmitted ? `Question ${currentIndex + 1} of ${questions.length}` : `${questions.length} Questions Submitted`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isSubmitted && (
            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
              <Save className={`h-3.5 w-3.5 ${saveStatus === 'saving' ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} />
              {saveStatus === 'saving' ? 'Autosaving...' : 'Progress Saved'}
            </span>
          )}
          {isSubmitted ? (
            <Badge variant="success" className="gap-1 bg-emerald-100 text-emerald-800 border-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Assessment Submitted
            </Badge>
          ) : (
            <Button 
              size="sm" 
              onClick={() => setIsSubmitModalOpen(true)}
              className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-full px-5 shadow-xs transition-all hover:scale-[1.02]"
            >
              <Send className="h-3.5 w-3.5" /> Submit Assessment
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar (While Taking) */}
      {!isSubmitted && (
        <Progress value={currentIndex + 1} max={questions.length} className="h-2 bg-emerald-100" />
      )}

      {/* SUBMITTED VIEW: DETAILED SUMMARY & QUESTION-BY-QUESTION REVIEW */}
      {isSubmitted ? (
        <div className="space-y-8 animate-pop-success">
          {/* Results Summary Banner */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
                <Award className="w-4 h-4 text-emerald-200" />
                <span>Assessment Completed &amp; Evaluated</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Great Job! Your Responses Are Recorded 🎉
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-xl font-medium">
                Submitted on {new Date(attempt?.submittedAt || '').toLocaleString()}. Detailed question-by-question justifications and model explanations are provided below.
              </p>
            </div>

            <div className="bg-white px-8 py-5 rounded-3xl border border-emerald-200 text-center shadow-md">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-bold block mb-0.5">
                Your Final Score
              </span>
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-800 block">
                {attempt?.score !== undefined ? `${attempt.score} / ${attempt.maxScore}` : 'Recorded'}
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full inline-block mt-2 border border-emerald-200">
                {attempt?.percentage !== undefined ? `${attempt.percentage}% Mastery` : 'Completed'}
              </span>
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>Question-by-Question Justification &amp; Explanations</span>
              </h3>
              <Link href="/student/dashboard">
                <Button variant="outline" size="sm" className="rounded-full border-emerald-200 text-emerald-800 hover:bg-emerald-50 text-xs font-bold">
                  Return to Dashboard
                </Button>
              </Link>
            </div>

            {questions.map((q, idx) => {
              const studentAns = answers[q.id];
              const evalRes = evaluateQuestionAnswer(q, studentAns);

              return (
                <div 
                  key={q.id}
                  className="bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-100 p-6 sm:p-8 shadow-xs space-y-5"
                >
                  {/* Item Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-50 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-600 text-white">
                        Question #{idx + 1}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                        {q.type.replace('-', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                        evalRes.pointsEarned === evalRes.maxPoints
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : evalRes.pointsEarned > 0
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        Score: {evalRes.pointsEarned} / {evalRes.maxPoints} pts
                      </span>
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div>
                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {q.prompt}
                    </h4>
                  </div>

                  {/* Student Answer vs Model Answer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Your Submitted Answer:
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 break-words">
                        {studentAns !== undefined && studentAns !== '' 
                          ? (typeof studentAns === 'object' ? JSON.stringify(studentAns) : String(studentAns))
                          : 'No answer provided'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Expected / Model Answer:
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-emerald-950 break-words">
                        {evalRes.modelAnswer || q.explanation || 'See justification below'}
                      </p>
                    </div>
                  </div>

                  {/* Justification & Pedagogical Explanation Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-mint-50 border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Justification &amp; Pedagogical Explanation:</span>
                    </div>
                    <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed font-medium">
                      {evalRes.justification || evalRes.feedback || q.explanation || 'The answer is evaluated according to core Operating Systems principles.'}
                    </p>
                    {evalRes.feedback && evalRes.feedback !== evalRes.justification && (
                      <p className="text-xs text-emerald-800 italic pt-1 border-t border-emerald-200/60">
                        Evaluator Note: {evalRes.feedback}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Bottom Return CTA */}
            <div className="text-center pt-4">
              <Link href="/student/dashboard">
                <Button size="lg" className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm px-9 py-6 shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
                  Return to Student Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* ACTIVE QUESTION TAKING CARD */
        activeQuestion && (
          <div className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-emerald-100 shadow-sm space-y-6">
            <QuestionRenderer
              question={activeQuestion}
              answer={answers[activeQuestion.id]}
              onChange={handleAnswerChange}
              isReadOnly={false}
              showSolution={false}
            />

            {/* Metacognitive Confidence Bar */}
            {quiz.collectConfidence && activeQuestion.type !== 'confidence' && (
              <div className="pt-6 border-t border-emerald-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span>How confident are you in your answer?</span>
                  <span className="text-emerald-700 font-bold">
                    {confidenceRatings[activeQuestion.id] ? `${confidenceRatings[activeQuestion.id]} / 5` : 'Select Confidence'}
                  </span>
                </div>
                <div className="flex items-center gap-2 max-w-sm">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => handleConfidenceChange(lvl as any)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        confidenceRatings[activeQuestion.id] === lvl
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-emerald-50/50 text-slate-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Question Navigation Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-emerald-100">
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndex === 0}
                onClick={goToPrevQuestion}
                className="gap-1.5 rounded-xl border-emerald-200 text-slate-700 hover:bg-emerald-50"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </Button>

              <div className="hidden sm:flex items-center gap-1.5">
                {questions.map((q, idx) => {
                  const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
                  const isCurrent = idx === currentIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        recordQuestionTime();
                        setCurrentIndex(idx);
                      }}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 ring-offset-1 shadow-xs'
                          : isAnswered
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {currentIndex < questions.length - 1 ? (
                <Button
                  size="sm"
                  onClick={goToNextQuestion}
                  className="gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:from-emerald-700 hover:to-teal-700"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:from-emerald-700 hover:to-teal-700 shadow-sm"
                >
                  Review &amp; Submit <Send className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        )
      )}

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Confirm Final Submission"
        description="Once submitted, your responses will be evaluated and justifications will be revealed."
      >
        <div className="space-y-4 text-xs text-slate-600">
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-center justify-between">
            <span className="font-semibold text-slate-700">Answered questions:</span>
            <strong className="text-emerald-900 font-extrabold">{answeredCount} of {questions.length}</strong>
          </div>

          {answeredCount < questions.length && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                You have <strong>{questions.length - answeredCount} unanswered</strong> questions. You can still submit now, or return to answer them.
              </span>
            </div>
          )}

          <p className="text-slate-500 font-medium">
            Are you ready to seal your assessment and view your evaluated score and justifications?
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setIsSubmitModalOpen(false)}
              className="rounded-xl border-slate-200 text-xs font-bold"
            >
              Continue Working
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold hover:from-emerald-700 hover:to-teal-700"
            >
              {isSubmitting ? 'Evaluating...' : 'Confirm & Submit'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
