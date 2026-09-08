'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Cpu, HardDrive, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-hidden w-full">
      {/* Soft Ambient Mint & Teal Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-emerald-200/40 via-teal-100/30 to-mint-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-4xl w-full mx-auto flex flex-col items-center text-center">
        {/* Cool Emoji Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 border border-emerald-200 shadow-sm backdrop-blur-md mb-6 animate-buddy-float">
          <span className="text-base">✨</span>
          <span className="text-xs sm:text-sm font-bold text-emerald-900 tracking-wide">
            ⚡ Interactive OS Mastery with KernelBuddy
          </span>
          <span className="text-base">🚀</span>
        </div>

        {/* Mascot Buddy Avatar (3D Centerpiece) */}
        <div className="relative mb-6 group cursor-pointer">
          <div className="absolute -inset-3 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-3xl blur-lg opacity-40 group-hover:opacity-75 transition duration-500 animate-pulse" />
          <div className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-3xl overflow-hidden shadow-xl border-2 border-emerald-200 bg-gradient-to-b from-emerald-100/70 to-teal-100/70 flex items-center justify-center p-3 transform group-hover:scale-[1.04] group-hover:rotate-1 transition-all duration-300">
            <Image
              src="/images/buddy-avatar.png"
              alt="KernelBuddy OS 3D Mascot"
              width={240}
              height={240}
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>
          {/* Floating Buddy Badge */}
          <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 bg-white px-4 py-1.5 rounded-full shadow-md border border-emerald-100 flex items-center gap-2 text-xs font-extrabold text-emerald-950">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Hi, I&apos;m KernelBuddy! 🤖</span>
          </div>
        </div>

        {/* Clean Modern Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-emerald-950 mb-4 leading-tight">
          Master Operating Systems,{' '}
          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
            One Click at a Time
          </span>
        </h1>

        <p className="text-sm sm:text-base text-emerald-900/80 max-w-2xl mb-8 leading-relaxed font-medium">
          Say goodbye to dry textbooks. Experience Virtual Memory Paging, CPU Address Translation, and Disk Arm Scheduling with real-time interactive simulations and smart evaluated feedback.
        </p>

        {/* Main "Continue" CTA Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link href="/portal" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-base px-9 py-6 shadow-md hover:shadow-xl transition-all hover:scale-[1.03] flex items-center justify-center gap-2 group"
            >
              <span>Continue to Platform</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Clean Highlight Pills (Uncongested, Minimalist Mint) */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-12 w-full max-w-xl">
          <div className="bg-white/90 backdrop-blur-md border border-emerald-100/90 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col items-center">
            <span className="text-2xl mb-1">🧩</span>
            <span className="text-xs font-bold text-emerald-950">Paging MMU</span>
            <span className="text-[11px] text-emerald-700/80 hidden sm:inline">Bit Translation</span>
          </div>
          <div className="bg-white/90 backdrop-blur-md border border-emerald-100/90 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col items-center">
            <span className="text-2xl mb-1">💿</span>
            <span className="text-xs font-bold text-emerald-950">Disk Arm</span>
            <span className="text-[11px] text-emerald-700/80 hidden sm:inline">Head Trajectories</span>
          </div>
          <div className="bg-white/90 backdrop-blur-md border border-emerald-100/90 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col items-center">
            <span className="text-2xl mb-1">🎯</span>
            <span className="text-xs font-bold text-emerald-950">Smart Grading</span>
            <span className="text-[11px] text-emerald-700/80 hidden sm:inline">Detailed Explanations</span>
          </div>
        </div>
      </div>
    </div>
  );
}
