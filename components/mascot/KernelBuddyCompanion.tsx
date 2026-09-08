'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Sparkles, MessageSquare, X, Heart } from 'lucide-react';

const OS_TIPS = [
  'KernelBuddy is active! Master OS interactively 🧠✨',
  'Virtual Memory: Page Table translates Logical page to Physical frame! 💾',
  'A Page Fault triggers a trap vector to the OS kernel! ⚡',
  'Context Switch: Current CPU registers saved directly to PCB ⚙️',
  'Disk Scheduling: SCAN algorithm avoids the elevator starvation problem! 🚀',
  'Ready for your live class task? You got this! 🎯',
  'Semaphore vs Mutex: Mutex is locking, Semaphore is signaling! 🔒',
];

export function KernelBuddyCompanion() {
  const [tipIndex, setTipIndex] = useState(0);
  const [isBubbleVisible, setIsBubbleVisible] = useState(true);
  const [isBouncing, setIsBouncing] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [heartBurst, setHeartBurst] = useState(false);

  // Rotate tips every 12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % OS_TIPS.length);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleBuddyClick = () => {
    setIsBouncing(true);
    setHeartBurst(true);
    setClickCount((prev) => prev + 1);
    setTipIndex((prev) => (prev + 1) % OS_TIPS.length);
    setIsBubbleVisible(true);

    setTimeout(() => setIsBouncing(false), 600);
    setTimeout(() => setHeartBurst(false), 1200);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end pointer-events-none select-none">
      {/* Speech Bubble */}
      {isBubbleVisible && (
        <div 
          className="pointer-events-auto mb-2 max-w-[240px] sm:max-w-[280px] bg-white/95 backdrop-blur-md text-emerald-950 p-3 rounded-2xl border border-emerald-200/80 shadow-lg text-xs leading-relaxed relative animate-pop-success transform-gpu transition-all"
        >
          <div className="flex items-center justify-between gap-1 mb-1 border-b border-emerald-50 pb-1">
            <span className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-emerald-500 animate-spin" />
              KernelBuddy AI
            </span>
            <button
              onClick={() => setIsBubbleVisible(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
              title="Close speech bubble"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="font-medium text-slate-700">
            {OS_TIPS[tipIndex]}
          </p>

          {/* Speech bubble arrow pointer */}
          <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white/95 border-b border-r border-emerald-200/80 transform rotate-45" />
        </div>
      )}

      {/* Floating 3D Mascot Character */}
      <div 
        onClick={handleBuddyClick}
        className={`pointer-events-auto cursor-pointer group relative transition-transform duration-300 ${
          isBouncing ? 'scale-115 rotate-6' : 'animate-buddy-float hover:scale-105'
        }`}
        title="Click KernelBuddy to interact!"
      >
        {/* Soft Ambient Mint Glow */}
        <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400/30 to-teal-400/30 rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity" />

        {/* Mascot Container */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-100/90 to-teal-100/90 border-2 border-emerald-300 p-1.5 shadow-xl flex items-center justify-center overflow-hidden">
          <Image
            src="/images/buddy-avatar.png"
            alt="KernelBuddy Interactive 3D Mascot"
            width={72}
            height={72}
            className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-110 transition-transform"
            priority
          />

          {/* Heart burst on click */}
          {heartBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping">
              <Heart className="w-8 h-8 text-emerald-500 fill-emerald-500" />
            </div>
          )}
        </div>

        {/* Interactive Badge */}
        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-md border border-white flex items-center gap-0.5">
          <span>⚡</span>
          <span>{clickCount > 0 ? `x${clickCount}` : 'OS'}</span>
        </div>
      </div>
    </div>
  );
}
