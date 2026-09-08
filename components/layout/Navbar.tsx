'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, DEMO_PERSONAS } from '@/lib/firebase/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  BookOpen, 
  Layers, 
  BarChart3, 
  Settings, 
  UserCheck, 
  LogOut,
  Sparkles
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { profile, role, isInstructor, switchDemoPersona, signOut } = useAuth();

  const isQuizActive = pathname?.includes('/attempt/');

  // In active exam/attempt mode, render distraction-free header
  if (isQuizActive) {
    return (
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                CSE-307: Operating System
              </span>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                Secure Assessment Session
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="warning">Assessment in Progress</Badge>
            <span className="text-xs font-mono text-slate-500 hidden sm:inline">
              Autosave Active
            </span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Main Title */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-blue-600 block leading-none">
                  Interactive Assessment
                </span>
                <span className="text-sm font-bold text-slate-900 leading-none mt-1 block">
                  CS Learning Platform
                </span>
              </div>
            </Link>

            {/* Role-based navigation */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              {isInstructor ? (
                <>
                  <Link
                    href="/instructor/dashboard"
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      pathname === '/instructor/dashboard'
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/instructor/courses"
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      pathname.startsWith('/instructor/courses')
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Courses
                  </Link>
                  <Link
                    href="/instructor/banks"
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      pathname.startsWith('/instructor/banks')
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Question Banks
                  </Link>
                  <Link
                    href="/instructor/quizzes"
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      pathname.startsWith('/instructor/quizzes')
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Quizzes
                  </Link>
                  <Link
                    href="/instructor/scenarios"
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      pathname.startsWith('/instructor/scenarios')
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Scenario Engine
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/student/dashboard"
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      pathname === '/student/dashboard'
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    My Courses & Quizzes
                  </Link>
                  <Link
                    href="/student/practice"
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      pathname === '/student/practice'
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Interactive Practice
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* User Controls & Demo Switcher */}
          <div className="flex items-center gap-3">
            {/* Demo Persona Switcher */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <span className="text-[11px] text-slate-500 font-medium px-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" /> Switch Role:
              </span>
              <button
                onClick={() => switchDemoPersona('instructor')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  role === 'instructor' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Instructor
              </button>
              <button
                onClick={() => switchDemoPersona('student1')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  role === 'student' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Student (Ada)
              </button>
              <button
                onClick={() => switchDemoPersona('admin')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  role === 'admin' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Admin
              </button>
            </div>

            {/* Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                {profile?.displayName?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  {profile?.displayName || 'Demo User'}
                </div>
                <div className="text-[10px] text-slate-500 capitalize">
                  {role} Account
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
