import React from 'react';

export interface ScenarioVisualizerProps<TState, TInput> {
  state: TState;
  input: TInput;
  onChange: (newInput: TInput) => void;
  isReadOnly?: boolean;
  showExplanation?: boolean;
  evaluation?: ScenarioEvaluationResult;
}

export interface ScenarioConfigEditorProps<TConfig> {
  config: TConfig;
  onChange: (newConfig: TConfig) => void;
}

export interface ScenarioEvaluationResult {
  isCorrect: boolean;
  score: number;
  maxScore: number;
  percentage: number;
  stepResults: Array<{
    stepKey: string;
    stepTitle: string;
    studentValue: any;
    expectedValue: any;
    isCorrect: boolean;
    explanation?: string;
  }>;
  overallExplanation: string;
}

export interface IScenarioPlugin<TConfig = any, TState = any, TInput = any> {
  type: string;
  name: string;
  description: string;
  category: string; // e.g. "Memory Management", "Storage / I/O", "Process Scheduling"
  
  defaultConfig: TConfig;
  generateState: (config: TConfig, seed?: string | number) => TState;
  evaluate: (state: TState, input: TInput, config: TConfig) => ScenarioEvaluationResult;
  explain: (state: TState, config: TConfig) => string;
  
  Visualizer: React.ComponentType<ScenarioVisualizerProps<TState, TInput>>;
  ConfigEditor?: React.ComponentType<ScenarioConfigEditorProps<TConfig>>;
}
