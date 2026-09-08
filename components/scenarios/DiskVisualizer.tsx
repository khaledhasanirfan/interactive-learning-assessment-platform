'use client';

import React, { useState } from 'react';
import { 
  DiskState, 
  DiskStudentInput, 
  DiskAlgorithm 
} from '@/lib/scenarios/disk';
import { ScenarioVisualizerProps } from '@/lib/scenarios/types';
import { Badge } from '@/components/ui/badge';
import { Disc, ArrowRight, CheckCircle2, XCircle, BarChart3, HelpCircle } from 'lucide-react';

export default function DiskVisualizer({
  state,
  input,
  onChange,
  isReadOnly = false,
  showExplanation = false,
  evaluation,
}: ScenarioVisualizerProps<DiskState, DiskStudentInput>) {
  const currentInput: DiskStudentInput = input || {
    serviceOrder: [],
    totalHeadMovement: '',
    nextRequest: '',
  };

  const [selectedAlgoTab, setSelectedAlgoTab] = useState<DiskAlgorithm>(state.algorithm);

  const activeSolution = state.solutions[selectedAlgoTab];
  const [minCyl, maxCyl] = state.cylinderRange;
  const cylinderSpan = maxCyl - minCyl;

  const handleTotalMovementChange = (val: string) => {
    if (isReadOnly) return;
    onChange({
      ...currentInput,
      totalHeadMovement: val,
    });
  };

  const handleNextRequestChange = (val: string) => {
    if (isReadOnly) return;
    onChange({
      ...currentInput,
      nextRequest: val,
    });
  };

  const handleServiceOrderTextChange = (val: string) => {
    if (isReadOnly) return;
    const nums = val
      .split(/[\s,]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !isNaN(Number(s)))
      .map(Number);
    onChange({
      ...currentInput,
      serviceOrder: nums,
    });
  };

  // Convert cylinder coordinate into percentage along horizontal track
  const getPercent = (cyl: number) => {
    return Math.max(0, Math.min(100, ((cyl - minCyl) / cylinderSpan) * 100));
  };

  return (
    <div className="w-full space-y-6">
      {/* Simulation Header */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Disc className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wide text-slate-100">
                Magnetic Disk Head Scheduling Simulation
              </h4>
              <p className="text-xs text-slate-400">
                Initial Head Position: <span className="font-mono text-amber-400 font-bold">{state.initialHead}</span> | 
                Cylinder Range: <span className="font-mono text-slate-300">[{minCyl} — {maxCyl}]</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="purple">Active Target: {state.algorithm}</Badge>
            <Badge variant="default">Queue: {state.requestQueue.length} requests</Badge>
          </div>
        </div>

        {/* Algorithm Comparison Tabs */}
        <div className="flex items-center gap-2 pt-4 border-b border-slate-800 pb-3">
          <span className="text-xs text-slate-400 mr-2 font-medium">Trajectory View:</span>
          {(['FCFS', 'SSTF', 'SCAN', 'C-SCAN'] as DiskAlgorithm[]).map((algo) => {
            const isSelected = selectedAlgoTab === algo;
            const isCurrentTarget = state.algorithm === algo;
            return (
              <button
                key={algo}
                onClick={() => setSelectedAlgoTab(algo)}
                className={`px-3 py-1 text-xs rounded-md font-mono transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {algo} {isCurrentTarget && '(Target)'}
              </button>
            );
          })}
        </div>

        {/* Request Queue Pills */}
        <div className="pt-4 pb-2">
          <div className="text-xs text-slate-400 mb-2 font-medium">Pending Request Queue:</div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              Head: {state.initialHead}
            </span>
            <ArrowRight className="h-3 w-3 text-slate-600" />
            {state.requestQueue.map((cyl, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700"
              >
                {cyl}
              </span>
            ))}
          </div>
        </div>

        {/* Horizontal Cylinder Track Schematic */}
        <div className="mt-6 bg-slate-950 p-5 rounded-lg border border-slate-800">
          <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-2">
            <span>Cylinder {minCyl} (Innermost)</span>
            <span>Horizontal Cylinder Surface</span>
            <span>Cylinder {maxCyl} (Outermost)</span>
          </div>

          {/* Track Bar */}
          <div className="relative h-14 bg-slate-900 rounded-lg border border-slate-800 overflow-hidden flex items-center">
            {/* Guide Grid lines */}
            {[0, 25, 50, 75, 100].map((pct) => (
              <div
                key={pct}
                className="absolute top-0 bottom-0 border-r border-slate-800/80"
                style={{ left: `${pct}%` }}
              />
            ))}

            {/* Request Points along Track */}
            {state.requestQueue.map((cyl, idx) => {
              const leftPct = getPercent(cyl);
              return (
                <div
                  key={idx}
                  className="absolute -top-1 flex flex-col items-center group z-10"
                  style={{ left: `${leftPct}%`, transform: 'translateX(-50%)' }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400 border border-slate-950 ring-2 ring-blue-900/50" />
                  <span className="text-[10px] font-mono text-slate-400 mt-1">{cyl}</span>
                </div>
              );
            })}

            {/* Initial Head Marker */}
            <div
              className="absolute -top-2 flex flex-col items-center z-20"
              style={{ left: `${getPercent(state.initialHead)}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-950 ring-2 ring-amber-500/80 shadow-md" />
              <span className="text-[10px] font-mono text-amber-300 font-bold mt-1">
                Head ({state.initialHead})
              </span>
            </div>
          </div>

          {/* Serviced Sequence Flow */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono">
            <span className="text-slate-400">
              Trajectory for <strong className="text-blue-400">{selectedAlgoTab}</strong>:
            </span>
            <span className="text-slate-300 tracking-wide">
              {activeSolution.sequence.join(' → ')}
            </span>
          </div>
        </div>

        {/* Algorithm Comparative Metrics */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
          {(['FCFS', 'SSTF', 'SCAN', 'C-SCAN'] as DiskAlgorithm[]).map((algo) => {
            const isCurrent = algo === state.algorithm;
            const sol = state.solutions[algo];
            return (
              <div
                key={algo}
                className={`p-2.5 rounded-lg border ${
                  isCurrent
                    ? 'bg-blue-950/60 border-blue-600/60 text-blue-200'
                    : 'bg-slate-800/50 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-[11px] uppercase tracking-wider">{algo}</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {showExplanation || isCurrent ? `${sol.totalHeadMovement} cyl` : '?? cyl'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Student Input Workspace */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Disk Scheduling Evaluation ({state.algorithm})
            </h4>
            <p className="text-xs text-slate-500">
              Calculate the head movements and determine service order for algorithm <strong className="text-blue-600">{state.algorithm}</strong>.
            </p>
          </div>
          {evaluation && (
            <Badge variant={evaluation.isCorrect ? 'success' : 'danger'}>
              {evaluation.isCorrect ? 'Fully Correct (100%)' : `${evaluation.percentage}% Correct`}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Step 1: Immediate Next Request */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                1. First Request Serviced (After Head {state.initialHead})
              </label>
              {evaluation?.stepResults.find(s => s.stepKey === 'nextRequest') && (
                evaluation.stepResults.find(s => s.stepKey === 'nextRequest')?.isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-600" />
                )
              )}
            </div>
            <input
              type="number"
              placeholder="e.g. 98 or 65"
              disabled={isReadOnly}
              value={currentInput.nextRequest || ''}
              onChange={(e) => handleNextRequestChange(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* Step 2: Total Head Movement */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                2. Total Head Movement (Total Cylinders Traversed)
              </label>
              {evaluation?.stepResults.find(s => s.stepKey === 'totalHeadMovement') && (
                evaluation.stepResults.find(s => s.stepKey === 'totalHeadMovement')?.isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-600" />
                )
              )}
            </div>
            <input
              type="number"
              placeholder="e.g. 640 or 236"
              disabled={isReadOnly}
              value={currentInput.totalHeadMovement || ''}
              onChange={(e) => handleTotalMovementChange(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            {evaluation?.stepResults.find(s => s.stepKey === 'totalHeadMovement') && !evaluation.stepResults.find(s => s.stepKey === 'totalHeadMovement')?.isCorrect && (
              <p className="text-[11px] text-rose-600 font-mono">
                Expected: {evaluation.stepResults.find(s => s.stepKey === 'totalHeadMovement')?.expectedValue} cylinders
              </p>
            )}
          </div>

          {/* Step 3: Full Servicing Sequence */}
          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                3. Complete Service Order Sequence (comma or space separated)
              </label>
              {evaluation?.stepResults.find(s => s.stepKey === 'serviceOrder') && (
                evaluation.stepResults.find(s => s.stepKey === 'serviceOrder')?.isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-600" />
                )
              )}
            </div>
            <input
              type="text"
              placeholder="e.g. 98, 183, 37, 122, 14, 124, 65, 67"
              disabled={isReadOnly}
              value={currentInput.serviceOrder.join(', ')}
              onChange={(e) => handleServiceOrderTextChange(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            {evaluation?.stepResults.find(s => s.stepKey === 'serviceOrder') && !evaluation.stepResults.find(s => s.stepKey === 'serviceOrder')?.isCorrect && (
              <p className="text-[11px] text-rose-600 font-mono">
                Expected order: [{evaluation.stepResults.find(s => s.stepKey === 'serviceOrder')?.expectedValue}]
              </p>
            )}
          </div>
        </div>

        {/* Pedagogical Explanation */}
        {(showExplanation || evaluation?.overallExplanation) && (
          <div className="mt-5 p-4 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-slate-800 space-y-2">
            <div className="font-semibold text-blue-900 flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              Scheduling Analysis & Head Movement Formula:
            </div>
            <p className="leading-relaxed">
              Under <strong>{state.algorithm}</strong> scheduling starting at track {state.initialHead}, the service path is:
            </p>
            <div className="font-mono p-2 bg-white rounded border border-blue-200 text-blue-900">
              {state.solutions[state.algorithm].sequence.join(' → ')}
            </div>
            <p className="leading-relaxed">
              Total cylinder movement = {state.solutions[state.algorithm].headMovements.join(' + ')} = <strong>{state.solutions[state.algorithm].totalHeadMovement} cylinders</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
