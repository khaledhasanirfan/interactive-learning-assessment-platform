import { Question } from '@/lib/validations/question';
import { ScenarioRegistry } from '@/lib/scenarios/registry';

export interface EvaluationResult {
  questionId: string;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  feedback?: string;
  justification?: string;
  modelAnswer?: string;
  stepDetails?: any;
}

/**
 * Intelligent NLP & Semantic scoring helper for textual answers.
 * Analyzes conceptual alignment, key technical terminology, and understanding.
 */
function evaluateTextualSemantic(
  studentInput: string,
  acceptedAnswers: string[],
  explanation: string,
  maxPoints: number,
  caseSensitive = false
): { pointsEarned: number; isCorrect: boolean; feedback: string; justification: string; modelAnswer: string } {
  const modelAnswer = acceptedAnswers[0] || explanation || 'Correct technical definition';
  const cleanStudent = studentInput.trim();

  // 1. Direct match check
  const exactMatch = acceptedAnswers.some(ans => 
    caseSensitive ? ans.trim() === cleanStudent : ans.trim().toLowerCase() === cleanStudent.toLowerCase()
  );

  if (exactMatch) {
    return {
      pointsEarned: maxPoints,
      isCorrect: true,
      feedback: 'Excellent! Perfect match with expected technical answer.',
      justification: explanation || `Matches expected answer: "${modelAnswer}"`,
      modelAnswer,
    };
  }

  // 2. Tokenize and extract technical concepts
  const stopWords = new Set(['a', 'an', 'the', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'of', 'to', 'for', 'with', 'by', 'it', 'its', 'that', 'this', 'and', 'or']);
  
  const extractKeywords = (text: string) => 
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

  const studentTokens = new Set(extractKeywords(cleanStudent));
  
  // Collect all reference target words
  const referenceText = `${acceptedAnswers.join(' ')} ${explanation}`;
  const targetKeywords = Array.from(new Set(extractKeywords(referenceText)));

  if (targetKeywords.length === 0) {
    return {
      pointsEarned: cleanStudent.length > 3 ? maxPoints : 0,
      isCorrect: cleanStudent.length > 3,
      feedback: 'Answer recorded.',
      justification: explanation || 'Conceptual answer evaluated.',
      modelAnswer,
    };
  }

  // Count key matches
  let matchedCount = 0;
  for (const kw of targetKeywords) {
    if (studentTokens.has(kw)) {
      matchedCount++;
    } else {
      // Fuzzy substring check (e.g. "translating" matches "translate")
      for (const st of studentTokens) {
        if (st.includes(kw) || kw.includes(st)) {
          matchedCount += 0.8;
          break;
        }
      }
    }
  }

  const matchRatio = matchedCount / targetKeywords.length;

  if (matchRatio >= 0.65) {
    // High conceptual match: 85% to 95% credit (e.g. 2.6 out of 3 or 0.9 out of 1)
    const earned = Math.round(maxPoints * 0.90 * 10) / 10;
    return {
      pointsEarned: earned,
      isCorrect: true,
      feedback: `Strong conceptual grasp! You explained the core Operating Systems mechanism thoroughly (${earned}/${maxPoints} pts).`,
      justification: explanation || `Good coverage of key concepts (${targetKeywords.slice(0, 4).join(', ')}). Expected model answer: "${modelAnswer}"`,
      modelAnswer,
    };
  } else if (matchRatio >= 0.40) {
    // Moderate match: 70% to 75% credit (e.g. 2.1 to 2.5 out of 3 or 0.7 out of 1)
    const earned = Math.round(maxPoints * 0.72 * 10) / 10;
    return {
      pointsEarned: earned,
      isCorrect: true,
      feedback: `Partially correct! Captured key mechanisms with slight technical omissions (${earned}/${maxPoints} pts).`,
      justification: explanation || `Identified key mechanisms. Complete expected model answer: "${modelAnswer}"`,
      modelAnswer,
    };
  } else if (matchRatio >= 0.20) {
    // Minor alignment: 35% to 40% credit (e.g. 1.2 out of 3 or 0.4 out of 1)
    const earned = Math.round(maxPoints * 0.38 * 10) / 10;
    return {
      pointsEarned: earned,
      isCorrect: false,
      feedback: `Incomplete. Touches upon related terms but misses the primary technical mechanism (${earned}/${maxPoints} pts).`,
      justification: explanation || `Incomplete concept coverage. Correct answer: "${modelAnswer}"`,
      modelAnswer,
    };
  } else {
    // Off target: 0 credit
    return {
      pointsEarned: 0,
      isCorrect: false,
      feedback: 'Answer does not demonstrate the expected Operating Systems concept.',
      justification: explanation || `Expected answer: "${modelAnswer}"`,
      modelAnswer,
    };
  }
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
      justification: question.explanation || 'No answer submitted for this question.',
      modelAnswer: (question as any).acceptedAnswers?.[0] || 'Unanswered',
    };
  }

  switch (question.type) {
    case 'mcq-single': {
      const correctOption = question.options.find(opt => opt.isCorrect);
      const isCorrect = correctOption ? String(studentAnswer) === String(correctOption.id) : false;
      const modelAnswer = correctOption?.text || '';
      return {
        questionId: question.id,
        isCorrect,
        pointsEarned: isCorrect ? maxPoints : 0,
        maxPoints,
        feedback: isCorrect ? 'Correct choice!' : `Incorrect. The correct answer is: "${modelAnswer}"`,
        justification: question.explanation || (isCorrect ? 'Correct choice based on OS principles.' : `Correct option: "${modelAnswer}"`),
        modelAnswer,
      };
    }

    case 'mcq-multi': {
      const correctOptions = question.options.filter(opt => opt.isCorrect);
      const correctIds = new Set(correctOptions.map(opt => String(opt.id)));
      const studentIds = new Set(
        Array.isArray(studentAnswer) ? studentAnswer.map(String) : [String(studentAnswer)]
      );
      const modelAnswer = correctOptions.map(o => o.text).join(', ');

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
        const pointsEarned = Math.round(ratio * maxPoints * 10) / 10;
        const isCorrect = pointsEarned === maxPoints;

        return {
          questionId: question.id,
          isCorrect,
          pointsEarned,
          maxPoints,
          feedback: isCorrect ? 'All correct options selected!' : `Partial credit: ${pointsEarned}/${maxPoints} points.`,
          justification: question.explanation || `Correct selections: ${modelAnswer}`,
          modelAnswer,
        };
      } else {
        const isExactMatch =
          correctIds.size === studentIds.size &&
          Array.from(correctIds).every(id => studentIds.has(id));

        return {
          questionId: question.id,
          isCorrect: isExactMatch,
          pointsEarned: isExactMatch ? maxPoints : 0,
          maxPoints,
          feedback: isExactMatch ? 'All correct options selected!' : 'One or more options were missing or incorrect.',
          justification: question.explanation || `All correct options: ${modelAnswer}`,
          modelAnswer,
        };
      }
    }

    case 'true-false': {
      const boolAnswer = typeof studentAnswer === 'boolean' 
        ? studentAnswer 
        : String(studentAnswer).toLowerCase() === 'true';
      const isCorrect = boolAnswer === question.correctAnswer;
      const modelAnswer = question.correctAnswer ? 'True' : 'False';
      return {
        questionId: question.id,
        isCorrect,
        pointsEarned: isCorrect ? maxPoints : 0,
        maxPoints,
        feedback: isCorrect ? 'Correct!' : `Incorrect. The statement is ${modelAnswer}.`,
        justification: question.explanation || `Statement is verified to be ${modelAnswer}.`,
        modelAnswer,
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
          feedback: 'Answer must be a valid numeric value.',
          justification: question.explanation || `Expected numerical value: ${question.correctValue}`,
          modelAnswer: String(question.correctValue),
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
        feedback: isCorrect ? 'Correct numerical calculation!' : `Incorrect. Expected ${question.correctValue} (tolerance ±${tolerance}).`,
        justification: question.explanation || `Correct value: ${question.correctValue} with tolerance ±${tolerance}.`,
        modelAnswer: String(question.correctValue),
      };
    }

    case 'short-text': {
      const evalText = evaluateTextualSemantic(
        String(studentAnswer),
        question.acceptedAnswers,
        question.explanation,
        maxPoints,
        question.caseSensitive
      );
      return {
        questionId: question.id,
        isCorrect: evalText.isCorrect,
        pointsEarned: evalText.pointsEarned,
        maxPoints,
        feedback: evalText.feedback,
        justification: evalText.justification,
        modelAnswer: evalText.modelAnswer,
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
      const pointsEarned = Math.round(ratio * maxPoints * 10) / 10;
      const isCorrect = matchingPositions === expectedIds.length;
      const modelAnswer = sortedItems.map(it => it.text).join(' → ');

      return {
        questionId: question.id,
        isCorrect,
        pointsEarned,
        maxPoints,
        feedback: isCorrect ? 'Sequence perfectly ordered!' : `Position score: ${pointsEarned}/${maxPoints} points.`,
        justification: question.explanation || `Correct sequence order: ${modelAnswer}`,
        modelAnswer,
      };
    }

    case 'matching': {
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
      const pointsEarned = Math.round(ratio * maxPoints * 10) / 10;
      const isCorrect = matchedCount === pairs.length;
      const modelAnswer = pairs.map(p => `${p.left} ➔ ${p.right}`).join(', ');

      return {
        questionId: question.id,
        isCorrect,
        pointsEarned,
        maxPoints,
        feedback: isCorrect ? 'All pairs accurately matched!' : `Matched ${matchedCount} of ${pairs.length} pairs.`,
        justification: question.explanation || `Expected pairs: ${modelAnswer}`,
        modelAnswer,
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
          justification: 'Hardware simulation engine unavailable.',
          modelAnswer: 'Simulation calculation',
        };
      }
      const state = plugin.generateState(question.scenarioConfig);
      const scenarioRes = plugin.evaluate(state, studentAnswer, question.scenarioConfig);
      const pointsEarned = Math.round(scenarioRes.score * maxPoints * 10) / 10;

      return {
        questionId: question.id,
        isCorrect: scenarioRes.isCorrect,
        pointsEarned,
        maxPoints,
        stepDetails: scenarioRes.stepResults,
        feedback: scenarioRes.overallExplanation || (scenarioRes.isCorrect ? 'Scenario resolved with high fidelity!' : 'Calculation or step mismatch detected.'),
        justification: question.explanation || scenarioRes.overallExplanation || 'Hardware simulation calculation results.',
        modelAnswer: 'Calculated simulation output',
      };
    }

    case 'confidence':
    case 'feedback':
      return {
        questionId: question.id,
        isCorrect: true,
        pointsEarned: maxPoints,
        maxPoints,
        feedback: 'Response recorded.',
        justification: 'Metacognitive response acknowledged.',
        modelAnswer: 'Open-ended feedback',
      };

    default: {
      const fallbackId = (question as any)?.id || 'unknown';
      return {
        questionId: fallbackId,
        isCorrect: false,
        pointsEarned: 0,
        maxPoints,
        feedback: 'Unknown question format.',
        justification: 'Could not evaluate.',
        modelAnswer: 'N/A',
      };
    }
  }
}
