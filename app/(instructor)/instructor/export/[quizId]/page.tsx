'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Repository } from '@/lib/firebase/repository';
import { Quiz } from '@/lib/validations/quiz';
import { Attempt, StudentResponse } from '@/lib/validations/attempt';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  ArrowLeft, 
  FileSpreadsheet, 
  ShieldCheck, 
  Copy, 
  Check, 
  Clock 
} from 'lucide-react';

export default function ExportQuizPage() {
  const params = useParams();
  const quizId = params?.quizId as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [responsesMap, setResponsesMap] = useState<Record<string, StudentResponse[]>>({});
  const [loading, setLoading] = useState(true);

  // Export options
  const [pseudonymize, setPseudonymize] = useState(false);
  const [includeConfidence, setIncludeConfidence] = useState(true);
  const [includeTiming, setIncludeTiming] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const foundQuiz = await Repository.getQuizById(quizId);
        if (!foundQuiz) return;
        setQuiz(foundQuiz);

        const attList = await Repository.getAttemptsByQuiz(quizId);
        setAttempts(attList);

        const respMap: Record<string, StudentResponse[]> = {};
        for (const a of attList) {
          respMap[a.id] = await Repository.getResponses(a.id);
        }
        setResponsesMap(respMap);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [quizId]);

  // Generate CSV rows
  const generateCsvContent = (): string => {
    if (!quiz || attempts.length === 0) {
      return 'AttemptID,StudentID,Score,MaxScore,Percentage,SubmittedAt\n';
    }

    const headers = ['AttemptID', 'StudentID', 'DisplayName', 'Score', 'MaxScore', 'Percentage'];
    if (includeTiming) headers.push('AvgResponseTimeMs');
    if (includeConfidence) headers.push('AvgConfidenceRating');
    headers.push('SubmittedAt');

    const rows: string[] = [headers.join(',')];

    attempts.forEach((att, idx) => {
      const rList = responsesMap[att.id] || [];
      const studentId = pseudonymize ? `STUDENT_${String(idx + 1).padStart(3, '0')}` : att.userEmail || att.userId;
      const displayName = pseudonymize ? `Pseudonym_${idx + 1}` : `"${att.userName || 'Student'}"`;

      const totalTime = rList.reduce((acc, r) => acc + (r.responseTimeMs || 0), 0);
      const avgTime = rList.length > 0 ? Math.round(totalTime / rList.length) : 0;

      const confRatings = rList.filter(r => r.confidenceRating).map(r => r.confidenceRating as number);
      const avgConf = confRatings.length > 0 
        ? Math.round((confRatings.reduce((a, b) => a + b, 0) / confRatings.length) * 10) / 10 
        : 'N/A';

      const row = [
        att.id,
        studentId,
        displayName,
        att.score ?? 0,
        att.maxScore,
        att.percentage ?? 0,
      ];

      if (includeTiming) row.push(avgTime);
      if (includeConfidence) row.push(avgConf as any);
      row.push(att.submittedAt ? `"${att.submittedAt}"` : '""');

      rows.push(row.join(','));
    });

    return rows.join('\n');
  };

  const csvString = generateCsvContent();

  const handleDownloadCsv = () => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${quiz?.title?.replace(/[^a-zA-Z0-9]/g, '_')}_grades.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyCsv = () => {
    navigator.clipboard.writeText(csvString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !quiz) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-500">
        <Clock className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/instructor/analytics/${quiz.id}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Analytics
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Export Gradebook &amp; Response Telemetry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Target Quiz: <strong>{quiz.title}</strong> &bull; ({attempts.length} attempts ready for export)
          </p>
        </div>

        <Button onClick={handleDownloadCsv} className="gap-1.5 text-xs">
          <Download className="h-4 w-4" /> Download Gradebook CSV
        </Button>
      </div>

      {/* Privacy & Configuration Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <CardTitle>Privacy &amp; Research Export Options</CardTitle>
          </div>
          <CardDescription>
            Configure student privacy masking for IRB compliance or pedagogical research publications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={pseudonymize}
                onChange={(e) => setPseudonymize(e.target.checked)}
                className="mt-0.5 rounded text-blue-600"
              />
              <div>
                <span className="font-semibold text-slate-900 block">Pseudonymize Identifiers</span>
                <span className="text-[11px] text-slate-500">Replaces student names and emails with random IDs (e.g. STUDENT_001).</span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTiming}
                onChange={(e) => setIncludeTiming(e.target.checked)}
                className="mt-0.5 rounded text-blue-600"
              />
              <div>
                <span className="font-semibold text-slate-900 block">Include Response Times</span>
                <span className="text-[11px] text-slate-500">Includes millisecond response duration per attempt.</span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={includeConfidence}
                onChange={(e) => setIncludeConfidence(e.target.checked)}
                className="mt-0.5 rounded text-blue-600"
              />
              <div>
                <span className="font-semibold text-slate-900 block">Include Confidence Ratings</span>
                <span className="text-[11px] text-slate-500">Includes 1-5 Likert scale metacognitive calibration data.</span>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* CSV Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              <CardTitle>Generated CSV Preview</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyCsv} className="gap-1 text-xs">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy CSV Text'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto max-h-72">
            <pre className="whitespace-pre">{csvString}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
