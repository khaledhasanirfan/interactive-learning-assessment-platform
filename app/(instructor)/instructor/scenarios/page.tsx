'use client';

import React, { useState } from 'react';
import { ScenarioRegistry } from '@/lib/scenarios/registry';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import PagingVisualizer from '@/components/scenarios/PagingVisualizer';
import DiskVisualizer from '@/components/scenarios/DiskVisualizer';
import { defaultPagingConfig, generatePagingState, PagingStudentInput } from '@/lib/scenarios/paging';
import { defaultDiskConfig, generateDiskState, DiskStudentInput } from '@/lib/scenarios/disk';
import { 
  Cpu, 
  Disc, 
  Code2, 
  PlusCircle, 
  BookOpen, 
  Settings2, 
  RotateCw,
  CheckCircle2
} from 'lucide-react';

export default function InstructorScenariosPage() {
  const [activeTab, setActiveTab] = useState<'paging' | 'disk' | 'architecture'>('paging');

  // Paging preview state
  const [pagingState, setPagingState] = useState(() => generatePagingState(defaultPagingConfig));
  const [pagingInput, setPagingInput] = useState<PagingStudentInput>({
    logicalAddressBinary: '',
    pageNumber: '',
    pageOffset: '',
    frameNumber: '',
    physicalAddressBinary: '',
    physicalAddressDecimal: '',
  });

  // Disk preview state
  const [diskState, setDiskState] = useState(() => generateDiskState(defaultDiskConfig));
  const [diskInput, setDiskInput] = useState<DiskStudentInput>({
    serviceOrder: [],
    totalHeadMovement: '',
    nextRequest: '',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Technical Simulation Engine
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Scenario Activity Architect
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pluggable hardware and system scenario registry with deterministic mathematical evaluators.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'paging', label: '1. Paging Address Translation' },
          { id: 'disk', label: '2. Disk Scheduling Simulator' },
          { id: 'architecture', label: 'Plugin Extension Architecture' },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {/* TAB 1: PAGING PREVIEW */}
      {activeTab === 'paging' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Module: Paging Address Translation</h3>
              <p className="text-xs text-slate-500">Visualizes MMU decomposition, Page Table lookup, and RAM byte synthesis.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const rand = Math.floor(Math.random() * defaultPagingConfig.processSize);
                setPagingState(generatePagingState({ ...defaultPagingConfig, targetLogicalAddress: rand }));
              }}
              className="gap-1.5"
            >
              <RotateCw className="h-3.5 w-3.5" /> Randomize Logical Address
            </Button>
          </div>

          <PagingVisualizer
            state={pagingState}
            input={pagingInput}
            onChange={setPagingInput}
            showExplanation={true}
          />
        </div>
      )}

      {/* TAB 2: DISK PREVIEW */}
      {activeTab === 'disk' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Module: Disk Head Scheduling</h3>
              <p className="text-xs text-slate-500">Horizontal cylinder track simulation across FCFS, SSTF, SCAN, and C-SCAN.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const sampleQueue = [82, 170, 43, 140, 24, 16, 190];
                setDiskState(generateDiskState({ ...defaultDiskConfig, requestQueue: sampleQueue, initialHead: 50 }));
              }}
              className="gap-1.5"
            >
              <RotateCw className="h-3.5 w-3.5" /> Load Alternative Track Queue
            </Button>
          </div>

          <DiskVisualizer
            state={diskState}
            input={diskInput}
            onChange={setDiskInput}
            showExplanation={true}
          />
        </div>
      )}

      {/* TAB 3: EXTENSION ARCHITECTURE GUIDE */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-blue-600" />
                <CardTitle>How to Add New Scenario Modules</CardTitle>
              </div>
              <CardDescription>
                The platform uses an open plugin contract (<code className="font-mono">IScenarioPlugin</code>). You can add new Computer Science scenario modules without modifying core assessment infrastructure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-slate-700">
              <p className="leading-relaxed">
                Every scenario module implements 5 core requirements in <code className="font-mono">lib/scenarios/&lt;module&gt;/</code>:
              </p>

              <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
                <li>
                  <strong>Configuration (<code className="font-mono">TConfig</code>):</strong> The instructor-configurable parameters (e.g. process size, cylinder range, quantum size).
                </li>
                <li>
                  <strong>State Generator (<code className="font-mono">generateState(config, seed)</code>):</strong> A pure function generating the randomized or fixed problem instance.
                </li>
                <li>
                  <strong>Pure Evaluator (<code className="font-mono">evaluate(state, input, config)</code>):</strong> Deterministic grading logic returning score, percentage, and step-by-step correctness flags.
                </li>
                <li>
                  <strong>Explainer (<code className="font-mono">explain(state, config)</code>):</strong> Pedagogical breakdown text displayed during post-assessment review.
                </li>
                <li>
                  <strong>Visualizer Component:</strong> Accessible React component rendering the graphical schematic and capturing student inputs.
                </li>
              </ol>

              <div className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto">
                <pre>{`// Registering a new scenario in lib/scenarios/registry.ts:
ScenarioRegistry.register({
  type: 'cpu-scheduling',
  name: 'Round Robin & Priority Scheduling',
  category: 'Process Management',
  defaultConfig: defaultCpuConfig,
  generateState: generateCpuState,
  evaluate: evaluateCpuScenario,
  explain: explainCpuScenario,
  Visualizer: DynamicCpuVisualizer,
});`}</pre>
              </div>

              <div className="pt-2">
                <h4 className="font-bold text-slate-900 mb-2">Planned Future Scenario Plugins:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {['CPU Scheduling (Round Robin)', 'Page Replacement (LRU / FIFO)', 'Memory Allocation (Best/Worst Fit)', 'Banker\'s Deadlock Avoidance'].map((name) => (
                    <div key={name} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="font-semibold text-slate-800 block">{name}</span>
                      <span className="text-[10px] text-slate-500 mt-1 block">Architecture compatible</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
