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
  testName: string; // NEW: user-friendly test name
  models: string[];
  schema: string;
  systemPrompt: string;
  userPrompt: string;
  callTimes: number;
}

// New: System prompt variation for a test
export interface SystemPromptTest {
  id: string;                // Unique invocation ID
  systemPrompt: string;      // The system prompt text
  systemPromptHash: string;  // Hash to identify this system prompt
  models: string[];          // Models used for this variation
  callTimes: number;         // Number of calls for this variation
  results: TestResult[];     // Results for this system prompt
  createdAt: string;         // ISO string for first created
  updatedAt: string;         // ISO string for last run/updated
  runCount: number;          // How many times this prompt has been run
}

// New: Saved test with all metadata and prompt variations
export interface SavedTest {
  id: string;                // Unique identifier for the test
  testName: string;          // User-friendly name
  createdAt: string;         // ISO string for when this test was created
  schema: string;
  userPrompt: string;
  systemPrompts: SystemPromptTest[]; // All system prompt variations/results
}
