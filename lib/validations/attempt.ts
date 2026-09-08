import { z } from 'zod';

export const AttemptStatusEnum = z.enum(['in-progress', 'submitted', 'timed-out']);
export type AttemptStatus = z.infer<typeof AttemptStatusEnum>;

export const ResponseSchema = z.object({
  questionId: z.string(),
  attemptId: z.string(),
  userId: z.string(),
  answer: z.any(), // Flexible per question type (string, string[], number, Record)
  isCorrect: z.boolean().optional(),
  pointsEarned: z.number().optional(),
  responseTimeMs: z.number().min(0).default(0),
  confidenceRating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
  feedbackText: z.string().optional(),
  hintUsed: z.boolean().default(false),
  changedAnswerCount: z.number().int().min(0).default(0),
  updatedAt: z.string(),
});
export type StudentResponse = z.infer<typeof ResponseSchema>;

export const AttemptSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userEmail: z.string().optional(),
  userName: z.string().optional(),
  courseId: z.string(),
  quizId: z.string(),
  quizVersionId: z.string(),
  attemptNumber: z.number().int().min(1),
  startedAt: z.string(),
  submittedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  status: AttemptStatusEnum.default('in-progress'),
  score: z.number().optional(),
  maxScore: z.number(),
  percentage: z.number().optional(),
});
export type Attempt = z.infer<typeof AttemptSchema>;
