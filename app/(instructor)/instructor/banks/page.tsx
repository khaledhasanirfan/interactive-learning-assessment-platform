'use client';

import React, { useState, useEffect } from 'react';
import { Repository } from '@/lib/firebase/repository';
import { QuestionBank, Question, QuestionSchema } from '@/lib/validations/question';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { QuestionRenderer } from '@/components/questions/QuestionRenderer';
import sampleBankData from '@/examples/os-question-bank.json';
import { 
  Upload, 
  Download, 
  Plus, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Search,
  Eye,
  Trash2
} from 'lucide-react';

export default function QuestionBanksPage() {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [activeBank, setActiveBank] = useState<QuestionBank | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');

  // Preview Question Modal
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [parsedImportQuestions, setParsedImportQuestions] = useState<Question[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [selectedImportIds, setSelectedImportIds] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    async function load() {
      const bankList = await Repository.getQuestionBanks();
      setBanks(bankList);
      if (bankList.length > 0) {
        setActiveBank(bankList[0]!);
      }
    }
    load();
  }, []);

  // Filtered question list
  const questions = activeBank?.questions || [];
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypeFilter === 'all' || q.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  // Handle JSON Text Validation
  const handleValidateJson = (text: string) => {
    setImportJsonText(text);
    setImportErrors([]);
    setParsedImportQuestions([]);

    if (!text.trim()) return;

    try {
      const parsed = JSON.parse(text);
      const rawList = Array.isArray(parsed) ? parsed : parsed.questions;

      if (!Array.isArray(rawList)) {
        setImportErrors(['JSON must be an array of questions or an object containing a "questions" array.']);
        return;
      }

      const validList: Question[] = [];
      const errList: string[] = [];

      rawList.forEach((item, idx) => {
        // Assign ID if missing
        if (!item.id) item.id = `imp-${Date.now()}-${idx}`;
        const result = QuestionSchema.safeParse(item);
        if (result.success) {
          validList.push(result.data);
        } else {
          errList.push(`Item #${idx + 1} (${item.title || 'Untitled'}): ${result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
        }
      });

      setImportErrors(errList);
      setParsedImportQuestions(validList);
      setSelectedImportIds(new Set(validList.map(q => q.id)));
    } catch (e: any) {
      setImportErrors([`JSON Syntax Error: ${e.message}`]);
    }
  };

  const handleLoadSampleBank = () => {
    handleValidateJson(JSON.stringify(sampleBankData, null, 2));
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([JSON.stringify(sampleBankData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'os-question-bank-template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExecuteImport = async () => {
    if (!activeBank) return;
    setIsImporting(true);
    try {
      const questionsToImport = parsedImportQuestions.filter(q => selectedImportIds.has(q.id));
      const existingIds = new Set(activeBank.questions.map(q => q.id));
      
      // Duplicate detection & overwrite or append
      const updatedQuestions = [...activeBank.questions];
      questionsToImport.forEach(q => {
        const existingIdx = updatedQuestions.findIndex(eq => eq.id === q.id);
        if (existingIdx >= 0) {
          updatedQuestions[existingIdx] = q;
        } else {
          updatedQuestions.push(q);
        }
      });

      const updatedBank: QuestionBank = {
        ...activeBank,
        questions: updatedQuestions,
        updatedAt: new Date().toISOString(),
      };

      await Repository.saveQuestionBank(updatedBank);
      setActiveBank(updatedBank);
      setIsImportModalOpen(false);
      setImportJsonText('');
      setParsedImportQuestions([]);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Curriculum Authoring
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Question Banks &amp; AI Import
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active Bank: <strong className="text-slate-800">{activeBank?.title || 'Master OS Bank'}</strong> ({questions.length} total questions)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" onClick={handleDownloadTemplate} className="gap-1.5 text-xs">
            <Download className="h-4 w-4" /> Download JSON Schema
          </Button>
          <Button onClick={() => setIsImportModalOpen(true)} className="gap-1.5 text-xs">
            <Upload className="h-4 w-4" /> Import Questions (JSON / AI)
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search questions by prompt, title, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Filter Type:</span>
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Types ({questions.length})</option>
            <option value="mcq-single">Single MCQ</option>
            <option value="mcq-multi">Multiple Select</option>
            <option value="numeric">Numeric Answer</option>
            <option value="scenario">Interactive Scenario</option>
            <option value="true-false">True / False</option>
            <option value="ordering">Ordering / Sequence</option>
            <option value="matching">Matching</option>
            <option value="confidence">Confidence Rating</option>
            <option value="feedback">Open Feedback</option>
          </select>
        </div>
      </div>

      {/* Questions Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4 pl-6">Question Title &amp; Prompt</th>
                <th className="p-4">Type</th>
                <th className="p-4">Topic</th>
                <th className="p-4">Difficulty</th>
                <th className="p-4">Points</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 pl-6 max-w-md">
                      <div className="font-semibold text-slate-900 line-clamp-1">{q.title}</div>
                      <div className="text-slate-500 line-clamp-1 mt-0.5">{q.prompt}</div>
                    </td>
                    <td className="p-4">
                      <Badge variant="default" className="font-mono text-[10px]">
                        {q.type}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-700 font-medium">{q.topic}</span>
                      {q.subtopic && <span className="text-slate-400 block text-[11px]">{q.subtopic}</span>}
                    </td>
                    <td className="p-4">
                      <Badge variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'medium' ? 'warning' : 'danger'}>
                        {q.difficulty}
                      </Badge>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-700">
                      {q.points} pts
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewQuestion(q)}
                        className="gap-1 text-[11px]"
                      >
                        <Eye className="h-3 w-3" /> Preview
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No questions match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Question Preview Modal */}
      {previewQuestion && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewQuestion(null)}
          title={`Preview Question: ${previewQuestion.title}`}
          size="lg"
        >
          <div className="p-2">
            <QuestionRenderer
              question={previewQuestion}
              answer={previewQuestion.type === 'mcq-single' ? (previewQuestion as any).options?.find((o: any) => o.isCorrect)?.id : undefined}
              onChange={() => {}}
              showSolution={true}
            />
          </div>
        </Modal>
      )}

      {/* Question Bank Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Questions (JSON / Gemini Notebook Output)"
        description="Paste JSON generated from lecture slides, Gemini, or upload a formatted bank file."
        size="xl"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-semibold">Paste Question Bank JSON:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadSampleBank}
              className="gap-1 text-[11px]"
            >
              <FileCode className="h-3 w-3 text-blue-600" /> Load Sample OS Question Bank
            </Button>
          </div>

          <textarea
            rows={8}
            placeholder={`{\n  "questions": [\n    {\n      "id": "q1",\n      "type": "mcq-single",\n      "title": "Page Size",\n      "prompt": "What is...",\n      "topic": "Paging",\n      ...\n    }\n  ]\n}`}
            value={importJsonText}
            onChange={(e) => handleValidateJson(e.target.value)}
            className="w-full p-3 font-mono text-xs bg-slate-950 text-slate-200 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Validation Status & Error Report */}
          {importErrors.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-800">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                Validation Errors ({importErrors.length})
              </div>
              <ul className="list-disc pl-5 space-y-0.5 max-h-32 overflow-y-auto text-[11px]">
                {importErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Validated Question Preview Table */}
          {parsedImportQuestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Validated Successfully: {parsedImportQuestions.length} Questions Ready
                </span>
                <span className="text-[11px] text-slate-500">
                  {selectedImportIds.size} selected
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                    <tr>
                      <th className="p-2.5 pl-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedImportIds.size === parsedImportQuestions.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedImportIds(new Set(parsedImportQuestions.map(q => q.id)));
                            } else {
                              setSelectedImportIds(new Set());
                            }
                          }}
                        />
                      </th>
                      <th className="p-2.5">Title</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Topic</th>
                      <th className="p-2.5">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedImportQuestions.map((q) => {
                      const isSelected = selectedImportIds.has(q.id);
                      return (
                        <tr key={q.id} className={isSelected ? 'bg-blue-50/30' : ''}>
                          <td className="p-2.5 pl-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const next = new Set(selectedImportIds);
                                if (e.target.checked) next.add(q.id);
                                else next.delete(q.id);
                                setSelectedImportIds(next);
                              }}
                            />
                          </td>
                          <td className="p-2.5 font-medium text-slate-800">{q.title}</td>
                          <td className="p-2.5 font-mono text-[10px] text-slate-500">{q.type}</td>
                          <td className="p-2.5 text-slate-600">{q.topic}</td>
                          <td className="p-2.5 font-mono">{q.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              disabled={isImporting}
              onClick={() => setIsImportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={selectedImportIds.size === 0 || isImporting}
              isLoading={isImporting}
              onClick={handleExecuteImport}
              className="gap-1.5"
            >
              Import {selectedImportIds.size} Questions
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
