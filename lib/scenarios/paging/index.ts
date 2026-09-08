import { ScenarioEvaluationResult } from '../types';

export interface PagingConfig {
  processName: string;          // e.g. "P1"
  processSize: number;          // e.g. 4 bytes
  pageSize: number;             // e.g. 2 bytes
  physicalMemorySize: number;   // e.g. 16 bytes
  frameSize: number;            // e.g. 2 bytes (must match pageSize)
  pageTable: Record<number, number>; // e.g. { 0: 2, 1: 4 }
  targetLogicalAddress?: number; // e.g. 3 (if fixed), or undefined to auto-generate
}

export interface PagingState {
  processName: string;
  processSize: number;
  pageSize: number;
  physicalMemorySize: number;
  frameSize: number;
  pageTable: Record<number, number>;
  logicalAddress: number;
  
  // Derived metadata
  numPages: number;
  pageBits: number;
  offsetBits: number;
  logicalBits: number;
  numFrames: number;
  frameBits: number;
  physicalBits: number;
}

export interface PagingStudentInput {
  logicalAddressBinary: string; // e.g. "11" or "0011"
  pageNumber: number | string;  // e.g. 1
  pageOffset: number | string;  // e.g. 1
  frameNumber: number | string; // e.g. 4
  physicalAddressBinary: string;// e.g. "1001"
  physicalAddressDecimal: number | string; // e.g. 9
}

export const defaultPagingConfig: PagingConfig = {
  processName: 'P1',
  processSize: 4,
  pageSize: 2,
  physicalMemorySize: 16,
  frameSize: 2,
  pageTable: {
    0: 2,
    1: 4,
  },
  targetLogicalAddress: 3,
};

export function generatePagingState(config: PagingConfig = defaultPagingConfig): PagingState {
  const numPages = Math.ceil(config.processSize / config.pageSize);
  const pageBits = Math.max(1, Math.ceil(Math.log2(numPages)));
  const offsetBits = Math.max(1, Math.ceil(Math.log2(config.pageSize)));
  const logicalBits = pageBits + offsetBits;

  const numFrames = Math.ceil(config.physicalMemorySize / config.frameSize);
  const frameBits = Math.max(1, Math.ceil(Math.log2(numFrames)));
  const physicalBits = frameBits + offsetBits;

  let logicalAddress = config.targetLogicalAddress;
  if (logicalAddress === undefined || logicalAddress < 0 || logicalAddress >= config.processSize) {
    logicalAddress = Math.floor(Math.random() * config.processSize);
  }

  return {
    processName: config.processName,
    processSize: config.processSize,
    pageSize: config.pageSize,
    physicalMemorySize: config.physicalMemorySize,
    frameSize: config.frameSize,
    pageTable: { ...config.pageTable },
    logicalAddress,
    numPages,
    pageBits,
    offsetBits,
    logicalBits,
    numFrames,
    frameBits,
    physicalBits,
  };
}

export function evaluatePagingScenario(
  state: PagingState,
  input: PagingStudentInput
): ScenarioEvaluationResult {
  const expectedPageNumber = Math.floor(state.logicalAddress / state.pageSize);
  const expectedOffset = state.logicalAddress % state.pageSize;
  const expectedFrameNumber = state.pageTable[expectedPageNumber];
  
  const expectedPhysicalAddress = expectedFrameNumber !== undefined
    ? (expectedFrameNumber * state.frameSize) + expectedOffset
    : -1;

  // Expected binary strings formatted to expected bit widths
  const expectedLogicalBin = state.logicalAddress.toString(2).padStart(state.logicalBits, '0');
  const expectedFrameBin = expectedFrameNumber !== undefined 
    ? expectedFrameNumber.toString(2).padStart(state.frameBits, '0') 
    : '0';
  const expectedOffsetBin = expectedOffset.toString(2).padStart(state.offsetBits, '0');
  const expectedPhysicalBin = `${expectedFrameBin}${expectedOffsetBin}`;

  // Helper to normalize numeric input
  const toNum = (v: any) => (v !== undefined && v !== '' ? Number(v) : NaN);
  const cleanBin = (v: string | undefined) => (v ? v.replace(/\s+/g, '') : '');

  const studentLogicalBin = cleanBin(input.logicalAddressBinary);
  const studentPageNum = toNum(input.pageNumber);
  const studentOffset = toNum(input.pageOffset);
  const studentFrameNum = toNum(input.frameNumber);
  const studentPhysicalBin = cleanBin(input.physicalAddressBinary);
  const studentPhysicalDec = toNum(input.physicalAddressDecimal);

  // Logical bin check: allow unpadded or padded match
  const isLogicalBinCorrect = studentLogicalBin === expectedLogicalBin || 
    parseInt(studentLogicalBin, 2) === state.logicalAddress;

  const isPageNumCorrect = studentPageNum === expectedPageNumber;
  const isOffsetCorrect = studentOffset === expectedOffset;
  const isFrameNumCorrect = studentFrameNum === expectedFrameNumber;

  const isPhysicalBinCorrect = studentPhysicalBin === expectedPhysicalBin || 
    parseInt(studentPhysicalBin, 2) === expectedPhysicalAddress;

  const isPhysicalDecCorrect = studentPhysicalDec === expectedPhysicalAddress;

  const steps = [
    {
      stepKey: 'logicalAddressBinary',
      stepTitle: 'Logical Address in Binary',
      studentValue: input.logicalAddressBinary || '(empty)',
      expectedValue: expectedLogicalBin,
      isCorrect: isLogicalBinCorrect,
      explanation: `Address ${state.logicalAddress} in ${state.logicalBits}-bit binary is ${expectedLogicalBin}.`,
    },
    {
      stepKey: 'pageNumber',
      stepTitle: 'Page Number (p)',
      studentValue: input.pageNumber ?? '(empty)',
      expectedValue: expectedPageNumber,
      isCorrect: isPageNumCorrect,
      explanation: `Page # = floor(Logical Address / Page Size) = floor(${state.logicalAddress} / ${state.pageSize}) = ${expectedPageNumber}.`,
    },
    {
      stepKey: 'pageOffset',
      stepTitle: 'Page Offset (d)',
      studentValue: input.pageOffset ?? '(empty)',
      expectedValue: expectedOffset,
      isCorrect: isOffsetCorrect,
      explanation: `Offset = Logical Address mod Page Size = ${state.logicalAddress} mod ${state.pageSize} = ${expectedOffset}.`,
    },
    {
      stepKey: 'frameNumber',
      stepTitle: 'Frame Number (f)',
      studentValue: input.frameNumber ?? '(empty)',
      expectedValue: expectedFrameNumber,
      isCorrect: isFrameNumCorrect,
      explanation: `Looking up Page ${expectedPageNumber} in the Page Table yields Frame ${expectedFrameNumber}.`,
    },
    {
      stepKey: 'physicalAddressBinary',
      stepTitle: 'Physical Address in Binary',
      studentValue: input.physicalAddressBinary || '(empty)',
      expectedValue: expectedPhysicalBin,
      isCorrect: isPhysicalBinCorrect,
      explanation: `Physical Address = [Frame ${expectedFrameBin} | Offset ${expectedOffsetBin}] = ${expectedPhysicalBin}.`,
    },
    {
      stepKey: 'physicalAddressDecimal',
      stepTitle: 'Physical Address in Decimal',
      studentValue: input.physicalAddressDecimal ?? '(empty)',
      expectedValue: expectedPhysicalAddress,
      isCorrect: isPhysicalDecCorrect,
      explanation: `Physical Address = (${expectedFrameNumber} * ${state.frameSize}) + ${expectedOffset} = ${expectedPhysicalAddress} (or binary ${expectedPhysicalBin} in decimal = ${expectedPhysicalAddress}).`,
    },
  ];

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
    overallExplanation: `For logical address ${state.logicalAddress}: it maps to Page ${expectedPageNumber}, Offset ${expectedOffset}. The Page Table maps Page ${expectedPageNumber} to Frame ${expectedFrameNumber}. Concatenating Frame ${expectedFrameNumber} and Offset ${expectedOffset} yields Physical Address ${expectedPhysicalAddress} (binary: ${expectedPhysicalBin}).`,
  };
}

export function explainPagingScenario(state: PagingState): string {
  const expectedPageNumber = Math.floor(state.logicalAddress / state.pageSize);
  const expectedOffset = state.logicalAddress % state.pageSize;
  const expectedFrameNumber = state.pageTable[expectedPageNumber];
  const expectedPhysicalAddress = (expectedFrameNumber * state.frameSize) + expectedOffset;

  const expectedLogicalBin = state.logicalAddress.toString(2).padStart(state.logicalBits, '0');
  const expectedFrameBin = expectedFrameNumber.toString(2).padStart(state.frameBits, '0');
  const expectedOffsetBin = expectedOffset.toString(2).padStart(state.offsetBits, '0');
  const expectedPhysicalBin = `${expectedFrameBin}${expectedOffsetBin}`;

  return `
### Step-by-Step Address Translation Walkthrough:
1. **Logical Address Formulation:**
   - CPU generated logical byte address: \`${state.logicalAddress}\` decimal.
   - Total process size = ${state.processSize} bytes $\\rightarrow$ needs ${state.logicalBits} bits.
   - Logical address binary = \`${expectedLogicalBin}\`.
2. **Address Decomposition:**
   - Page size = ${state.pageSize} bytes $\\rightarrow$ Offset ($d$) requires $\\log_2(${state.pageSize}) = ${state.offsetBits}$ bit(s).
   - Number of pages = ${state.processSize} / ${state.pageSize} = ${state.numPages} $\\rightarrow$ Page ($p$) requires $\\log_2(${state.numPages}) = ${state.pageBits}$ bit(s).
   - Higher ${state.pageBits} bit(s): Page Number = \`${expectedPageNumber}\`.
   - Lower ${state.offsetBits} bit(s): Offset = \`${expectedOffset}\`.
3. **Page Table Lookup:**
   - Consult Page Table for Page \`${expectedPageNumber}\` $\\rightarrow$ Maps to Frame \`${expectedFrameNumber}\`.
4. **Physical Address Synthesis:**
   - Physical memory size = ${state.physicalMemorySize} bytes (${state.numFrames} frames of size ${state.frameSize}B).
   - Frame number ${expectedFrameNumber} in ${state.frameBits}-bit binary = \`${expectedFrameBin}\`.
   - Physical address = \`[Frame: ${expectedFrameBin} | Offset: ${expectedOffsetBin}]\` = \`${expectedPhysicalBin}\` binary.
   - Converting to decimal: $(${expectedFrameNumber} \\times ${state.frameSize}) + ${expectedOffset} =$ **\`${expectedPhysicalAddress}\`**.
  `.trim();
}
