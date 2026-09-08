'use client';

import React from 'react';
import { 
  PagingState, 
  PagingStudentInput 
} from '@/lib/scenarios/paging';
import { ScenarioVisualizerProps } from '@/lib/scenarios/types';
import { Badge } from '@/components/ui/badge';
import { Cpu, Database, Server, CheckCircle2, XCircle, ArrowRight, HelpCircle } from 'lucide-react';

export default function PagingVisualizer({
  state,
  input,
  onChange,
  isReadOnly = false,
  showExplanation = false,
  evaluation,
}: ScenarioVisualizerProps<PagingState, PagingStudentInput>) {
  const currentInput: PagingStudentInput = input || {
    logicalAddressBinary: '',
    pageNumber: '',
    pageOffset: '',
    frameNumber: '',
    physicalAddressBinary: '',
    physicalAddressDecimal: '',
  };

  const handleFieldChange = (field: keyof PagingStudentInput, value: string) => {
    if (isReadOnly) return;
    onChange({
      ...currentInput,
      [field]: value,
    });
  };

  const getStepStatus = (stepKey: string) => {
    if (!evaluation) return null;
    return evaluation.stepResults.find(s => s.stepKey === stepKey);
  };

  // Expected computed values for explanation/preview
  const expectedPageNumber = Math.floor(state.logicalAddress / state.pageSize);
  const expectedOffset = state.logicalAddress % state.pageSize;
  const expectedFrameNumber = state.pageTable[expectedPageNumber];
  const expectedPhysicalAddress = expectedFrameNumber !== undefined
    ? (expectedFrameNumber * state.frameSize) + expectedOffset
    : 0;

  return (
    <div className="w-full space-y-6">
      {/* Simulation Scenario Header & Meta */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wide text-slate-100">
                Process {state.processName} Memory Request
              </h4>
              <p className="text-xs text-slate-400">
                CPU issues reference for Logical Byte Address: <span className="font-mono text-amber-400 font-bold text-sm">{state.logicalAddress}</span> (dec)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">Process Size: {state.processSize} B</Badge>
            <Badge variant="default">Page Size: {state.pageSize} B</Badge>
            <Badge variant="purple">Physical RAM: {state.physicalMemorySize} B</Badge>
            <Badge variant="default">Frame Size: {state.frameSize} B</Badge>
          </div>
        </div>

        {/* Dynamic Architectural Schematic */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-5 items-stretch">
          {/* Box 1: CPU Logical Address */}
          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-mono uppercase">1. Logical Address</span>
              <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                {state.logicalBits} bits
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-center">
              <div className="text-xs text-slate-500 mb-1 flex justify-between px-1">
                <span>Page ({state.pageBits}b)</span>
                <span>Offset ({state.offsetBits}b)</span>
              </div>
              <div className="flex items-center justify-center text-sm font-semibold tracking-widest text-blue-400">
                <span className="bg-blue-900/40 px-2 py-0.5 rounded border border-blue-700/50">
                  {showExplanation ? state.logicalAddress.toString(2).padStart(state.logicalBits, '0').slice(0, state.pageBits) : '?'}
                </span>
                <span className="text-slate-600 px-1">|</span>
                <span className="bg-amber-900/40 px-2 py-0.5 rounded border border-amber-700/50 text-amber-300">
                  {showExplanation ? state.logicalAddress.toString(2).padStart(state.logicalBits, '0').slice(state.pageBits) : '?'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Address {state.logicalAddress} = {state.logicalBits}-bit binary
            </p>
          </div>

          {/* Box 2: Page Table (MMU) */}
          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-mono uppercase flex items-center gap-1">
                <Database className="h-3 w-3 text-emerald-400" />
                2. Page Table
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">{state.numPages} Pages</span>
            </div>
            <div className="bg-slate-950 rounded border border-slate-800 overflow-hidden text-xs">
              <table className="w-full text-center">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px]">
                    <th className="py-1">Page</th>
                    <th className="py-1">Frame</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 font-mono">
                  {Object.entries(state.pageTable).map(([page, frame]) => {
                    const isTargetPage = showExplanation && Number(page) === expectedPageNumber;
                    return (
                      <tr 
                        key={page} 
                        className={isTargetPage ? 'bg-blue-600/30 text-blue-200 font-bold' : 'text-slate-300'}
                      >
                        <td className="py-1">{page}</td>
                        <td className="py-1 text-emerald-400">{frame}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Lookup maps Page $\rightarrow$ Frame
            </p>
          </div>

          {/* Box 3: Physical Address Generation */}
          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-mono uppercase">3. Physical Address</span>
              <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                {state.physicalBits} bits
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-center">
              <div className="text-xs text-slate-500 mb-1 flex justify-between px-1">
                <span>Frame ({state.frameBits}b)</span>
                <span>Offset ({state.offsetBits}b)</span>
              </div>
              <div className="flex items-center justify-center text-sm font-semibold tracking-widest text-emerald-400">
                <span className="bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-700/50">
                  {showExplanation ? expectedFrameNumber.toString(2).padStart(state.frameBits, '0') : '?'}
                </span>
                <span className="text-slate-600 px-1">|</span>
                <span className="bg-amber-900/40 px-2 py-0.5 rounded border border-amber-700/50 text-amber-300">
                  {showExplanation ? expectedOffset.toString(2).padStart(state.offsetBits, '0') : '?'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Physical = [Frame | Offset]
            </p>
          </div>

          {/* Box 4: Physical RAM Target */}
          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-mono uppercase flex items-center gap-1">
                <Server className="h-3 w-3 text-purple-400" />
                4. Physical RAM
              </span>
              <span className="text-[10px] text-purple-300 font-mono">{state.numFrames} Frames</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 mb-1">Target RAM Location</div>
              <div className="text-base font-bold font-mono text-amber-400">
                {showExplanation ? `Byte Address: ${expectedPhysicalAddress}` : 'Byte Address: ?'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {showExplanation ? `Frame ${expectedFrameNumber} + Offset ${expectedOffset}` : 'Pending translation'}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Physical address sent on memory bus
            </p>
          </div>
        </div>
      </div>

      {/* Student Interactive Translation Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Address Translation Workspace
            </h4>
            <p className="text-xs text-slate-500">
              Determine each component of the address translation for Logical Address <span className="font-bold text-blue-600">{state.logicalAddress}</span>.
            </p>
          </div>
          {evaluation && (
            <Badge variant={evaluation.isCorrect ? 'success' : 'danger'}>
              {evaluation.isCorrect ? 'Fully Correct (100%)' : `${evaluation.percentage}% Correct`}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Step 1: Logical Address Binary */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                1. Logical Address in Binary
              </label>
              {getStepStatus('logicalAddressBinary')?.isCorrect !== undefined && (
                getStepStatus('logicalAddressBinary')?.isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-600" />
                )
              )}
            </div>
            <input
              type="text"
              placeholder={`e.g. 11 or 0011 (${state.logicalBits} bits)`}
              disabled={isReadOnly}
              value={currentInput.logicalAddressBinary}
              onChange={(e) => handleFieldChange('logicalAddressBinary', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            {getStepStatus('logicalAddressBinary') && !getStepStatus('logicalAddressBinary')?.isCorrect && (
              <p className="text-[11px] text-rose-600 font-mono">
                Expected: {getStepStatus('logicalAddressBinary')?.expectedValue}
              </p>
            )}
          </div>

          {/* Step 2: Page Number */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                2. Page Number (p)
              </label>
              {getStepStatus('pageNumber')?.isCorrect !== undefined && (
                getStepStatus('pageNumber')?.isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-600" />
                )
              )}
            </div>
            <input
              type="number"
              placeholder="e.g. 1"
              disabled={isReadOnly}
              value={currentInput.pageNumber}
              onChange={(e) => handleFieldChange('pageNumber', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            {getStepStatus('pageNumber') && !getStepStatus('pageNumber')?.isCorrect && (
              <p className="text-[11px] text-rose-600 font-mono">
                Expected: {getStepStatus('pageNumber')?.expectedValue}
              </p>
            )}
          </div>

          {/* Step 3: Page Offset */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                3. Page Offset (d)
              </label>
              {getStepStatus('pageOffset')?.isCorrect !== undefined && (
                getStepStatus('pageOffset')?.isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-600" />
                )
              )}
            </div>
            <input
              type="number"
              placeholder="e.g. 1"
              disabled={isReadOnly}
              value={currentInput.pageOffset}
              onChange={(e) => handleFieldChange('pageOffset', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            {getStepStatus('pageOffset') && !getStepStatus('pageOffset')?.isCorrect && (
              <p className="text-[11px] text-rose-600 font-mono">
                Expected: {getStepStatus('pageOffset')?.expectedValue}
              </p>
            )}
          </div>

          {/* Step 4: Frame Number */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                4. Frame Number (f)
              </label>
              {getStepStatus('frameNumber')?.isCorrect !== undefined && (
                getStepStatus('frameNumber')?.isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-600" />
                )
              )}
            </div>
            <input
              type="number"
              placeholder="e.g. 4"
              disabled={isReadOnly}
              value={currentInput.frameNumber}
              onChange={(e) => handleFieldChange('frameNumber', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            {getStepStatus('frameNumber') && !getStepStatus('frameNumber')?.isCorrect && (
              <p className="text-[11px] text-rose-600 font-mono">
                Expected: {getStepStatus('frameNumber')?.expectedValue}
              </p>
            )}
          </div>

          {/* Step 5: Physical Address Binary */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                5. Physical Address in Binary
              </label>
              {getStepStatus('physicalAddressBinary')?.isCorrect !== undefined && (
                getStepStatus('physicalAddressBinary')?.isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-600" />
                )
              )}
            </div>
            <input
              type="text"
              placeholder={`e.g. 1001 (${state.physicalBits} bits)`}
              disabled={isReadOnly}
              value={currentInput.physicalAddressBinary}
              onChange={(e) => handleFieldChange('physicalAddressBinary', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            {getStepStatus('physicalAddressBinary') && !getStepStatus('physicalAddressBinary')?.isCorrect && (
              <p className="text-[11px] text-rose-600 font-mono">
                Expected: {getStepStatus('physicalAddressBinary')?.expectedValue}
              </p>
            )}
          </div>

          {/* Step 6: Physical Address Decimal */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                6. Physical Address in Decimal
              </label>
              {getStepStatus('physicalAddressDecimal')?.isCorrect !== undefined && (
                getStepStatus('physicalAddressDecimal')?.isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-600" />
                )
              )}
            </div>
            <input
              type="number"
              placeholder="e.g. 9"
              disabled={isReadOnly}
              value={currentInput.physicalAddressDecimal}
              onChange={(e) => handleFieldChange('physicalAddressDecimal', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            {getStepStatus('physicalAddressDecimal') && !getStepStatus('physicalAddressDecimal')?.isCorrect && (
              <p className="text-[11px] text-rose-600 font-mono">
                Expected: {getStepStatus('physicalAddressDecimal')?.expectedValue}
              </p>
            )}
          </div>
        </div>

        {/* Detailed Explanation if requested or evaluated */}
        {(showExplanation || evaluation?.overallExplanation) && (
          <div className="mt-5 p-4 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-slate-800 space-y-2">
            <div className="font-semibold text-blue-900 flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              Pedagogical Solution Breakdown:
            </div>
            <p className="leading-relaxed">
              Logical address <strong>{state.logicalAddress}</strong> in {state.logicalBits}-bit binary is <code>{state.logicalAddress.toString(2).padStart(state.logicalBits, '0')}</code>. 
              The higher {state.pageBits} bit(s) represent Page <strong>{expectedPageNumber}</strong>, and the lower {state.offsetBits} bit(s) represent Offset <strong>{expectedOffset}</strong>.
            </p>
            <p className="leading-relaxed">
              The Page Table maps Page {expectedPageNumber} $\rightarrow$ Frame <strong>{expectedFrameNumber}</strong> (binary <code>{expectedFrameNumber.toString(2).padStart(state.frameBits, '0')}</code>).
              Concatenating the Frame bits with the Offset bits yields <code>{expectedFrameNumber.toString(2).padStart(state.frameBits, '0')}{expectedOffset.toString(2).padStart(state.offsetBits, '0')}</code>, which converts to decimal <strong>{expectedPhysicalAddress}</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
