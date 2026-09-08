import { z } from 'zod';

export const QuestionTypeEnum = z.enum([
  'mcq-single',
  'mcq-multi',
  'true-false',
  'numeric',
  'short-text',
  'ordering',
  'matching',
  'scenario',
  'confidence',
  'feedback',
]);

export type QuestionType = z.infer<typeof QuestionTypeEnum>;

export const DifficultyEnum = z.enum(['easy', 'medium', 'hard']);
export type Difficulty = z.infer<typeof DifficultyEnum>;

export const BaseQuestionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  prompt: z.string().min(1, 'Prompt is required'),
  description: z.string().optional(),
  difficulty: DifficultyEnum.default('medium'),
  tags: z.array(z.string()).default([]),
  topic: z.string().min(1, 'Topic is required'),
  subtopic: z.string().optional(),
  courseId: z.string().optional(),
  questionBankId: z.string().optional(),
  points: z.number().min(0).default(1),
  hint: z.string().optional(),
  explanation: z.string().default(''),
  createdBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// 1. Single Choice MCQ
export const McqOptionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Option text cannot be empty'),
  isCorrect: z.boolean().default(false),
});
export type McqOption = z.infer<typeof McqOptionSchema>;

export const McqSingleQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('mcq-single'),
  options: z.array(McqOptionSchema).min(2, 'At least two options are required'),
  shuffleOptions: z.boolean().default(true),
});
export type McqSingleQuestion = z.infer<typeof McqSingleQuestionSchema>;

// 2. Multiple Select MCQ
export const McqMultiQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('mcq-multi'),
  options: z.array(McqOptionSchema).min(2, 'At least two options are required'),
  shuffleOptions: z.boolean().default(true),
  allowPartialCredit: z.boolean().default(false),
});
export type McqMultiQuestion = z.infer<typeof McqMultiQuestionSchema>;

// 3. True / False
export const TrueFalseQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('true-false'),
  correctAnswer: z.boolean(),
});
export type TrueFalseQuestion = z.infer<typeof TrueFalseQuestionSchema>;

// 4. Numeric Answer
export const NumericQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('numeric'),
  correctValue: z.number(),
  tolerance: z.number().min(0).default(0), // e.g. 0.01
  unit: z.string().optional(),
});
export type NumericQuestion = z.infer<typeof NumericQuestionSchema>;

// 5. Short Text Answer
export const ShortTextQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('short-text'),
  acceptedAnswers: z.array(z.string()).min(1, 'At least one accepted answer is required'),
  caseSensitive: z.boolean().default(false),
  trimWhitespace: z.boolean().default(true),
});
export type ShortTextQuestion = z.infer<typeof ShortTextQuestionSchema>;

// 6. Ordering / Sequencing
export const OrderingItemSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  correctOrder: z.number().int().min(0),
});
export type OrderingItem = z.infer<typeof OrderingItemSchema>;

export const OrderingQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('ordering'),
  items: z.array(OrderingItemSchema).min(2, 'At least two items to order'),
});
export type OrderingQuestion = z.infer<typeof OrderingQuestionSchema>;

// 7. Matching
export const MatchingPairSchema = z.object({
  id: z.string(),
  left: z.string().min(1),
  right: z.string().min(1),
});
export type MatchingPair = z.infer<typeof MatchingPairSchema>;

export const MatchingQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('matching'),
  pairs: z.array(MatchingPairSchema).min(2, 'At least two pairs to match'),
});
export type MatchingQuestion = z.infer<typeof MatchingQuestionSchema>;

// 8. Scenario-based Question
export const ScenarioQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('scenario'),
  scenarioType: z.string(), // e.g. 'paging-translation' | 'disk-scheduling'
  scenarioConfig: z.record(z.any()),
});
export type ScenarioQuestion = z.infer<typeof ScenarioQuestionSchema>;

// 9. Confidence Rating
export const ConfidenceQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('confidence'),
  minRating: z.number().default(1),
  maxRating: z.number().default(5),
  labels: z.record(z.string()).optional(), // e.g. { "1": "Very Unsure", "5": "Very Confident" }
});
export type ConfidenceQuestion = z.infer<typeof ConfidenceQuestionSchema>;

// 10. Open-ended Feedback
export const FeedbackQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('feedback'),
  placeholder: z.string().optional(),
  maxLength: z.number().default(500),
});
export type FeedbackQuestion = z.infer<typeof FeedbackQuestionSchema>;

// Discriminated Question Union
export const QuestionSchema = z.discriminatedUnion('type', [
  McqSingleQuestionSchema,
  McqMultiQuestionSchema,
  TrueFalseQuestionSchema,
  NumericQuestionSchema,
  ShortTextQuestionSchema,
  OrderingQuestionSchema,
  MatchingQuestionSchema,
  ScenarioQuestionSchema,
  ConfidenceQuestionSchema,
  FeedbackQuestionSchema,
]);

export type Question = z.infer<typeof QuestionSchema>;

// Question Bank Schema
export const QuestionBankSchema = z.object({
  id: z.string(),
  courseId: z.string().optional(),
  title: z.string().min(1, 'Bank title is required'),
  description: z.string().default(''),
  tags: z.array(z.string()).default([]),
  questions: z.array(QuestionSchema).default([]),
  createdBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type QuestionBank = z.infer<typeof QuestionBankSchema>;

/**
 * Strips secret answers and explanations from questions before serving to students
 * during active summative assessments.
 */
export function sanitizeQuestionForStudent(question: Question, revealSolutions = false): Record<string, any> {
  if (revealSolutions) {
    return question;
  }

  const { explanation, hint, ...rest } = question;

  switch (rest.type) {
    case 'mcq-single':
    case 'mcq-multi':
      return {
        ...rest,
        options: rest.options.map(({ isCorrect, ...opt }) => opt),
      };
    case 'true-false': {
      const { correctAnswer, ...tfRest } = rest;
      return tfRest;
    }
    case 'numeric': {
      const { correctValue, tolerance, ...numRest } = rest;
      return numRest;
    }
    case 'short-text': {
      const { acceptedAnswers, ...stRest } = rest;
      return stRest;
    }
    case 'ordering':
      return {
        ...rest,
        // Shuffle or strip the correctOrder
        items: rest.items.map(({ correctOrder, ...item }) => item),
      };
    case 'matching':
      return rest;
    default:
      return rest;
  }
}
