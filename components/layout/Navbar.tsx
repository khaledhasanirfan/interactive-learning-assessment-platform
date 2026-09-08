'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Sparkles, User, ShieldCheck } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isAdmin, isStudent, signOut } = useAuth();

  const isExamRunning = pathname?.includes('/attempt/');

  // In active assessment mode, render distraction-free header
  if (isExamRunning) {
    return (
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-sky-100 px-4 sm:px-8 py-3 shadow-xs">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 relative rounded-xl overflow-hidden shadow-xs ring-1 ring-sky-200">
              <Image src="/logo.svg" alt="KernelBuddy" width={36} height={36} className="object-contain" priority />
            </div>
            <div>
              <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider block">
                CSE-307: Operating Systems
              </span>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                Live Assessment Session
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Autosaving Answers
            </span>
          </div>
        </div>
      </header>
    );
  }

  const handleLogout = async () => {
    await signOut();
    router.push('/portal');
  };

  const isPortal = pathname === '/portal';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-xs">
      <div className="w-full px-4 sm:px-8 flex items-center justify-between h-16">
        {/* Brand & Logo (Stretched Left) */}
        <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-[1.01]">
          <div className="w-10 h-10 relative rounded-2xl p-1 bg-gradient-to-br from-sky-400 to-emerald-400 shadow-sm flex items-center justify-center">
            <Image 
              src="/logo.svg" 
              alt="KernelBuddy Logo" 
              width={34} 
              height={34} 
              className="object-contain drop-shadow-xs" 
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold bg-gradient-to-r from-sky-700 via-teal-700 to-emerald-600 bg-clip-text text-transparent">
                KernelBuddy
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-sky-50 text-sky-600 border border-sky-200/60 hidden sm:inline-block">
                OS EdTech
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 block leading-tight">
              Interactive OS Platform
            </span>
          </div>
        </Link>

        {/* Action Controls (Stretched Right) */}
        <div className="flex items-center gap-3">
          {profile && profile.id !== 'guest' ? (
            <>
              {isAdmin ? (
                <div className="flex items-center gap-2">
                  <Link href="/instructor/dashboard">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-full bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Admin Dashboard</span>
                    </Button>
                  </Link>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                    <span className="max-w-[110px] truncate">{profile.displayName}</span>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/student/dashboard">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">My Tasks</span>
                    </Button>
                  </Link>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="max-w-[120px] truncate">{profile.displayName}</span>
                  </span>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-50 p-2 text-xs"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="sr-only">Log Out</span>
              </Button>
            </>
          ) : (
            !isPortal && (
              <Link href="/portal">
                <Button className="rounded-full bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white font-medium text-xs sm:text-sm px-5 py-2 shadow-sm transition-all hover:shadow-md hover:scale-[1.02]">
                  <span>Sign In</span>
                  <Sparkles className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
