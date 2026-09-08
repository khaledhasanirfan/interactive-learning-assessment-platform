import { NextRequest, NextResponse } from 'next/server';
import { QuestionSchema } from '@/lib/validations/question';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawQuestions = Array.isArray(body) ? body : body.questions;

    if (!Array.isArray(rawQuestions)) {
      return NextResponse.json(
        { error: 'Body must be an array of questions or contain a "questions" array.' },
        { status: 400 }
      );
    }

    const validated: any[] = [];
    const errors: string[] = [];

    rawQuestions.forEach((item, index) => {
      if (!item.id) item.id = `q-${Date.now()}-${index}`;
      const parsed = QuestionSchema.safeParse(item);
      if (parsed.success) {
        validated.push(parsed.data);
      } else {
        errors.push(`Question #${index + 1} (${item.title || 'Untitled'}): ${parsed.error.errors.map(e => e.message).join('; ')}`);
      }
    });

    return NextResponse.json({
      validCount: validated.length,
      invalidCount: errors.length,
      questions: validated,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Import parsing error' }, { status: 500 });
  }
}
