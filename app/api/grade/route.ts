import { NextRequest, NextResponse } from 'next/server';
import { evaluateQuestionAnswer } from '@/lib/grading';
import { Question } from '@/lib/validations/question';
import sampleBank from '@/examples/os-question-bank.json';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questions, answers, quizId } = body;

    if (!Array.isArray(questions) || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Invalid payload: questions array and answers map required.' },
        { status: 400 }
      );
    }

    let totalScore = 0;
    let maxScore = 0;
    const itemEvaluations: Record<string, any> = {};

    for (const q of questions as Question[]) {
      const studentAns = answers[q.id];
      const res = evaluateQuestionAnswer(q, studentAns);
      totalScore += res.pointsEarned;
      maxScore += res.maxPoints;
      itemEvaluations[q.id] = res;
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    return NextResponse.json({
      quizId,
      score: totalScore,
      maxScore,
      percentage,
      itemEvaluations,
      evaluatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server grading error' }, { status: 500 });
  }
}
