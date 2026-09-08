'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, User, Sparkles, KeyRound, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PortalPage() {
  const router = useRouter();
  const { loginAdmin, loginStudent, signupStudent } = useAuth();

  const [roleTab, setRoleTab] = useState<'student' | 'admin'>('student');
  const [studentMode, setStudentMode] = useState<'login' | 'signup'>('login');

  // Admin Inputs
  const [adminId, setAdminId] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Student Inputs
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentPass, setStudentPass] = useState('');
  const [showStudentPass, setShowStudentPass] = useState(false);
  const [studentError, setStudentError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    const success = loginAdmin(adminId, adminPass);
    if (success) {
      router.push('/instructor/dashboard');
    } else {
      setAdminError('Invalid Admin ID or Password. Please enter the correct admin credentials.');
    }
  };

  const handleStudentAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    if (studentMode === 'signup') {
      if (!studentName.trim() || !studentId.trim() || !studentPass.trim()) {
        setStudentError('Please fill in all fields (Name, Student ID, and Password).');
        return;
      }
      setLoading(true);
      const res = await signupStudent(studentName, studentId, studentPass);
      setLoading(false);
      if (res.success) {
        router.push('/student/dashboard');
      } else {
        setStudentError(res.error || 'Registration failed.');
      }
    } else {
      if (!studentId.trim() || !studentPass.trim()) {
        setStudentError('Please enter both your Student ID and Password.');
        return;
      }
      setLoading(true);
      const res = await loginStudent(studentId, studentPass);
      setLoading(false);
      if (res.success) {
        router.push('/student/dashboard');
      } else {
        setStudentError(res.error || 'Invalid credentials.');
      }
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-sky-200/30 via-teal-100/20 to-emerald-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="w-full max-w-md mx-auto">
        {/* Top Header & Buddy Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex p-2.5 rounded-2xl bg-white shadow-md border border-sky-100 mb-3">
            <Image src="/logo.svg" alt="KernelBuddy" width={42} height={42} className="object-contain" priority />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to KernelBuddy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Choose your portal to enter your interactive workspace
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center mb-6 shadow-inner">
          <button
            type="button"
            onClick={() => setRoleTab('student')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              roleTab === 'student'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className={`w-4 h-4 ${roleTab === 'student' ? 'text-emerald-600' : ''}`} />
            <span>I am a Student</span>
          </button>
          <button
            type="button"
            onClick={() => setRoleTab('admin')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              roleTab === 'admin'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${roleTab === 'admin' ? 'text-sky-600' : ''}`} />
            <span>I am an Admin</span>
          </button>
        </div>

        {/* Card Container */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-sky-100/80 p-6 sm:p-8 shadow-md">
          {roleTab === 'admin' ? (
            /* ADMIN LOGIN FORM */
            <div>
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Admin Authentication</h2>
                  <p className="text-xs text-slate-500">Access platform management and student analytics</p>
                </div>
              </div>

              {adminError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{adminError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Admin ID
                  </label>
                  <Input
                    type="text"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    placeholder="Enter admin ID (e.g. khaled19)"
                    className="rounded-xl border-slate-200 focus:border-sky-500 focus:ring-sky-500 text-sm h-11"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Admin Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showAdminPass ? 'text' : 'password'}
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      placeholder="Enter admin password"
                      className="rounded-xl border-slate-200 focus:border-sky-500 focus:ring-sky-500 text-sm h-11 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-bold text-sm h-11 shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-2 mt-2"
                >
                  <span>Sign In as Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </div>
          ) : (
            /* STUDENT LOGIN / SIGNUP FORM */
            <div>
              {/* Student Mode Switcher */}
              <div className="flex border-b border-slate-200/80 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setStudentMode('login');
                    setStudentError('');
                  }}
                  className={`flex-1 pb-2.5 text-xs sm:text-sm font-bold transition-all border-b-2 ${
                    studentMode === 'login'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudentMode('signup');
                    setStudentError('');
                  }}
                  className={`flex-1 pb-2.5 text-xs sm:text-sm font-bold transition-all border-b-2 ${
                    studentMode === 'signup'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {studentError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{studentError}</span>
                </div>
              )}

              <form onSubmit={handleStudentAuth} className="space-y-4">
                {studentMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <Input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Ada Lovelace"
                      className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm h-11"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Student ID
                  </label>
                  <Input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. STU-2026-001"
                    className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm h-11"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showStudentPass ? 'text' : 'password'}
                      value={studentPass}
                      onChange={(e) => setStudentPass(e.target.value)}
                      placeholder={studentMode === 'signup' ? 'Choose a password' : 'Enter your password'}
                      className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm h-11 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowStudentPass(!showStudentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showStudentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm h-11 shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-2 mt-2"
                >
                  <span>{loading ? 'Authenticating...' : studentMode === 'signup' ? 'Open Account & Enter' : 'Sign In as Student'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>

              {/* Demo Hint */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <p className="text-[11px] text-slate-400">
                  Pre-configured Demo Student: <span className="font-mono text-slate-600">STU-2026-001</span> (pass: <span className="font-mono text-slate-600">password123</span>)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Back to Home Link */}
        <div className="text-center mt-4">
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-sky-600 transition-colors">
            &larr; Back to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
