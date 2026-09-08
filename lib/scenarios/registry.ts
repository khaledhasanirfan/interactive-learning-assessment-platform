import { IScenarioPlugin } from './types';
import { 
  defaultPagingConfig, 
  generatePagingState, 
  evaluatePagingScenario, 
  explainPagingScenario,
  PagingConfig,
  PagingState,
  PagingStudentInput
} from './paging';
import {
  defaultDiskConfig,
  generateDiskState,
  evaluateDiskScenario,
  explainDiskScenario,
  DiskConfig,
  DiskState,
  DiskStudentInput
} from './disk';
import PagingVisualizer from '@/components/scenarios/PagingVisualizer';
import DiskVisualizer from '@/components/scenarios/DiskVisualizer';

export const PagingScenarioPlugin: IScenarioPlugin<PagingConfig, PagingState, PagingStudentInput> = {
  type: 'paging-translation',
  name: 'Paging Address Translation',
  description: 'Translate logical byte addresses into binary, page/offset, and physical RAM frame addresses.',
  category: 'Memory Management',
  defaultConfig: defaultPagingConfig,
  generateState: generatePagingState,
  evaluate: evaluatePagingScenario,
  explain: explainPagingScenario,
  Visualizer: PagingVisualizer as any,
};

export const DiskScenarioPlugin: IScenarioPlugin<DiskConfig, DiskState, DiskStudentInput> = {
  type: 'disk-scheduling',
  name: 'Disk Scheduling Algorithms',
  description: 'Simulate and calculate cylinder head movements across FCFS, SSTF, SCAN, and C-SCAN.',
  category: 'Storage & I/O',
  defaultConfig: defaultDiskConfig,
  generateState: generateDiskState,
  evaluate: evaluateDiskScenario,
  explain: explainDiskScenario,
  Visualizer: DiskVisualizer as any,
};

class ScenarioRegistryClass {
  private plugins: Map<string, IScenarioPlugin> = new Map();

  constructor() {
    this.register(PagingScenarioPlugin);
    this.register(DiskScenarioPlugin);
  }

  public register(plugin: IScenarioPlugin) {
    this.plugins.set(plugin.type, plugin);
  }

  public get(type: string): IScenarioPlugin | undefined {
    return this.plugins.get(type);
  }

  public getAll(): IScenarioPlugin[] {
    return Array.from(this.plugins.values());
  }

  public listTypes(): string[] {
    return Array.from(this.plugins.keys());
  }
}

export const ScenarioRegistry = new ScenarioRegistryClass();
