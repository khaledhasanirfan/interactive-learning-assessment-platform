import { describe, it, expect } from 'vitest';
import { 
  generatePagingState, 
  evaluatePagingScenario, 
  defaultPagingConfig 
} from '@/lib/scenarios/paging';

describe('Paging Address Translation Scenario', () => {
  it('correctly generates state for the specification example (Process 4B, Page 2B, RAM 16B)', () => {
    const state = generatePagingState(defaultPagingConfig);
    expect(state.processSize).toBe(4);
    expect(state.pageSize).toBe(2);
    expect(state.numPages).toBe(2);
    expect(state.pageBits).toBe(1);
    expect(state.offsetBits).toBe(1);
    expect(state.logicalBits).toBe(2);
    expect(state.numFrames).toBe(8);
    expect(state.frameBits).toBe(3);
    expect(state.physicalBits).toBe(4);
    expect(state.logicalAddress).toBe(3);
  });

  it('correctly validates the exact address 3 translation flow', () => {
    // 3 decimal = 11 binary
    // Page 1, Offset 1
    // Page 1 -> Frame 4 (100 binary)
    // Physical = [100 | 1] = 1001 binary = 9 decimal
    const state = generatePagingState(defaultPagingConfig);

    const correctInput = {
      logicalAddressBinary: '11',
      pageNumber: 1,
      pageOffset: 1,
      frameNumber: 4,
      physicalAddressBinary: '1001',
      physicalAddressDecimal: 9,
    };

    const result = evaluatePagingScenario(state, correctInput);
    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(1);
    expect(result.percentage).toBe(100);
    expect(result.stepResults.every(s => s.isCorrect)).toBe(true);
  });

  it('accurately identifies errors in individual translation steps', () => {
    const state = generatePagingState(defaultPagingConfig);

    // Provide incorrect frame and decimal address
    const partialInput = {
      logicalAddressBinary: '11',
      pageNumber: 1,
      pageOffset: 1,
      frameNumber: 2, // incorrect! should be 4
      physicalAddressBinary: '1001',
      physicalAddressDecimal: 5, // incorrect!
    };

    const result = evaluatePagingScenario(state, partialInput);
    expect(result.isCorrect).toBe(false);
    expect(result.percentage).toBeLessThan(100);

    const frameStep = result.stepResults.find(s => s.stepKey === 'frameNumber');
    expect(frameStep?.isCorrect).toBe(false);

    const decStep = result.stepResults.find(s => s.stepKey === 'physicalAddressDecimal');
    expect(decStep?.isCorrect).toBe(false);
  });
});
