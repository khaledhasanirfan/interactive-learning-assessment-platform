import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/firebase/repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('quizId') || 'quiz-vm-assessment';
    const pseudonymize = searchParams.get('pseudonymize') === 'true';

    const quiz = await Repository.getQuizById(quizId);
    const attempts = await Repository.getAttemptsByQuiz(quizId);

    const headers = ['AttemptID', 'StudentID', 'Score', 'MaxScore', 'Percentage', 'SubmittedAt'];
    const lines = [headers.join(',')];

    attempts.forEach((att, idx) => {
      const studentId = pseudonymize ? `STUDENT_${String(idx + 1).padStart(3, '0')}` : att.userEmail || att.userId;
      lines.push([
        att.id,
        studentId,
        att.score ?? 0,
        att.maxScore,
        att.percentage ?? 0,
        att.submittedAt ? `"${att.submittedAt}"` : '""',
      ].join(','));
    });

    const csvContent = lines.join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${quiz?.title?.replace(/[^a-zA-Z0-9]/g, '_')}_grades.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Export error' }, { status: 500 });
  }
}
