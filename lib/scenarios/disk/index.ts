import { ScenarioEvaluationResult } from '../types';

export type DiskAlgorithm = 'FCFS' | 'SSTF' | 'SCAN' | 'C-SCAN';

export interface DiskConfig {
  cylinderRange: [number, number]; // e.g. [0, 199]
  initialHead: number;              // e.g. 53
  requestQueue: number[];           // e.g. [98, 183, 37, 122, 14, 124, 65, 67]
  algorithm: DiskAlgorithm;        // e.g. 'FCFS'
  direction?: 'UP' | 'DOWN';        // default 'UP' (towards higher tracks) for SCAN/C-SCAN
}

export interface DiskState {
  cylinderRange: [number, number];
  initialHead: number;
  requestQueue: number[];
  algorithm: DiskAlgorithm;
  direction: 'UP' | 'DOWN';
  
  // Computed golden solutions for all algorithms to allow rich student comparisons
  solutions: Record<DiskAlgorithm, DiskAlgorithmResult>;
}

export interface DiskAlgorithmResult {
  sequence: number[];              // Servicing order of tracks (including boundaries visited)
  headMovements: number[];         // Step-by-step absolute movements: |curr - next|
  totalHeadMovement: number;       // Sum of movements
  visitedOrderOnly: number[];      // Requests from queue in served order (excluding boundaries)
}

export interface DiskStudentInput {
  serviceOrder: number[];          // e.g. [98, 183, 37, ...]
  totalHeadMovement: number | string; // e.g. 640
  nextRequest?: number | string;   // Immediate next request after initial head
}

export const defaultDiskConfig: DiskConfig = {
  cylinderRange: [0, 199],
  initialHead: 53,
  requestQueue: [98, 183, 37, 122, 14, 124, 65, 67],
  algorithm: 'FCFS',
  direction: 'UP',
};

// 1. FCFS Solver
export function solveFCFS(initialHead: number, queue: number[]): DiskAlgorithmResult {
  const sequence: number[] = [initialHead, ...queue];
  const headMovements: number[] = [];
  let total = 0;

  for (let i = 0; i < sequence.length - 1; i++) {
    const diff = Math.abs(sequence[i + 1] - sequence[i]);
    headMovements.push(diff);
    total += diff;
  }

  return {
    sequence,
    headMovements,
    totalHeadMovement: total,
    visitedOrderOnly: [...queue],
  };
}

// 2. SSTF Solver
export function solveSSTF(initialHead: number, queue: number[]): DiskAlgorithmResult {
  const remaining = [...queue];
  let curr = initialHead;
  const sequence: number[] = [initialHead];
  const visitedOrderOnly: number[] = [];
  const headMovements: number[] = [];
  let total = 0;

  while (remaining.length > 0) {
    let closestIndex = 0;
    let minDistance = Math.abs(remaining[0] - curr);

    for (let i = 1; i < remaining.length; i++) {
      const dist = Math.abs(remaining[i] - curr);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    const next = remaining.splice(closestIndex, 1)[0];
    const diff = Math.abs(next - curr);
    headMovements.push(diff);
    total += diff;
    curr = next;
    sequence.push(next);
    visitedOrderOnly.push(next);
  }

  return {
    sequence,
    headMovements,
    totalHeadMovement: total,
    visitedOrderOnly,
  };
}

// 3. SCAN Solver (Elevator)
export function solveSCAN(
  initialHead: number,
  queue: number[],
  range: [number, number] = [0, 199],
  direction: 'UP' | 'DOWN' = 'UP'
): DiskAlgorithmResult {
  const [minCyl, maxCyl] = range;
  const below = queue.filter(r => r < initialHead).sort((a, b) => b - a); // descending
  const above = queue.filter(r => r >= initialHead).sort((a, b) => a - b); // ascending

  let sequence: number[] = [initialHead];
  let visitedOrderOnly: number[] = [];

  if (direction === 'UP') {
    above.forEach(r => {
      sequence.push(r);
      visitedOrderOnly.push(r);
    });
    // If there are requests below, SCAN must hit the upper boundary before reversing
    if (below.length > 0) {
      if (sequence[sequence.length - 1] !== maxCyl) {
        sequence.push(maxCyl);
      }
      below.forEach(r => {
        sequence.push(r);
        visitedOrderOnly.push(r);
      });
    }
  } else {
    below.forEach(r => {
      sequence.push(r);
      visitedOrderOnly.push(r);
    });
    if (above.length > 0) {
      if (sequence[sequence.length - 1] !== minCyl) {
        sequence.push(minCyl);
      }
      above.forEach(r => {
        sequence.push(r);
        visitedOrderOnly.push(r);
      });
    }
  }

  const headMovements: number[] = [];
  let total = 0;
  for (let i = 0; i < sequence.length - 1; i++) {
    const diff = Math.abs(sequence[i + 1] - sequence[i]);
    headMovements.push(diff);
    total += diff;
  }

  return {
    sequence,
    headMovements,
    totalHeadMovement: total,
    visitedOrderOnly,
  };
}

// 4. C-SCAN Solver (Circular SCAN)
export function solveCSCAN(
  initialHead: number,
  queue: number[],
  range: [number, number] = [0, 199],
  direction: 'UP' | 'DOWN' = 'UP'
): DiskAlgorithmResult {
  const [minCyl, maxCyl] = range;
  const below = queue.filter(r => r < initialHead).sort((a, b) => a - b); // ascending from 0
  const above = queue.filter(r => r >= initialHead).sort((a, b) => a - b); // ascending towards max

  let sequence: number[] = [initialHead];
  let visitedOrderOnly: number[] = [];

  if (direction === 'UP') {
    above.forEach(r => {
      sequence.push(r);
      visitedOrderOnly.push(r);
    });
    if (below.length > 0) {
      sequence.push(maxCyl);
      sequence.push(minCyl); // Jump to beginning without servicing requests on the way back
      below.forEach(r => {
        sequence.push(r);
        visitedOrderOnly.push(r);
      });
    }
  } else {
    const belowDesc = queue.filter(r => r < initialHead).sort((a, b) => b - a);
    const aboveDesc = queue.filter(r => r >= initialHead).sort((a, b) => b - a);
    belowDesc.forEach(r => {
      sequence.push(r);
      visitedOrderOnly.push(r);
    });
    if (aboveDesc.length > 0) {
      sequence.push(minCyl);
      sequence.push(maxCyl);
      aboveDesc.forEach(r => {
        sequence.push(r);
        visitedOrderOnly.push(r);
      });
    }
  }

  const headMovements: number[] = [];
  let total = 0;
  for (let i = 0; i < sequence.length - 1; i++) {
    const diff = Math.abs(sequence[i + 1] - sequence[i]);
    headMovements.push(diff);
    total += diff;
  }

  return {
    sequence,
    headMovements,
    totalHeadMovement: total,
    visitedOrderOnly,
  };
}

export function generateDiskState(config: DiskConfig = defaultDiskConfig): DiskState {
  const direction = config.direction || 'UP';
  const range = config.cylinderRange;
  const queue = [...config.requestQueue];
  const head = config.initialHead;

  const solutions = {
    FCFS: solveFCFS(head, queue),
    SSTF: solveSSTF(head, queue),
    SCAN: solveSCAN(head, queue, range, direction),
    'C-SCAN': solveCSCAN(head, queue, range, direction),
  };

  return {
    cylinderRange: config.cylinderRange,
    initialHead: config.initialHead,
    requestQueue: queue,
    algorithm: config.algorithm,
    direction,
    solutions,
  };
}

export function evaluateDiskScenario(
  state: DiskState,
  input: DiskStudentInput
): ScenarioEvaluationResult {
  const activeSolution = state.solutions[state.algorithm];
  const expectedOrder = activeSolution.visitedOrderOnly;
  const expectedTotalMovement = activeSolution.totalHeadMovement;
  const expectedNextRequest = expectedOrder[0];

  const studentTotalMovement = Number(input.totalHeadMovement);
  const isTotalMovementCorrect = !isNaN(studentTotalMovement) && 
    studentTotalMovement === expectedTotalMovement;

  const studentOrder = Array.isArray(input.serviceOrder) ? input.serviceOrder : [];
  
  // Check order matching
  const isOrderLengthMatch = studentOrder.length === expectedOrder.length;
  let orderMatchesCount = 0;
  for (let i = 0; i < Math.min(studentOrder.length, expectedOrder.length); i++) {
    if (Number(studentOrder[i]) === expectedOrder[i]) {
      orderMatchesCount++;
    }
  }
  const isOrderCompletelyCorrect = isOrderLengthMatch && orderMatchesCount === expectedOrder.length;

  const steps = [
    {
      stepKey: 'serviceOrder',
      stepTitle: `Service Order for ${state.algorithm}`,
      studentValue: studentOrder.length > 0 ? studentOrder.join(', ') : '(empty)',
      expectedValue: expectedOrder.join(', '),
      isCorrect: isOrderCompletelyCorrect,
      explanation: `${state.algorithm} services requests in the order: [${expectedOrder.join(', ')}].`,
    },
    {
      stepKey: 'totalHeadMovement',
      stepTitle: 'Total Head Movement (Cylinders)',
      studentValue: input.totalHeadMovement ?? '(empty)',
      expectedValue: expectedTotalMovement,
      isCorrect: isTotalMovementCorrect,
      explanation: `Sum of head displacements: ${activeSolution.headMovements.join(' + ')} = ${expectedTotalMovement} cylinders.`,
    },
  ];

  if (input.nextRequest !== undefined && input.nextRequest !== '') {
    const isNextCorrect = Number(input.nextRequest) === expectedNextRequest;
    steps.unshift({
      stepKey: 'nextRequest',
      stepTitle: `First Request Serviced After Head (${state.initialHead})`,
      studentValue: input.nextRequest,
      expectedValue: expectedNextRequest,
      isCorrect: isNextCorrect,
      explanation: `Immediately after start, the disk head moves to cylinder ${expectedNextRequest}.`,
    });
  }

  const correctCount = steps.filter(s => s.isCorrect).length;
  const totalSteps = steps.length;
  const isOverallCorrect = correctCount === totalSteps;
  const score = Math.round((correctCount / totalSteps) * 10) / 10;

  return {
    isCorrect: isOverallCorrect,
    score,
    maxScore: 1,
    percentage: Math.round((correctCount / totalSteps) * 100),
    stepResults: steps,
    overallExplanation: `Under ${state.algorithm} scheduling starting at cylinder ${state.initialHead}, requests are serviced in order: [${expectedOrder.join(', ')}], incurring total head movement of ${expectedTotalMovement} cylinders.`,
  };
}

export function explainDiskScenario(state: DiskState): string {
  const sol = state.solutions[state.algorithm];
  const stepsBreakdown = sol.sequence.slice(0, -1).map((curr, idx) => {
    const next = sol.sequence[idx + 1];
    const diff = Math.abs(next - curr);
    return `|${next} - ${curr}| = ${diff}`;
  });

  return `
### Disk Scheduling (${state.algorithm}) Analysis:
- **Cylinder Range:** ${state.cylinderRange[0]} to ${state.cylinderRange[1]}
- **Initial Head:** ${state.initialHead}
- **Queue:** [${state.requestQueue.join(', ')}]
- **Full Head Trajectory:** ${sol.sequence.join(' $\\rightarrow$ ')}
- **Displacement Calculation:**
  $$${stepsBreakdown.join(' + ')} = \\mathbf{${sol.totalHeadMovement}}$$ cylinders.

#### Algorithm Comparison on this Queue:
- **FCFS:** ${state.solutions.FCFS.totalHeadMovement} cylinders
- **SSTF:** ${state.solutions.SSTF.totalHeadMovement} cylinders
- **SCAN:** ${state.solutions.SCAN.totalHeadMovement} cylinders
- **C-SCAN:** ${state.solutions['C-SCAN'].totalHeadMovement} cylinders
  `.trim();
}
