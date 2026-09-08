'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Cpu, HardDrive, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-hidden">
      {/* Soft Ambient Pastel Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-sky-200/40 via-teal-100/30 to-emerald-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-3xl w-full mx-auto flex flex-col items-center text-center">
        {/* Cool Emoji Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-sky-200/80 shadow-xs backdrop-blur-xs mb-6 animate-bounce duration-1000">
          <span className="text-base">🚀</span>
          <span className="text-xs sm:text-sm font-semibold text-sky-800">
            Learn Operating Systems Interactively
          </span>
          <span className="text-base">✨</span>
        </div>

        {/* Mascot Buddy Avatar (Single Focused Centerpiece) */}
        <div className="relative mb-6 group">
          <div className="absolute -inset-2 bg-gradient-to-r from-sky-400 to-emerald-400 rounded-3xl blur-md opacity-40 group-hover:opacity-60 transition duration-500" />
          <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-3xl overflow-hidden shadow-lg border-2 border-white/80 bg-gradient-to-b from-sky-100/60 to-emerald-100/60 flex items-center justify-center p-2 transform group-hover:scale-[1.03] transition-transform duration-300">
            <Image
              src="/images/buddy-avatar.png"
              alt="KernelBuddy OS Mascot"
              width={220}
              height={220}
              className="object-contain drop-shadow-md"
              priority
            />
          </div>
          {/* Floating Buddy Chip Badge */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-3.5 py-1 rounded-full shadow-md border border-sky-100 flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Hi, I&apos;m KernelBuddy! 🤖</span>
          </div>
        </div>

        {/* Clean Headline & Copy */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4 leading-tight">
          Master OS Concepts,{' '}
          <span className="bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
            One Click at a Time
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-xl mb-8 leading-relaxed">
          Say goodbye to boring dry theory. Explore Virtual Memory Paging, CPU Address Translation, and Disk Arm Scheduling with live interactive visualizers and guided quizzes.
        </p>

        {/* Main "Continue" CTA Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link href="/portal" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto rounded-full bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white font-semibold text-base px-8 py-6 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group"
            >
              <span>Continue to Platform</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Clean Highlight Pills (Uncongested, Minimalist) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-12 w-full max-w-lg">
          <div className="bg-white/80 backdrop-blur-xs border border-sky-100/80 rounded-2xl p-3 shadow-xs flex flex-col items-center">
            <span className="text-xl mb-1">🧩</span>
            <span className="text-xs font-semibold text-slate-800">Paging MMU</span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">Bit Translation</span>
          </div>
          <div className="bg-white/80 backdrop-blur-xs border border-sky-100/80 rounded-2xl p-3 shadow-xs flex flex-col items-center">
            <span className="text-xl mb-1">💿</span>
            <span className="text-xs font-semibold text-slate-800">Disk Arm</span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">Seek Trajectories</span>
          </div>
          <div className="bg-white/80 backdrop-blur-xs border border-sky-100/80 rounded-2xl p-3 shadow-xs flex flex-col items-center">
            <span className="text-xl mb-1">🎯</span>
            <span className="text-xs font-semibold text-slate-800">Smart Tasks</span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">Instant Grading</span>
          </div>
        </div>
      </div>
    </div>
  );
}
