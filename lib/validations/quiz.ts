import { z } from 'zod';
import { QuestionSchema } from './question';

export const QuizModeEnum = z.enum(['assessment', 'practice']);
export type QuizMode = z.infer<typeof QuizModeEnum>;

export const QuizSchema = z.object({
  id: z.string(),
  courseId: z.string().min(1, 'Course ID is required'),
  title: z.string().min(1, 'Quiz title is required'),
  description: z.string().default(''),
  instructions: z.string().default(''),
  assignedSectionIds: z.array(z.string()).default([]), // Empty array = all sections
  mode: QuizModeEnum.default('assessment'),
  
  // Timing & Access
  availableFrom: z.string(), // ISO date string
  dueAt: z.string(),         // ISO date string
  timeLimitMinutes: z.number().int().min(0).optional(), // 0 or undefined = no time limit
  maxAttempts: z.number().int().min(0).default(1),      // 0 = unlimited
  
  // Feedback & Presentation
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(true),
  immediateFeedback: z.boolean().default(false),
  revealCorrectAnswer: z.boolean().default(false),
  revealExplanation: z.boolean().default(false),
  showScoreImmediately: z.boolean().default(false),
  collectConfidence: z.boolean().default(true),
  
  // Publishing & Versioning
  isPublished: z.boolean().default(false),
  activeVersionId: z.string().optional(),
  
  // Question references in draft mode
  questionIds: z.array(z.string()).default([]),
  
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Quiz = z.infer<typeof QuizSchema>;

// Immutable Published Version snapshot
export const QuizVersionSchema = z.object({
  id: z.string(),
  quizId: z.string(),
  versionNumber: z.number().int().min(1),
  publishedAt: z.string(),
  publishedBy: z.string(),
  questions: z.array(QuestionSchema),
  totalPoints: z.number().min(0),
  mode: QuizModeEnum,
  timeLimitMinutes: z.number().int().min(0).optional(),
  collectConfidence: z.boolean(),
  immediateFeedback: z.boolean(),
  revealCorrectAnswer: z.boolean(),
  revealExplanation: z.boolean(),
  showScoreImmediately: z.boolean(),
});
export type QuizVersion = z.infer<typeof QuizVersionSchema>;
