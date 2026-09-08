'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Cpu, 
  Disc, 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight, 
  BarChart2, 
  ShieldCheck, 
  Layers,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  const { role, isInstructor, switchDemoPersona } = useAuth();

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-xs">
        <div className="max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">Spring 2026 Semester</Badge>
            <Badge variant="purple">Undergraduate Computer Science</Badge>
            <Badge variant="success">CSE-307: Operating System</Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Interactive Learning &amp; Assessment Platform
          </h1>

          <p className="text-base text-slate-600 leading-relaxed">
            A high-fidelity academic platform combining multi-type question banks, interactive hardware/OS scenario simulations, metacognitive confidence tracking, and privacy-first learning analytics.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-3">
            {isInstructor ? (
              <Link href="/instructor/dashboard">
                <Button size="lg" className="gap-2">
                  Open Instructor Studio <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/student/dashboard">
                <Button size="lg" className="gap-2">
                  Go to Student Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link href="/student/practice">
              <Button variant="outline" size="lg" className="gap-2">
                Launch Practice Lab
              </Button>
            </Link>
          </div>
        </div>

        {/* Floating Quick Role Switcher Banner */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Currently exploring as: <strong className="text-slate-900 capitalize font-bold">{role}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span>Quick switch persona:</span>
            <button
              onClick={() => switchDemoPersona('instructor')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-800 font-medium cursor-pointer"
            >
              Instructor (Turing)
            </button>
            <button
              onClick={() => switchDemoPersona('student1')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-800 font-medium cursor-pointer"
            >
              Student (Ada)
            </button>
            <button
              onClick={() => switchDemoPersona('admin')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-800 font-medium cursor-pointer"
            >
              Admin (Ritchie)
            </button>
          </div>
        </div>
      </div>

      {/* Featured Interactive Scenario Modules */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Interactive Scenario Engines
            </h2>
            <p className="text-xs text-slate-500">
              Pluggable technical simulations supporting algorithmic evaluation, step tracing, and visual models.
            </p>
          </div>
          <Link href="/student/practice" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Explore All Scenarios <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Module 1: Paging */}
          <Card className="hover:border-blue-300 transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                  <Cpu className="h-6 w-6" />
                </div>
                <Badge variant="info">Memory Management</Badge>
              </div>
              <CardTitle className="mt-3">Paging Address Translation</CardTitle>
              <CardDescription>
                Translate CPU logical byte addresses into binary representations, decompose into Page # and Offset, perform Page Table lookup, and compute physical RAM byte addresses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Visual MMU architecture: CPU $\rightarrow$ Logical $\rightarrow$ Page Table $\rightarrow$ RAM
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Dual binary/decimal step-by-step validation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Full pedagogical solution explanation on submission
                </li>
              </ul>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link href="/student/practice?scenario=paging" className="w-full">
                  <Button variant="outline" className="w-full justify-center">
                    Launch Paging Simulation
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Module 2: Disk Scheduling */}
          <Card className="hover:border-blue-300 transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
                  <Disc className="h-6 w-6" />
                </div>
                <Badge variant="purple">Storage &amp; I/O</Badge>
              </div>
              <CardTitle className="mt-3">Disk Scheduling Algorithms</CardTitle>
              <CardDescription>
                Simulate magnetic cylinder head movements across FCFS, SSTF, SCAN, and C-SCAN. Compare head displacement curves and service sequences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Horizontal cylinder track with dynamic head pointer
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Solvers for FCFS, SSTF, SCAN, and C-SCAN
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Total head movement calculation and algorithm comparison table
                </li>
              </ul>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link href="/student/practice?scenario=disk" className="w-full">
                  <Button variant="outline" className="w-full justify-center">
                    Launch Disk Scheduling Lab
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Zero-Trust Security</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Deny-by-default Firestore rules, immutable quiz versions, and server-side grading prevent answers from leaking during active assessments.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <BarChart2 className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Educational Analytics</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Item difficulty index, response duration, confidence calibration, and anonymized CSV export for research and LMS gradebooks.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Layers className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Extensible Questions</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            10 question types: Single/Multi MCQ, True/False, Numeric with tolerance, Short text, Ordering, Matching, Scenarios, and Confidence.
          </p>
        </div>
      </div>
    </div>
  );
}
