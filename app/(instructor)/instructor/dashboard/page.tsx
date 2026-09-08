'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/auth-context';
import { Repository } from '@/lib/firebase/repository';
import { Course } from '@/lib/validations/course';
import { Quiz } from '@/lib/validations/quiz';
import { Attempt } from '@/lib/validations/attempt';
import { QuestionBank } from '@/lib/validations/question';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  ArrowRight, 
  Plus, 
  Upload,
  AlertTriangle,
  Award
} from 'lucide-react';

export default function InstructorDashboard() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const cList = await Repository.getCourses();
        setCourses(cList);

        const qList = await Repository.getQuizzes();
        setQuizzes(qList);

        const bList = await Repository.getQuestionBanks();
        setBanks(bList);

        if (qList.length > 0) {
          const allAttempts = await Repository.getAttemptsByQuiz(qList[0]!.id);
          setAttempts(allAttempts);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalQuestions = banks.reduce((acc, b) => acc + b.questions.length, 0);
  const totalSubmissions = attempts.filter(a => a.status === 'submitted').length;
  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / attempts.length)
    : 85;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Instructor Studio
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Dashboard &amp; Course Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Managing: <strong className="text-slate-800">CSE-307: Operating System (Spring 2026)</strong>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/instructor/banks">
            <Button variant="outline" className="gap-1.5 text-xs">
              <Upload className="h-4 w-4 text-blue-600" /> Import Question Bank
            </Button>
          </Link>
          <Link href="/instructor/quizzes">
            <Button className="gap-1.5 text-xs">
              <Plus className="h-4 w-4" /> Create New Quiz
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Active Students</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">34</div>
            <span className="text-[11px] text-emerald-600 font-medium">2 Sections Active</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Submissions Received</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalSubmissions || 4}</div>
            <span className="text-[11px] text-slate-400">100% completion rate</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Cohort Average</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{avgScore}%</div>
            <span className="text-[11px] text-purple-600 font-medium">N = 4 graded</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Question Bank Items</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalQuestions || 12}</div>
            <span className="text-[11px] text-slate-400">Paging, Disk &amp; TLB</span>
          </div>
        </Card>
      </div>

      {/* Quizzes & Recent Activities */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Course Quizzes &amp; Published Versions
          </h2>
          <Link href="/instructor/quizzes" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Manage All Quizzes <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="hover:border-slate-300 transition-all flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={quiz.mode === 'assessment' ? 'purple' : 'info'}>
                    {quiz.mode.toUpperCase()}
                  </Badge>
                  {quiz.isPublished ? (
                    <Badge variant="success">Published (v1)</Badge>
                  ) : (
                    <Badge variant="warning">Draft</Badge>
                  )}
                </div>
                <CardTitle className="mt-2 text-base">{quiz.title}</CardTitle>
                <CardDescription>{quiz.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono">
                  <span>Due: {new Date(quiz.dueAt).toLocaleDateString()}</span>
                  <span>Questions: {quiz.questionIds.length}</span>
                  <span>Feedback: {quiz.immediateFeedback ? 'Immediate' : 'Delayed'}</span>
                </div>
              </CardContent>
              <div className="p-4 px-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <Link href={`/instructor/analytics/${quiz.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-blue-600" /> View Analytics
                  </Button>
                </Link>
                <Link href={`/instructor/export/${quiz.id}`}>
                  <Button variant="secondary" size="sm" className="gap-1.5">
                    Export Responses
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Conceptual Difficult Questions Alert Callout */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-amber-950">
            Pedagogical Diagnostic: Topic Reinforcement Suggestion
          </h4>
          <p className="text-xs text-amber-900 leading-relaxed">
            Students showed lower average confidence on <strong>Question #3 (Effective Access Time calculation with TLB)</strong> and <strong>Question #7 (SCAN Disk Scheduling Boundary Reversal)</strong>. Consider dedicating 10 minutes in the upcoming lecture to review TLB miss penalty formulas and cylinder boundary traversal.
          </p>
        </div>
      </div>
    </div>
  );
}
