'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={twMerge(clsx('flex border-b border-slate-200 gap-6', className))}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={twMerge(
              clsx(
                'flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer',
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              )
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={twMerge(
                  clsx(
                    'px-2 py-0.5 text-xs rounded-full',
                    isActive ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                  )
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface ProgressProps {
  value: number; // 0 to 100
  max?: number;
  className?: string;
  showLabel?: boolean;
}

export function Progress({ value, max = 100, className, showLabel = false }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div className={twMerge(clsx('w-full flex flex-col gap-1', className))}>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-500 font-medium">
          <span>Progress</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
