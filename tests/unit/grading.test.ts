import { describe, it, expect } from 'vitest';
import { evaluateQuestionAnswer } from '@/lib/grading';
import { 
  McqSingleQuestion, 
  McqMultiQuestion, 
  NumericQuestion, 
  ShortTextQuestion,
  OrderingQuestion,
  MatchingQuestion,
  ScenarioQuestion
} from '@/lib/validations/question';

describe('Authoritative Question Grading Engine', () => {
  it('grades Single Choice MCQ', () => {
    const q: McqSingleQuestion = {
      id: 'q1',
      type: 'mcq-single',
      title: 'Page Size',
      prompt: 'What is a typical modern OS page size?',
      difficulty: 'easy',
      tags: ['memory'],
      topic: 'Virtual Memory',
      points: 2,
      explanation: '4KB is standard on x86 architectures.',
      options: [
        { id: 'opt1', text: '16 Bytes', isCorrect: false },
        { id: 'opt2', text: '4 KB', isCorrect: true },
        { id: 'opt3', text: '1 GB', isCorrect: false },
      ],
      shuffleOptions: true,
    };

    expect(evaluateQuestionAnswer(q, 'opt2')).toMatchObject({
      questionId: 'q1',
      isCorrect: true,
      pointsEarned: 2,
      maxPoints: 2,
    });

    expect(evaluateQuestionAnswer(q, 'opt1').isCorrect).toBe(false);
  });

  it('grades Multiple Select MCQ with partial credit', () => {
    const q: McqMultiQuestion = {
      id: 'q2',
      type: 'mcq-multi',
      title: 'Page Table Benefits',
      prompt: 'Select all advantages of virtual memory paging:',
      difficulty: 'medium',
      tags: ['memory'],
      topic: 'Virtual Memory',
      points: 4,
      explanation: 'Paging eliminates external fragmentation and supports non-contiguous allocation.',
      options: [
        { id: 'optA', text: 'No external fragmentation', isCorrect: true },
        { id: 'optB', text: 'Non-contiguous allocation', isCorrect: true },
        { id: 'optC', text: 'Eliminates internal fragmentation', isCorrect: false },
      ],
      shuffleOptions: true,
      allowPartialCredit: true,
    };

    // Selecting both correct
    const full = evaluateQuestionAnswer(q, ['optA', 'optB']);
    expect(full.isCorrect).toBe(true);
    expect(full.pointsEarned).toBe(4);

    // Selecting 1 correct
    const half = evaluateQuestionAnswer(q, ['optA']);
    expect(half.isCorrect).toBe(false);
    expect(half.pointsEarned).toBe(2);
  });

  it('grades Numeric answers with tolerance', () => {
    const q: NumericQuestion = {
      id: 'q3',
      type: 'numeric',
      title: 'Hit Ratio',
      prompt: 'Calculate the effective access time (EAT) in nanoseconds.',
      difficulty: 'medium',
      tags: ['tlb'],
      topic: 'Virtual Memory',
      points: 3,
      correctValue: 120.5,
      tolerance: 0.5,
      explanation: 'EAT = (0.8 * 100) + (0.2 * 200) + ...',
    };

    expect(evaluateQuestionAnswer(q, 120.5).isCorrect).toBe(true);
    expect(evaluateQuestionAnswer(q, '120.8').isCorrect).toBe(true); // within 0.5 tolerance
    expect(evaluateQuestionAnswer(q, 122).isCorrect).toBe(false);
  });

  it('grades Short Text answers ignoring case and whitespace', () => {
    const q: ShortTextQuestion = {
      id: 'q4',
      type: 'short-text',
      title: 'MMU acronym',
      prompt: 'What hardware component performs runtime address translation?',
      difficulty: 'easy',
      tags: ['hardware'],
      topic: 'Virtual Memory',
      points: 1,
      explanation: 'Memory Management Unit',
      acceptedAnswers: ['Memory Management Unit', 'MMU'],
      caseSensitive: false,
      trimWhitespace: true,
    };

    expect(evaluateQuestionAnswer(q, 'mmu').isCorrect).toBe(true);
    expect(evaluateQuestionAnswer(q, '  Memory Management Unit  ').isCorrect).toBe(true);
    expect(evaluateQuestionAnswer(q, 'ALU').isCorrect).toBe(false);
  });

  it('evaluates textual answer with smart semantic scoring and fractional credit', () => {
    const q: ShortTextQuestion = {
      id: 'q-text-smart',
      type: 'short-text',
      title: 'Context Switching Definition',
      prompt: 'Explain what happens during a CPU context switch.',
      difficulty: 'medium',
      tags: ['cpu'],
      topic: 'Process Management',
      points: 3,
      explanation: 'Saves the state of the active process into its PCB and restores the state of the newly scheduled process.',
      acceptedAnswers: ['Saves current process state to PCB and restores next process state from PCB'],
      caseSensitive: false,
      trimWhitespace: true,
    };

    const partialAnswer = 'It saves the registers and state of the running process to the PCB and restores the next process.';
    const res = evaluateQuestionAnswer(q, partialAnswer);
    expect(res.pointsEarned).toBeGreaterThanOrEqual(2.0);
    expect(res.maxPoints).toBe(3);
    expect(res.justification).toBeDefined();
    expect(res.modelAnswer).toBeDefined();
  });

  it('grades Scenario question using plugin registry', () => {
    const q: ScenarioQuestion = {
      id: 'q5',
      type: 'scenario',
      title: 'Address Translation Challenge',
      prompt: 'Translate the given logical address.',
      difficulty: 'hard',
      tags: ['paging'],
      topic: 'Virtual Memory',
      points: 5,
      explanation: 'Translates to physical address 9.',
      scenarioType: 'paging-translation',
      scenarioConfig: {
        processName: 'P1',
        processSize: 4,
        pageSize: 2,
        physicalMemorySize: 16,
        frameSize: 2,
        pageTable: { 0: 2, 1: 4 },
        targetLogicalAddress: 3,
      },
    };

    const studentInput = {
      logicalAddressBinary: '11',
      pageNumber: 1,
      pageOffset: 1,
      frameNumber: 4,
      physicalAddressBinary: '1001',
      physicalAddressDecimal: 9,
    };

    const res = evaluateQuestionAnswer(q, studentInput);
    expect(res.isCorrect).toBe(true);
    expect(res.pointsEarned).toBe(5);
  });
});
