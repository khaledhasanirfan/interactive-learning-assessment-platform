'use client';

import React from 'react';
import { Question } from '@/lib/validations/question';
import { Badge } from '@/components/ui/badge';
import PagingVisualizer from '@/components/scenarios/PagingVisualizer';
import DiskVisualizer from '@/components/scenarios/DiskVisualizer';
import { 
  generatePagingState, 
  PagingConfig, 
  PagingStudentInput 
} from '@/lib/scenarios/paging';
import { 
  generateDiskState, 
  DiskConfig, 
  DiskStudentInput 
} from '@/lib/scenarios/disk';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

export interface QuestionRendererProps {
  question: Question;
  answer: any;
  onChange: (newAnswer: any) => void;
  isReadOnly?: boolean;
  showSolution?: boolean;
  evaluation?: {
    isCorrect: boolean;
    pointsEarned: number;
    maxPoints: number;
    feedback?: string;
    stepDetails?: any;
  };
}

export function QuestionRenderer({
  question,
  answer,
  onChange,
  isReadOnly = false,
  showSolution = false,
  evaluation,
}: QuestionRendererProps) {
  const difficultyVariants: Record<string, 'success' | 'warning' | 'danger'> = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger',
  };

  return (
    <div className="space-y-4">
      {/* Question Header & Meta */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <Badge variant={difficultyVariants[question.difficulty] || 'default'}>
            {question.difficulty.toUpperCase()}
          </Badge>
          <Badge variant="default">{question.topic}</Badge>
          {question.subtopic && <Badge variant="info">{question.subtopic}</Badge>}
        </div>
        <div className="text-xs font-semibold text-slate-500">
          {question.points} {question.points === 1 ? 'Point' : 'Points'}
        </div>
      </div>

      {/* Prompt & Title */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 leading-snug">
          {question.prompt}
        </h3>
        {question.description && (
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            {question.description}
          </p>
        )}
      </div>

      {/* Dynamic Question Type Form Elements */}
      <div className="pt-2">
        {/* 1. MCQ Single */}
        {question.type === 'mcq-single' && (
          <div className="space-y-2.5">
            {question.options.map((option) => {
              const isSelected = String(answer) === String(option.id);
              const isCorrectOption = showSolution && option.isCorrect;
              const isWrongSelection = showSolution && isSelected && !option.isCorrect;

              return (
                <label
                  key={option.id}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm transition-all cursor-pointer ${
                    isCorrectOption
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                      : isWrongSelection
                      ? 'bg-rose-50 border-rose-300 text-rose-950'
                      : isSelected
                      ? 'bg-blue-50 border-blue-500 text-blue-950 ring-1 ring-blue-500 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  } ${isReadOnly ? 'pointer-events-none' : ''}`}
                >
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    value={option.id}
                    checked={isSelected}
                    disabled={isReadOnly}
                    onChange={() => onChange(option.id)}
                    className="mt-0.5 h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span>{option.text}</span>
                    {isCorrectOption && (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Correct Answer
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {/* 2. MCQ Multi */}
        {question.type === 'mcq-multi' && (
          <div className="space-y-2.5">
            <p className="text-xs text-slate-500 italic mb-2">
              Select all correct options.
            </p>
            {question.options.map((option) => {
              const selectedList = Array.isArray(answer) ? answer.map(String) : [];
              const isSelected = selectedList.includes(String(option.id));
              const isCorrectOption = showSolution && option.isCorrect;

              const toggleSelection = () => {
                if (isReadOnly) return;
                if (isSelected) {
                  onChange(selectedList.filter(id => id !== String(option.id)));
                } else {
                  onChange([...selectedList, String(option.id)]);
                }
              };

              return (
                <label
                  key={option.id}
                  onClick={toggleSelection}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm transition-all cursor-pointer ${
                    isCorrectOption
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                      : isSelected
                      ? 'bg-blue-50 border-blue-500 text-blue-950 ring-1 ring-blue-500 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  } ${isReadOnly ? 'pointer-events-none' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    disabled={isReadOnly}
                    className="mt-0.5 h-4 w-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span>{option.text}</span>
                    {isCorrectOption && (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {/* 3. True / False */}
        {question.type === 'true-false' && (
          <div className="grid grid-cols-2 gap-3 max-w-xs">
            {[true, false].map((val) => {
              const isSelected = answer === val;
              const isCorrectVal = showSolution && question.correctAnswer === val;

              return (
                <button
                  key={String(val)}
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => onChange(val)}
                  className={`p-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                    isCorrectVal
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {val ? 'True' : 'False'}
                </button>
              );
            })}
          </div>
        )}

        {/* 4. Numeric Answer */}
        {question.type === 'numeric' && (
          <div className="max-w-sm space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="any"
                disabled={isReadOnly}
                placeholder="Enter numerical value"
                value={answer ?? ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
              {question.unit && (
                <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
                  {question.unit}
                </span>
              )}
            </div>
            {showSolution && (
              <p className="text-xs text-emerald-700 font-medium">
                Correct value: {question.correctValue} {question.unit || ''} (tolerance: ±{question.tolerance})
              </p>
            )}
          </div>
        )}

        {/* 5. Short Text Answer */}
        {question.type === 'short-text' && (
          <div className="max-w-md space-y-2">
            <input
              type="text"
              disabled={isReadOnly}
              placeholder="Type your answer here..."
              value={answer ?? ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            {showSolution && (
              <p className="text-xs text-emerald-700 font-medium">
                Accepted answers: {question.acceptedAnswers.join(', ')}
              </p>
            )}
          </div>
        )}

        {/* 6. Ordering / Sequencing */}
        {question.type === 'ordering' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 italic mb-2">
              Arrange items in sequence using the order numbers:
            </p>
            {question.items.map((item, idx) => {
              const currentList = Array.isArray(answer) ? answer : question.items.map(i => i.id);
              const positionInAnswer = currentList.indexOf(item.id);

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl text-sm"
                >
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    {positionInAnswer >= 0 ? positionInAnswer + 1 : idx + 1}
                  </span>
                  <span className="flex-1 text-slate-800">{item.text}</span>
                  {!isReadOnly && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={positionInAnswer <= 0}
                        onClick={() => {
                          const copy = [...currentList];
                          const temp = copy[positionInAnswer - 1];
                          copy[positionInAnswer - 1] = copy[positionInAnswer];
                          copy[positionInAnswer] = temp;
                          onChange(copy);
                        }}
                        className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded disabled:opacity-30 cursor-pointer"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={positionInAnswer >= currentList.length - 1}
                        onClick={() => {
                          const copy = [...currentList];
                          const temp = copy[positionInAnswer + 1];
                          copy[positionInAnswer + 1] = copy[positionInAnswer];
                          copy[positionInAnswer] = temp;
                          onChange(copy);
                        }}
                        className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded disabled:opacity-30 cursor-pointer"
                      >
                        ▼
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 7. Matching */}
        {question.type === 'matching' && (
          <div className="space-y-3">
            {question.pairs.map((pair) => {
              const currentMatch = answer?.[pair.id] || '';
              return (
                <div key={pair.id} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center p-3 bg-white border border-slate-200 rounded-xl">
                  <div className="text-sm font-semibold text-slate-800">
                    {pair.left}
                  </div>
                  <select
                    disabled={isReadOnly}
                    value={currentMatch}
                    onChange={(e) => {
                      onChange({
                        ...answer,
                        [pair.id]: e.target.value,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="">-- Select matching definition --</option>
                    {question.pairs.map((p) => (
                      <option key={p.id} value={p.right}>
                        {p.right}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}

        {/* 8. Interactive Scenario */}
        {question.type === 'scenario' && (
          <div className="pt-2">
            {question.scenarioType === 'paging-translation' && (
              <PagingVisualizer
                state={generatePagingState(question.scenarioConfig as PagingConfig)}
                input={answer as PagingStudentInput}
                onChange={onChange}
                isReadOnly={isReadOnly}
                showExplanation={showSolution}
                evaluation={evaluation?.stepDetails ? {
                  isCorrect: evaluation.isCorrect,
                  score: evaluation.pointsEarned,
                  maxScore: evaluation.maxPoints,
                  percentage: Math.round((evaluation.pointsEarned / evaluation.maxPoints) * 100),
                  stepResults: evaluation.stepDetails,
                  overallExplanation: evaluation.feedback || '',
                } : undefined}
              />
            )}

            {question.scenarioType === 'disk-scheduling' && (
              <DiskVisualizer
                state={generateDiskState(question.scenarioConfig as DiskConfig)}
                input={answer as DiskStudentInput}
                onChange={onChange}
                isReadOnly={isReadOnly}
                showExplanation={showSolution}
                evaluation={evaluation?.stepDetails ? {
                  isCorrect: evaluation.isCorrect,
                  score: evaluation.pointsEarned,
                  maxScore: evaluation.maxPoints,
                  percentage: Math.round((evaluation.pointsEarned / evaluation.maxPoints) * 100),
                  stepResults: evaluation.stepDetails,
                  overallExplanation: evaluation.feedback || '',
                } : undefined}
              />
            )}
          </div>
        )}

        {/* 9. Confidence Rating (1-5 Likert scale) */}
        {question.type === 'confidence' && (
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2 max-w-md">
              {[1, 2, 3, 4, 5].map((level) => {
                const labels = ['', 'Very Unsure', 'Unsure', 'Neutral', 'Confident', 'Very Confident'];
                const isSelected = answer === level;
                return (
                  <button
                    key={level}
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => onChange(level)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base font-bold">{level}</span>
                    <span className="text-[10px] mt-1 line-clamp-1">{labels[level]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 10. Qualitative Feedback */}
        {question.type === 'feedback' && (
          <div className="max-w-xl space-y-1.5">
            <textarea
              rows={3}
              disabled={isReadOnly}
              placeholder={question.placeholder || 'Your reflection...'}
              value={answer ?? ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Pedagogical Explanation Card */}
      {showSolution && question.explanation && (
        <div className="mt-4 p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1.5">
          <div className="font-semibold flex items-center gap-1.5 text-emerald-900">
            <HelpCircle className="h-4 w-4 text-emerald-600" />
            Instructor Pedagogical Explanation:
          </div>
          <p className="leading-relaxed whitespace-pre-line">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
