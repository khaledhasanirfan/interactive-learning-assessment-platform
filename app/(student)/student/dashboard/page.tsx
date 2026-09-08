'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/auth-context';
import { Repository } from '@/lib/firebase/repository';
import { Course } from '@/lib/validations/course';
import { Quiz } from '@/lib/validations/quiz';
import { Attempt } from '@/lib/validations/attempt';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Play, 
  ArrowRight, 
  Key, 
  AlertCircle,
  HelpCircle,
  Flame,
  Award
} from 'lucide-react';

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Join Course Modal
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const courseList = await Repository.getCourses();
        setCourses(courseList);

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

  const handleJoinCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    setJoinSuccess('');

    const trimmed = enrollmentCode.trim().toUpperCase();
    const targetCourse = courses.find(c => c.enrollmentCode.toUpperCase() === trimmed);

    if (!targetCourse) {
      setJoinError('Invalid course enrollment code. For the demo, use "OS2026".');
      return;
    }

    if (profile) {
      await Repository.joinCourse(targetCourse.id, {
        userId: profile.id,
        userEmail: profile.email,
        userName: profile.displayName,
        courseId: targetCourse.id,
        role: 'student',
        enrolledAt: new Date().toISOString(),
        status: 'active',
      });
      setJoinSuccess(`Successfully enrolled in ${targetCourse.courseCode}: ${targetCourse.courseTitle}!`);
      setTimeout(() => {
        setIsJoinModalOpen(false);
        setEnrollmentCode('');
        setJoinSuccess('');
      }, 1200);
    }
  };

  const getQuizAttempt = (quizId: string) => {
    return attempts.find(a => a.quizId === quizId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dashboard Greeting Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Student Portal
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Welcome back, {profile?.displayName || 'Student'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active Semester: Spring 2026 &bull; Enrolled in {courses.length} course(s)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsJoinModalOpen(true)}
            className="gap-1.5"
          >
            <Key className="h-4 w-4 text-blue-600" />
            Join with Course Code
          </Button>
          <Link href="/student/practice">
            <Button className="gap-1.5">
              <Flame className="h-4 w-4 text-amber-300" />
              Practice Lab
            </Button>
          </Link>
        </div>
      </div>

      {/* Enrolled Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            My Courses
          </h2>
          <span className="text-xs text-slate-500 font-medium">{courses.length} Enrolled</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="hover:border-slate-300 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="info">{course.courseCode}</Badge>
                  <span className="text-xs font-mono text-slate-400">Code: {course.enrollmentCode}</span>
                </div>
                <CardTitle className="mt-2 text-lg">{course.courseTitle}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Semester: <strong>{course.semester}</strong></span>
                  <span>Sections: <strong>{course.sections.length}</strong></span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Assigned Quizzes & Activities */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Assigned Quizzes &amp; Activities
          </h2>
          <span className="text-xs text-slate-500 font-medium">{quizzes.length} Available</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {quizzes.map((quiz) => {
            const attempt = getQuizAttempt(quiz.id);
            const isSubmitted = attempt?.status === 'submitted';
            const isInProgress = attempt?.status === 'in-progress';
            const isAssessment = quiz.mode === 'assessment';

            const attemptUrl = attempt
              ? `/student/quizzes/${quiz.id}/attempt/${attempt.id}`
              : `/student/quizzes/${quiz.id}/attempt/new-${Date.now()}`;

            return (
              <Card key={quiz.id} className="flex flex-col justify-between hover:border-slate-300 transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={isAssessment ? 'purple' : 'info'}>
                      {isAssessment ? 'Assessment Mode' : 'Practice Mode'}
                    </Badge>
                    {isSubmitted ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Submitted
                      </Badge>
                    ) : isInProgress ? (
                      <Badge variant="warning" className="gap-1">
                        <Clock className="h-3 w-3" /> In Progress
                      </Badge>
                    ) : (
                      <Badge variant="default">Not Started</Badge>
                    )}
                  </div>
                  <CardTitle className="mt-2">{quiz.title}</CardTitle>
                  <CardDescription>{quiz.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block">Due Date:</span>
                      <strong className="text-slate-800">
                        {new Date(quiz.dueAt).toLocaleDateString()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Time Limit:</span>
                      <strong className="text-slate-800">
                        {quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} mins` : 'No limit'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Max Attempts:</span>
                      <strong className="text-slate-800">
                        {quiz.maxAttempts === 0 ? 'Unlimited' : quiz.maxAttempts}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Immediate Feedback:</span>
                      <strong className={quiz.immediateFeedback ? 'text-emerald-700' : 'text-slate-700'}>
                        {quiz.immediateFeedback ? 'Enabled' : 'Delayed until closed'}
                      </strong>
                    </div>
                  </div>

                  {isSubmitted && attempt && (
                    <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                      <span className="text-emerald-800 font-semibold flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-emerald-600" /> Your Result:
                      </span>
                      <span className="font-bold text-emerald-950 text-sm">
                        {attempt.score !== undefined ? `${attempt.score} / ${attempt.maxScore} (${attempt.percentage}%)` : 'Grading Sealed'}
                      </span>
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  <span className="text-xs text-slate-500">
                    {quiz.questionIds.length} questions
                  </span>
                  <Link href={attemptUrl}>
                    <Button 
                      variant={isSubmitted && !quiz.immediateFeedback ? 'secondary' : 'primary'}
                      size="sm"
                      className="gap-1.5"
                    >
                      {isSubmitted ? (
                        quiz.mode === 'practice' ? 'Retake Practice' : 'Inspect Review'
                      ) : isInProgress ? (
                        'Resume Attempt'
                      ) : (
                        'Start Activity'
                      )}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Join Course Modal */}
      <Modal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        title="Join a Course"
        description="Enter the 6-character course enrollment code provided by your instructor."
      >
        <form onSubmit={handleJoinCourse} className="space-y-4">
          <Input
            label="Course Enrollment Code"
            placeholder="e.g. OS2026"
            value={enrollmentCode}
            onChange={(e) => setEnrollmentCode(e.target.value)}
            helperText="Demo tip: Use enrollment code 'OS2026' to join Operating Systems."
            error={joinError}
            autoFocus
          />

          {joinSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {joinSuccess}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsJoinModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Enroll in Course
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
