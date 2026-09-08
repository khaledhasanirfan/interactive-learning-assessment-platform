'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/auth-context';
import { Repository } from '@/lib/firebase/repository';
import { Quiz, QuizVersion } from '@/lib/validations/quiz';
import { Attempt, StudentResponse } from '@/lib/validations/attempt';
import { Question } from '@/lib/validations/question';
import { evaluateQuestionAnswer } from '@/lib/grading';
import { QuestionRenderer } from '@/components/questions/QuestionRenderer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Send, 
  AlertTriangle,
  Award,
  RotateCcw
} from 'lucide-react';

export default function QuizAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();

  const quizId = params?.quizId as string;
  const rawAttemptId = params?.attemptId as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [version, setVersion] = useState<QuizVersion | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Student answer state: questionId -> answer
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [confidenceRatings, setConfidenceRatings] = useState<Record<string, 1 | 2 | 3 | 4 | 5>>({});
  const [feedbackTexts, setFeedbackTexts] = useState<Record<string, string>>({});
  
  // Timing & Telemetry
  const questionStartTimeRef = useRef<number>(Date.now());
  const responseTimesRef = useRef<Record<string, number>>({});
  const changedCountsRef = useRef<Record<string, number>>({});

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [loading, setLoading] = useState(true);

  // Load Quiz & Initialize Attempt
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const foundQuiz = await Repository.getQuizById(quizId);
        if (!foundQuiz) return;
        setQuiz(foundQuiz);

        const targetVerId = foundQuiz.activeVersionId || 'ver-quiz-vm-v1';
        let foundVer = await Repository.getQuizVersion(quizId, targetVerId);
        if (!foundVer) {
          // Fallback if not published yet
          foundVer = {
            id: targetVerId,
            quizId,
            versionNumber: 1,
            publishedAt: new Date().toISOString(),
            publishedBy: 'system',
            questions: [],
            totalPoints: 10,
            mode: foundQuiz.mode,
            collectConfidence: foundQuiz.collectConfidence,
            immediateFeedback: foundQuiz.immediateFeedback,
            revealCorrectAnswer: foundQuiz.revealCorrectAnswer,
            revealExplanation: foundQuiz.revealExplanation,
            showScoreImmediately: foundQuiz.showScoreImmediately,
          };
        }
        setVersion(foundVer);

        // Load questions
        const qList = foundVer.questions as Question[];
        setQuestions(qList);

        // Load or create attempt
        const existingAttempt = await Repository.getAttemptById(rawAttemptId);
        if (existingAttempt) {
          setAttempt(existingAttempt);
          const savedResponses = await Repository.getResponses(existingAttempt.id);
          const ansMap: Record<string, any> = {};
          const confMap: Record<string, any> = {};
          savedResponses.forEach(r => {
            ansMap[r.questionId] = r.answer;
            if (r.confidenceRating) confMap[r.questionId] = r.confidenceRating;
          });
          setAnswers(ansMap);
          setConfidenceRatings(confMap);
        } else {
          // Initialize fresh attempt
          const newAttempt: Attempt = {
            id: rawAttemptId.startsWith('new-') ? `att-${Date.now()}` : rawAttemptId,
            userId: profile?.id || 'demo-student-ada',
            userName: profile?.displayName || 'Ada Lovelace',
            userEmail: profile?.email || 'ada.lovelace@student.edu',
            courseId: foundQuiz.courseId,
            quizId,
            quizVersionId: foundVer.id,
            attemptNumber: 1,
            startedAt: new Date().toISOString(),
            status: 'in-progress',
            maxScore: foundVer.totalPoints || 10,
          };
          await Repository.saveAttempt(newAttempt);
          setAttempt(newAttempt);
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [quizId, rawAttemptId, profile?.id]);

  // Track response times on navigation
  const recordQuestionTime = () => {
    const activeQ = questions[currentIndex];
    if (!activeQ) return;
    const elapsed = Date.now() - questionStartTimeRef.current;
    responseTimesRef.current[activeQ.id] = (responseTimesRef.current[activeQ.id] || 0) + elapsed;
    questionStartTimeRef.current = Date.now();
  };

  const handleAnswerChange = async (newVal: any) => {
    const activeQ = questions[currentIndex];
    if (!activeQ || attempt?.status === 'submitted') return;

    changedCountsRef.current[activeQ.id] = (changedCountsRef.current[activeQ.id] || 0) + 1;

    setAnswers(prev => ({
      ...prev,
      [activeQ.id]: newVal,
    }));

    // Autosave response
    setSaveStatus('saving');
    if (attempt) {
      await Repository.saveResponse(attempt.id, {
        questionId: activeQ.id,
        attemptId: attempt.id,
        userId: attempt.userId,
        answer: newVal,
        responseTimeMs: responseTimesRef.current[activeQ.id] || 0,
        confidenceRating: confidenceRatings[activeQ.id],
        changedAnswerCount: changedCountsRef.current[activeQ.id] || 0,
        hintUsed: false,
        updatedAt: new Date().toISOString(),
      });
    }
    setTimeout(() => setSaveStatus('saved'), 300);
  };

  const handleConfidenceChange = async (rating: 1 | 2 | 3 | 4 | 5) => {
    const activeQ = questions[currentIndex];
    if (!activeQ || attempt?.status === 'submitted') return;

    setConfidenceRatings(prev => ({
      ...prev,
      [activeQ.id]: rating,
    }));

    if (attempt) {
      await Repository.saveResponse(attempt.id, {
        questionId: activeQ.id,
        attemptId: attempt.id,
        userId: attempt.userId,
        answer: answers[activeQ.id],
        responseTimeMs: responseTimesRef.current[activeQ.id] || 0,
        confidenceRating: rating,
        changedAnswerCount: changedCountsRef.current[activeQ.id] || 0,
        hintUsed: false,
        updatedAt: new Date().toISOString(),
      });
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

  // Final Submission
  const handleFinalSubmit = async () => {
    if (!attempt || !version) return;
    setIsSubmitting(true);
    recordQuestionTime();

    try {
      // Server-side / local pure grading tally
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
          confidenceRating: confidenceRatings[q.id],
          changedAnswerCount: changedCountsRef.current[q.id] || 0,
          hintUsed: false,
          updatedAt: new Date().toISOString(),
        };

        await Repository.saveResponse(attempt.id, respRecord);
        responseList.push(respRecord);
      }

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
          <Clock className="h-6 w-6 animate-spin text-blue-600" />
          <p className="text-sm">Loading assessment environment...</p>
        </div>
      </div>
    );
  }

  const activeQuestion = questions[currentIndex];
  const isSubmitted = attempt?.status === 'submitted';
  const showSolutionsNow = isSubmitted && (quiz.immediateFeedback || quiz.revealExplanation);
  const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== '').length;

  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Banner with Navigation & Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/student/dashboard">
            <Button variant="ghost" size="sm" className="gap-1 text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" /> Exit
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <span className="text-xs font-bold text-slate-900">{quiz.title}</span>
            <span className="text-xs text-slate-500 block">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <Save className={`h-3.5 w-3.5 ${saveStatus === 'saving' ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} />
            {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
          </span>
          {isSubmitted ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" /> Submitted
            </Badge>
          ) : (
            <Button 
              variant="success" 
              size="sm" 
              onClick={() => setIsSubmitModalOpen(true)}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" /> Submit Assessment
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={currentIndex + 1} max={questions.length} />

      {/* Submitted Results Review Banner */}
      {isSubmitted && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
              <Award className="h-5 w-5 text-emerald-600" />
              Assessment Completed &amp; Sealed
            </div>
            <p className="text-xs text-emerald-800">
              Submitted on {new Date(attempt?.submittedAt || '').toLocaleString()}.
              {quiz.immediateFeedback 
                ? ' Full solutions and pedagogical explanations are released below.' 
                : ' Detailed review will be released by your instructor after the deadline.'}
            </p>
          </div>
          <div className="bg-white px-5 py-2.5 rounded-xl border border-emerald-200 text-center">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">
              Your Score
            </span>
            <span className="text-xl font-extrabold text-emerald-700">
              {attempt?.score !== undefined ? `${attempt.score} / ${attempt.maxScore}` : 'Sealed'}
            </span>
            <span className="text-xs text-slate-400 block">
              {attempt?.percentage !== undefined ? `${attempt.percentage}%` : ''}
            </span>
          </div>
        </div>
      )}

      {/* Main Question Card */}
      {activeQuestion ? (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <QuestionRenderer
            question={activeQuestion}
            answer={answers[activeQuestion.id]}
            onChange={handleAnswerChange}
            isReadOnly={isSubmitted}
            showSolution={showSolutionsNow}
            evaluation={isSubmitted ? evaluateQuestionAnswer(activeQuestion, answers[activeQuestion.id]) : undefined}
          />

          {/* Metacognitive Confidence Calibration Bar */}
          {quiz.collectConfidence && activeQuestion.type !== 'confidence' && (
            <div className="pt-6 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>How confident are you in this answer? (Metacognitive calibration)</span>
                <span className="text-blue-600 font-bold">
                  {confidenceRatings[activeQuestion.id] ? `${confidenceRatings[activeQuestion.id]}/5` : 'Optional'}
                </span>
              </div>
              <div className="flex items-center gap-2 max-w-sm">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    disabled={isSubmitted}
                    onClick={() => handleConfidenceChange(lvl as any)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      confidenceRatings[activeQuestion.id] === lvl
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Question Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              disabled={currentIndex === 0}
              onClick={goToPrevQuestion}
              className="gap-1.5"
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
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-1'
                        : isAnswered
                        ? 'bg-slate-200 text-slate-800'
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
                variant="primary"
                size="sm"
                onClick={goToNextQuestion}
                className="gap-1.5"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : !isSubmitted ? (
              <Button
                variant="success"
                size="sm"
                onClick={() => setIsSubmitModalOpen(true)}
                className="gap-1.5"
              >
                Review &amp; Submit <Send className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Link href="/student/dashboard">
                <Button variant="secondary" size="sm">
                  Return to Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
          No questions in this quiz.
        </div>
      )}

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Confirm Final Submission"
        description="Once submitted, your responses will be sealed and evaluated."
      >
        <div className="space-y-4 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
            <span>Answered questions:</span>
            <strong className="text-slate-900 font-bold">{answeredCount} of {questions.length}</strong>
          </div>

          {answeredCount < questions.length && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                You have <strong>{questions.length - answeredCount} unanswered</strong> questions. You can still submit, or return to answer them.
              </span>
            </div>
          )}

          <p className="text-slate-500">
            Are you sure you want to finish this assessment now?
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setIsSubmitModalOpen(false)}
            >
              Continue Working
            </Button>
            <Button
              type="button"
              variant="success"
              isLoading={isSubmitting}
              onClick={handleFinalSubmit}
            >
              Confirm &amp; Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
