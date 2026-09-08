'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, DEMO_PERSONAS } from '@/lib/firebase/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { GraduationCap, Sparkles, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle, switchDemoPersona } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      router.push('/student/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (personaKey: keyof typeof DEMO_PERSONAS) => {
    switchDemoPersona(personaKey);
    if (personaKey === 'instructor' || personaKey === 'admin') {
      router.push('/instructor/dashboard');
    } else {
      router.push('/student/dashboard');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-600 text-white rounded-2xl shadow-md">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign In to Platform
          </h1>
          <p className="text-xs text-slate-500">
            Interactive Learning &amp; Assessment for Undergraduate Computer Science
          </p>
        </div>

        {/* Form Card */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Account Authentication</CardTitle>
            <CardDescription>
              Sign in with institutional credentials or choose a pre-configured demo persona.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                label="Email Address"
                type="email"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button type="submit" className="w-full justify-center mt-2" isLoading={isLoading}>
                <LogIn className="h-4 w-4 mr-2" /> Sign In with Email
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2 text-slate-400 font-semibold">Or Instant Demo Access</span>
              </div>
            </div>

            {/* Quick Demo Logins */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoLogin('instructor')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-left transition-colors cursor-pointer"
              >
                <span className="font-bold text-slate-900 block">Prof. Turing</span>
                <span className="text-[10px] text-blue-600 font-medium">Instructor Studio</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('student1')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-left transition-colors cursor-pointer"
              >
                <span className="font-bold text-slate-900 block">Ada Lovelace</span>
                <span className="text-[10px] text-emerald-600 font-medium">Student Portal</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('student2')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-left transition-colors cursor-pointer"
              >
                <span className="font-bold text-slate-900 block">Linus Torvalds</span>
                <span className="text-[10px] text-emerald-600 font-medium">Student Portal</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-left transition-colors cursor-pointer"
              >
                <span className="font-bold text-slate-900 block">Dennis Ritchie</span>
                <span className="text-[10px] text-purple-600 font-medium">System Admin</span>
              </button>
            </div>
          </CardContent>
          <CardFooter className="justify-center text-xs text-slate-500">
            <span>Demo environment active &bull; No credit card required</span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
