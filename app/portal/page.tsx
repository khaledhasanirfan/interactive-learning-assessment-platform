'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  User, 
  ShieldCheck, 
  ArrowRight, 
  KeyRound, 
  Sparkles, 
  Eye, 
  EyeOff, 
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';

export default function PortalPage() {
  const router = useRouter();
  const { loginAdmin, loginStudent, signupStudent } = useAuth();

  const [roleTab, setRoleTab] = useState<'student' | 'admin'>('student');
  const [studentMode, setStudentMode] = useState<'login' | 'signup'>('login');

  // Admin form state
  const [adminId, setAdminId] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminStatus, setAdminStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Student form state
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentPass, setStudentPass] = useState('');
  const [showStudentPass, setShowStudentPass] = useState(false);
  const [studentError, setStudentError] = useState('');
  const [studentStatus, setStudentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminStatus('idle');

    const success = loginAdmin(adminId, adminPass);
    if (success) {
      setAdminStatus('success');
      setTimeout(() => {
        router.push('/instructor/dashboard');
      }, 450);
    } else {
      setAdminStatus('error');
      setAdminError('Invalid Admin ID or Password. Confidential access only.');
      setTimeout(() => setAdminStatus('idle'), 1500);
    }
  };

  const handleStudentAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');
    setStudentStatus('idle');

    if (studentMode === 'signup') {
      if (!studentName.trim() || !studentId.trim() || !studentPass.trim()) {
        setStudentStatus('error');
        setStudentError('Please fill in all fields (Full Name, Student ID, and Password).');
        setTimeout(() => setStudentStatus('idle'), 1500);
        return;
      }
      setLoading(true);
      const res = await signupStudent(studentName, studentId, studentPass);
      setLoading(false);
      if (res.success) {
        setStudentStatus('success');
        setTimeout(() => {
          router.push('/student/dashboard');
        }, 450);
      } else {
        setStudentStatus('error');
        setStudentError(res.error || 'Registration failed.');
        setTimeout(() => setStudentStatus('idle'), 1500);
      }
    } else {
      if (!studentId.trim() || !studentPass.trim()) {
        setStudentStatus('error');
        setStudentError('Please enter both your Student ID and Password.');
        setTimeout(() => setStudentStatus('idle'), 1500);
        return;
      }
      setLoading(true);
      const res = await loginStudent(studentId, studentPass);
      setLoading(false);
      if (res.success) {
        setStudentStatus('success');
        setTimeout(() => {
          router.push('/student/dashboard');
        }, 450);
      } else {
        setStudentStatus('error');
        setStudentError(res.error || 'Invalid Student ID or Password. If you are new, click "Create Account".');
        setTimeout(() => setStudentStatus('idle'), 1500);
      }
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-emerald-200/30 via-teal-100/30 to-mint-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="w-full max-w-md mx-auto">
        {/* Top Header & Buddy Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex p-2.5 rounded-2xl bg-white/95 shadow-md border border-emerald-100 mb-3 animate-buddy-float">
            <Image
              src="/images/buddy-avatar.png"
              alt="KernelBuddy Mascot"
              width={56}
              height={56}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight">
            Welcome to KernelBuddy
          </h1>
          <p className="text-xs sm:text-sm text-emerald-800/80 mt-1 font-medium">
            Choose your portal to enter your interactive workspace
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div className="bg-emerald-100/60 p-1 rounded-2xl flex items-center mb-6 shadow-inner border border-emerald-200/60">
          <button
            type="button"
            onClick={() => setRoleTab('student')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              roleTab === 'student'
                ? 'bg-white text-emerald-950 shadow-sm border border-emerald-100'
                : 'text-emerald-800 hover:text-emerald-950'
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
                ? 'bg-white text-emerald-950 shadow-sm border border-emerald-100'
                : 'text-emerald-800 hover:text-emerald-950'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${roleTab === 'admin' ? 'text-teal-600' : ''}`} />
            <span>I am an Admin</span>
          </button>
        </div>

        {/* Card Container */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-100 p-6 sm:p-8 shadow-md">
          {roleTab === 'admin' ? (
            /* ADMIN LOGIN FORM */
            <div>
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-emerald-50">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Admin Authentication</h2>
                  <p className="text-xs text-slate-500">Access platform management and class analytics</p>
                </div>
              </div>

              {adminError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700 animate-shake-error">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{adminError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Admin User ID
                  </label>
                  <Input
                    type="text"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    placeholder="Enter Admin ID"
                    className="rounded-xl border-emerald-200/80 focus:border-emerald-500 focus:ring-emerald-500 text-sm h-11"
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
                      placeholder="Enter Admin Password"
                      className="rounded-xl border-emerald-200/80 focus:border-emerald-500 focus:ring-emerald-500 text-sm h-11 pr-10"
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
                  className={`w-full rounded-xl text-white font-bold text-sm h-11 shadow-sm transition-all duration-300 flex items-center justify-center gap-2 mt-2 ${
                    adminStatus === 'success'
                      ? 'bg-emerald-600 ring-4 ring-emerald-300 animate-pop-success'
                      : adminStatus === 'error'
                      ? 'bg-rose-600 ring-4 ring-rose-300 animate-shake-error'
                      : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700'
                  }`}
                >
                  {adminStatus === 'success' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Authenticated! Entering Dashboard...</span>
                    </>
                  ) : adminStatus === 'error' ? (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>Access Denied</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In as Admin</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          ) : (
            /* STUDENT LOGIN / SIGNUP FORM */
            <div>
              {/* Student Mode Switcher */}
              <div className="flex border-b border-emerald-100 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setStudentMode('login');
                    setStudentError('');
                  }}
                  className={`flex-1 pb-2.5 text-xs sm:text-sm font-bold transition-all border-b-2 ${
                    studentMode === 'login'
                      ? 'border-emerald-600 text-emerald-800'
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
                      ? 'border-emerald-600 text-emerald-800'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {studentError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700 animate-shake-error">
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
                      placeholder="Your Full Name (e.g. Khaled Hasan)"
                      className="rounded-xl border-emerald-200/80 focus:border-emerald-500 focus:ring-emerald-500 text-sm h-11"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Student ID
                  </label>
                  <Input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="202X14XXX (e.g. 202014019)"
                    className="rounded-xl border-emerald-200/80 focus:border-emerald-500 focus:ring-emerald-500 text-sm h-11 font-mono"
                    required
                  />
                  <p className="text-[11px] text-emerald-700/80 mt-1 font-medium">
                    Format: 202X14XXX (Year + Dept Code 14 + Roll 001-199)
                  </p>
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
                      placeholder={studentMode === 'signup' ? 'Choose a secure password' : 'Enter your password'}
                      className="rounded-xl border-emerald-200/80 focus:border-emerald-500 focus:ring-emerald-500 text-sm h-11 pr-10"
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
                  className={`w-full rounded-xl text-white font-bold text-sm h-11 shadow-sm transition-all duration-300 flex items-center justify-center gap-2 mt-2 ${
                    studentStatus === 'success'
                      ? 'bg-emerald-600 ring-4 ring-emerald-300 animate-pop-success'
                      : studentStatus === 'error'
                      ? 'bg-rose-600 ring-4 ring-rose-300 animate-shake-error'
                      : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700'
                  }`}
                >
                  {loading ? (
                    <span>Verifying...</span>
                  ) : studentStatus === 'success' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{studentMode === 'signup' ? 'Account Created! Entering...' : 'Welcome back! Opening Dashboard...'}</span>
                    </>
                  ) : studentStatus === 'error' ? (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>Check Credentials</span>
                    </>
                  ) : (
                    <>
                      <span>{studentMode === 'signup' ? 'Open Account & Enter' : 'Sign In as Student'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Notice */}
              <div className="mt-4 pt-3 border-t border-emerald-50 text-center">
                <p className="text-[11px] text-emerald-800/80">
                  ⚡ Accounts are stored securely. Anyone without an account can sign up instantly!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Back to Home Link */}
        <div className="text-center mt-4">
          <Link href="/" className="text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors">
            &larr; Back to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
