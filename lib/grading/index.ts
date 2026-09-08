import { Question } from '@/lib/validations/question';
import { ScenarioRegistry } from '@/lib/scenarios/registry';

export interface EvaluationResult {
  questionId: string;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  feedback?: string;
  stepDetails?: any;
}

/**
 * Pure evaluation function for student answers against authoritative question definitions.
 */
export function evaluateQuestionAnswer(
  question: Question,
  studentAnswer: any
): EvaluationResult {
  const maxPoints = question.points ?? 1;

  if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') {
    return {
      questionId: question.id,
      isCorrect: false,
      pointsEarned: 0,
      maxPoints,
      feedback: 'No answer provided.',
    };
  }

  switch (question.type) {
    case 'mcq-single': {
      const correctOption = question.options.find(opt => opt.isCorrect);
      const isCorrect = correctOption ? String(studentAnswer) === String(correctOption.id) : false;
      return {
        questionId: question.id,
        isCorrect,
        pointsEarned: isCorrect ? maxPoints : 0,
        maxPoints,
      };
    }

    case 'mcq-multi': {
      const correctIds = new Set(
        question.options.filter(opt => opt.isCorrect).map(opt => String(opt.id))
      );
      const studentIds = new Set(
        Array.isArray(studentAnswer) ? studentAnswer.map(String) : [String(studentAnswer)]
      );

      if (question.allowPartialCredit) {
        let correctMatches = 0;
        let incorrectPicks = 0;

        question.options.forEach(opt => {
          const optId = String(opt.id);
          const shouldSelect = opt.isCorrect;
          const didSelect = studentIds.has(optId);

          if (shouldSelect && didSelect) {
            correctMatches++;
          } else if (!shouldSelect && didSelect) {
            incorrectPicks++;
          }
        });

        const netCorrect = Math.max(0, correctMatches - incorrectPicks);
        const ratio = correctIds.size > 0 ? netCorrect / correctIds.size : 0;
        const pointsEarned = Math.round(ratio * maxPoints * 100) / 100;
        const isCorrect = pointsEarned === maxPoints;

        return {
          questionId: question.id,
          isCorrect,
          pointsEarned,
          maxPoints,
        };
      } else {
        // All-or-nothing
        const isExactMatch =
          correctIds.size === studentIds.size &&
          Array.from(correctIds).every(id => studentIds.has(id));

        return {
          questionId: question.id,
          isCorrect: isExactMatch,
          pointsEarned: isExactMatch ? maxPoints : 0,
          maxPoints,
        };
      }
    }

    case 'true-false': {
      const boolAnswer = typeof studentAnswer === 'boolean' 
        ? studentAnswer 
        : String(studentAnswer).toLowerCase() === 'true';
      const isCorrect = boolAnswer === question.correctAnswer;
      return {
        questionId: question.id,
        isCorrect,
        pointsEarned: isCorrect ? maxPoints : 0,
        maxPoints,
      };
    }

    case 'numeric': {
      const numAnswer = Number(studentAnswer);
      if (isNaN(numAnswer)) {
        return {
          questionId: question.id,
          isCorrect: false,
          pointsEarned: 0,
          maxPoints,
          feedback: 'Answer must be a valid number.',
        };
      }
      const diff = Math.abs(numAnswer - question.correctValue);
      const tolerance = question.tolerance ?? 0;
      const isCorrect = diff <= tolerance;
      return {
        questionId: question.id,
        isCorrect,
        pointsEarned: isCorrect ? maxPoints : 0,
        maxPoints,
      };
    }

    case 'short-text': {
      const normInput = question.trimWhitespace ? String(studentAnswer).trim() : String(studentAnswer);
      const isCorrect = question.acceptedAnswers.some(ans => {
        const normTarget = question.trimWhitespace ? ans.trim() : ans;
        return question.caseSensitive
          ? normInput === normTarget
          : normInput.toLowerCase() === normTarget.toLowerCase();
      });
      return {
        questionId: question.id,
        isCorrect,
        pointsEarned: isCorrect ? maxPoints : 0,
        maxPoints,
      };
    }

    case 'ordering': {
      const sortedItems = [...question.items].sort((a, b) => a.correctOrder - b.correctOrder);
      const expectedIds = sortedItems.map(item => String(item.id));
      const studentIds = Array.isArray(studentAnswer) ? studentAnswer.map(String) : [];

      let matchingPositions = 0;
      for (let i = 0; i < expectedIds.length; i++) {
        if (studentIds[i] === expectedIds[i]) {
          matchingPositions++;
        }
      }

      const ratio = expectedIds.length > 0 ? matchingPositions / expectedIds.length : 0;
      const pointsEarned = Math.round(ratio * maxPoints * 100) / 100;
      const isCorrect = matchingPositions === expectedIds.length;

      return {
        questionId: question.id,
        isCorrect,
        pointsEarned,
        maxPoints,
      };
    }

    case 'matching': {
      // studentAnswer format: { [pairId]: studentChosenRightValue } or array of { left, right }
      const pairs = question.pairs;
      let matchedCount = 0;
      if (typeof studentAnswer === 'object' && studentAnswer !== null) {
        pairs.forEach(pair => {
          if (studentAnswer[pair.id] === pair.right || studentAnswer[pair.left] === pair.right) {
            matchedCount++;
          }
        });
      }
      const ratio = pairs.length > 0 ? matchedCount / pairs.length : 0;
      const pointsEarned = Math.round(ratio * maxPoints * 100) / 100;
      const isCorrect = matchedCount === pairs.length;

      return {
        questionId: question.id,
        isCorrect,
        pointsEarned,
        maxPoints,
      };
    }

    case 'scenario': {
      const plugin = ScenarioRegistry.get(question.scenarioType);
      if (!plugin) {
        return {
          questionId: question.id,
          isCorrect: false,
          pointsEarned: 0,
          maxPoints,
          feedback: `Scenario engine '${question.scenarioType}' is not registered.`,
        };
      }
      const state = plugin.generateState(question.scenarioConfig);
      const scenarioRes = plugin.evaluate(state, studentAnswer, question.scenarioConfig);
      const pointsEarned = Math.round(scenarioRes.score * maxPoints * 100) / 100;

      return {
        questionId: question.id,
        isCorrect: scenarioRes.isCorrect,
        pointsEarned,
        maxPoints,
        stepDetails: scenarioRes.stepResults,
        feedback: scenarioRes.overallExplanation,
      };
    }

    case 'confidence':
    case 'feedback':
      // Metacognitive or qualitative questions grant full points on submission
      return {
        questionId: question.id,
        isCorrect: true,
        pointsEarned: maxPoints,
        maxPoints,
      };

    default: {
      const fallbackId = (question as any)?.id || 'unknown';
      return {
        questionId: fallbackId,
        isCorrect: false,
        pointsEarned: 0,
        maxPoints,
      };
    }
  }
}
