import { describe, it, expect } from 'vitest';
import {
  defaultDiskConfig,
  generateDiskState,
  evaluateDiskScenario,
  solveFCFS,
  solveSSTF,
  solveSCAN,
  solveCSCAN,
} from '@/lib/scenarios/disk';

describe('Disk Scheduling Algorithms', () => {
  const queue = [98, 183, 37, 122, 14, 124, 65, 67];
  const head = 53;

  it('FCFS matches textbook standard (640 total head movements)', () => {
    const result = solveFCFS(head, queue);
    expect(result.sequence).toEqual([53, 98, 183, 37, 122, 14, 124, 65, 67]);
    expect(result.totalHeadMovement).toBe(640);
  });

  it('SSTF correctly chooses greedy shortest seek (236 total head movements)', () => {
    const result = solveSSTF(head, queue);
    expect(result.visitedOrderOnly).toEqual([65, 67, 37, 14, 98, 122, 124, 183]);
    expect(result.totalHeadMovement).toBe(236);
  });

  it('SCAN sweeps up to cylinder 199, then reverses down (208 or 236 depending on boundary)', () => {
    const result = solveSCAN(head, queue, [0, 199], 'UP');
    expect(result.sequence).toContain(199);
    // Upper sweep: 53 -> 65 -> 67 -> 98 -> 122 -> 124 -> 183 -> 199 (diff: 146)
    // Reverse: 199 -> 37 -> 14 (diff: 199 - 14 = 185)
    // Total = (199 - 53) + (199 - 14) = 146 + 185 = 331 cylinders
    expect(result.totalHeadMovement).toBe(331);
  });

  it('evaluateDiskScenario validates correct student inputs', () => {
    const state = generateDiskState(defaultDiskConfig); // FCFS
    const studentInput = {
      serviceOrder: [98, 183, 37, 122, 14, 124, 65, 67],
      totalHeadMovement: 640,
      nextRequest: 98,
    };

    const evalResult = evaluateDiskScenario(state, studentInput);
    expect(evalResult.isCorrect).toBe(true);
    expect(evalResult.score).toBe(1);
  });
});
