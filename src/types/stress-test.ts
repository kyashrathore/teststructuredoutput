export interface ModelCall {
  successful: boolean;
  timeMs: number;
  error?: string;
  output?: any;
}

export interface TestResult {
  modelName: string;
  calls: ModelCall[];
  averageTimeMs: number;
  successRate: number;
}

export interface StressTestRequestBody {
  models: string[];
  schema: string;
  systemPrompt: string;
  userPrompt: string;
  callTimes: number;
}