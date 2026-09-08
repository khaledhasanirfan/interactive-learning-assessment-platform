'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PagingVisualizer from '@/components/scenarios/PagingVisualizer';
import DiskVisualizer from '@/components/scenarios/DiskVisualizer';
import { 
  defaultPagingConfig, 
  generatePagingState, 
  evaluatePagingScenario,
  PagingStudentInput 
} from '@/lib/scenarios/paging';
import { 
  defaultDiskConfig, 
  generateDiskState, 
  evaluateDiskScenario,
  DiskStudentInput,
  DiskAlgorithm 
} from '@/lib/scenarios/disk';
import { RotateCw, CheckCircle2, Cpu, Disc, Sparkles, Clock } from 'lucide-react';

function PracticeLabContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('scenario') === 'disk' ? 'disk' : 'paging';
  const [activeTab, setActiveTab] = useState(initialTab);

  // 1. Paging State & Input
  const [pagingState, setPagingState] = useState(() => generatePagingState(defaultPagingConfig));
  const [pagingInput, setPagingInput] = useState<PagingStudentInput>({
    logicalAddressBinary: '',
    pageNumber: '',
    pageOffset: '',
    frameNumber: '',
    physicalAddressBinary: '',
    physicalAddressDecimal: '',
  });
  const [pagingEvaluation, setPagingEvaluation] = useState<any>(null);
  const [showPagingSolution, setShowPagingSolution] = useState(false);

  // 2. Disk State & Input
  const [diskState, setDiskState] = useState(() => generateDiskState(defaultDiskConfig));
  const [diskInput, setDiskInput] = useState<DiskStudentInput>({
    serviceOrder: [],
    totalHeadMovement: '',
    nextRequest: '',
  });
  const [diskEvaluation, setDiskEvaluation] = useState<any>(null);
  const [showDiskSolution, setShowDiskSolution] = useState(false);

  // Paging actions
  const handleRandomizePaging = () => {
    const randomAddr = Math.floor(Math.random() * defaultPagingConfig.processSize);
    const newState = generatePagingState({
      ...defaultPagingConfig,
      targetLogicalAddress: randomAddr,
    });
    setPagingState(newState);
    setPagingInput({
      logicalAddressBinary: '',
      pageNumber: '',
      pageOffset: '',
      frameNumber: '',
      physicalAddressBinary: '',
      physicalAddressDecimal: '',
    });
    setPagingEvaluation(null);
    setShowPagingSolution(false);
  };

  const handleEvaluatePaging = () => {
    const res = evaluatePagingScenario(pagingState, pagingInput);
    setPagingEvaluation(res);
  };

  // Disk actions
  const handleRandomizeDisk = (algo?: DiskAlgorithm) => {
    const sampleQueues = [
      [98, 183, 37, 122, 14, 124, 65, 67],
      [82, 170, 43, 140, 24, 16, 190],
      [55, 58, 39, 18, 90, 160, 150, 38, 184],
    ];
    const pickedQueue = sampleQueues[Math.floor(Math.random() * sampleQueues.length)]!;
    const randomHead = 50 + Math.floor(Math.random() * 50);

    const newState = generateDiskState({
      ...defaultDiskConfig,
      initialHead: randomHead,
      requestQueue: pickedQueue,
      algorithm: algo || diskState.algorithm,
    });
    setDiskState(newState);
    setDiskInput({
      serviceOrder: [],
      totalHeadMovement: '',
      nextRequest: '',
    });
    setDiskEvaluation(null);
    setShowDiskSolution(false);
  };

  const handleEvaluateDisk = () => {
    const res = evaluateDiskScenario(diskState, diskInput);
    setDiskEvaluation(res);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Lab Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" /> Formative Practice Sandbox
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Operating Systems Interactive Lab
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Experiment with memory translation and disk algorithms with immediate feedback and step solutions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'paging' ? (
            <Button variant="outline" onClick={handleRandomizePaging} className="gap-1.5">
              <RotateCw className="h-4 w-4" /> New Problem Address
            </Button>
          ) : (
            <Button variant="outline" onClick={() => handleRandomizeDisk()} className="gap-1.5">
              <RotateCw className="h-4 w-4" /> New Request Queue
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'paging', label: 'Paging Address Translation' },
          { id: 'disk', label: 'Disk Scheduling Algorithms' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* TAB 1: PAGING TRANSLATION */}
      {activeTab === 'paging' && (
        <div className="space-y-6">
          <PagingVisualizer
            state={pagingState}
            input={pagingInput}
            onChange={setPagingInput}
            showExplanation={showPagingSolution}
            evaluation={pagingEvaluation}
          />

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Try finding: Page #, Offset, Frame #, and Physical address in both binary and decimal.</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPagingSolution(!showPagingSolution)}
              >
                {showPagingSolution ? 'Hide Solution' : 'Reveal Complete Walkthrough'}
              </Button>
              <Button onClick={handleEvaluatePaging} className="gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Check My Answer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DISK SCHEDULING */}
      {activeTab === 'disk' && (
        <div className="space-y-6">
          <DiskVisualizer
            state={diskState}
            input={diskInput}
            onChange={setDiskInput}
            showExplanation={showDiskSolution}
            evaluation={diskEvaluation}
          />

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Target Algorithm:</span>
              {(['FCFS', 'SSTF', 'SCAN', 'C-SCAN'] as DiskAlgorithm[]).map((algo) => (
                <button
                  key={algo}
                  onClick={() => {
                    const newState = generateDiskState({
                      ...diskState,
                      algorithm: algo,
                    });
                    setDiskState(newState);
                    setDiskEvaluation(null);
                  }}
                  className={`px-2.5 py-1 text-xs rounded font-mono cursor-pointer transition-colors ${
                    diskState.algorithm === algo
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {algo}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDiskSolution(!showDiskSolution)}
              >
                {showDiskSolution ? 'Hide Trajectory' : 'Reveal Full Trajectory'}
              </Button>
              <Button onClick={handleEvaluateDisk} className="gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Check My Calculation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PracticeLabPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 text-slate-500">
          <div className="flex flex-col items-center gap-2">
            <Clock className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-sm">Loading Practice Lab...</span>
          </div>
        </div>
      }
    >
      <PracticeLabContent />
    </Suspense>
  );
}
