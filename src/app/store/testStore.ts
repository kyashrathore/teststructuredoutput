import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SavedTest, SystemPromptTest, TestResult } from '../types/stress-test';
import { generateHash } from '../utils/stressTestStorage';

interface TestState {
  savedTests: SavedTest[];
  selectedTestId: string | null;
  selectedPromptHashes: string[];
  latestResults: TestResult[] | null;
  editingPromptHash: string | null;
  schemaError: string | null;
  saveTestError: string | null;

  // Actions
  selectTest: (testId: string | null) => void;
  selectPromptHashes: (hashes: string[]) => void;
  setEditingPromptHash: (hash: string | null) => void;
  selectFirstTestAndPrompt: () => void;
  setSchemaError: (error: string | null) => void;
  saveTestResults: (
    test: Omit<SavedTest, "id" | "createdAt" | "systemPrompts">,
    systemPrompt: string,
    models: string[],
    callTimes: number,
    results: TestResult[]
  ) => void;
  removeTest: (testId: string) => void;
  removeSystemPrompt: (testId: string, promptHash: string) => void;
}

// Only persist plain state, not computed properties
export const useTestStore = create<TestState>()(
  persist(
    (set, get) => ({
      savedTests: [],
      selectedTestId: null,
      selectedPromptHashes: [],
      latestResults: null,
      editingPromptHash: null,
      schemaError: null,
      saveTestError: null,

      selectTest: (testId) => {
        const state = get();
        const test = state.savedTests.find(t => t.id === testId) || null;
        const selectedPromptHashes = test && test.systemPrompts.length > 0 ? [test.systemPrompts[0].systemPromptHash] : [];
        let latestResults: TestResult[] | null = null;
        if (test && selectedPromptHashes.length > 0) {
           latestResults = test.systemPrompts
            .filter(sp => selectedPromptHashes.includes(sp.systemPromptHash))
            .flatMap(sp => sp.results);
        }

        set({
          selectedTestId: testId,
          selectedPromptHashes: selectedPromptHashes,
          latestResults: latestResults,
          editingPromptHash: selectedPromptHashes.length === 1 ? selectedPromptHashes[0] : null,
        });
      },

      selectPromptHashes: (hashes) => {
        const state = get();
        const test = state.savedTests.find(t => t.id === state.selectedTestId) || null;
        let results: TestResult[] | null = null;
        if (test && hashes.length > 0) {
          results = test.systemPrompts
            .filter(sp => hashes.includes(sp.systemPromptHash))
            .flatMap(sp => sp.results);
        }
        set({
          selectedPromptHashes: hashes,
          editingPromptHash: hashes.length === 1 ? hashes[0] : null,
          latestResults: results,
        });
      },

      selectFirstTestAndPrompt: () => {
        const state = get();
        if (state.savedTests.length > 0 && state.selectedTestId === null) {
          const firstTest = state.savedTests[0];
          const selectedPromptHashes = firstTest.systemPrompts.length > 0 ? [firstTest.systemPrompts[0].systemPromptHash] : [];
           let latestResults: TestResult[] | null = null;
           if (firstTest && selectedPromptHashes.length > 0) {
              latestResults = firstTest.systemPrompts
               .filter(sp => selectedPromptHashes.includes(sp.systemPromptHash))
               .flatMap(sp => sp.results);
           }
          set({
            selectedTestId: firstTest.id,
            selectedPromptHashes: selectedPromptHashes,
            latestResults: latestResults,
            editingPromptHash: selectedPromptHashes.length === 1 ? selectedPromptHashes[0] : null,
          });
        }
      },

      setEditingPromptHash: (hash) => {
        set({ editingPromptHash: hash });
      },

      setSchemaError: (error) => {
        set({ schemaError: error });
      },

      saveTestResults: (test, systemPrompt, models, callTimes, results) => {
        let savedTests = get().savedTests.slice();
        const now = new Date().toISOString();

        // Only block if a test with the same name, schema, and userPrompt exists and you are not updating it.
        set({ saveTestError: null });

        // Find base test by testName, schema, userPrompt (no models/callTimes)
        let savedTest = savedTests.find(t =>
          t.testName === test.testName &&
          t.schema === test.schema &&
          t.userPrompt === test.userPrompt
        );

        if (!savedTest) {
          savedTest = {
            id: generateHash(test.testName + now),
            testName: test.testName,
            createdAt: now,
            schema: test.schema,
            userPrompt: test.userPrompt,
            systemPrompts: []
          };
          savedTests.push(savedTest);
        }

        const systemPromptHash = generateHash(systemPrompt);
        let systemPromptTest = savedTest.systemPrompts.find(sp => sp.systemPromptHash === systemPromptHash);

if (systemPromptTest) {
  // Aggregate new results into existing results for this schema/system prompt variation
  systemPromptTest.models = models;
  systemPromptTest.callTimes = callTimes;

  // Aggregation logic: merge by modelName, aggregate calls, recalculate stats
  const existingResults = Array.isArray(systemPromptTest.results) ? systemPromptTest.results : [];
  const aggregatedResultsMap = new Map();

  // Populate map with existing results (deep copy calls)
  existingResults.forEach(res => {
    aggregatedResultsMap.set(res.modelName, { ...res, calls: [...res.calls] });
  });

  // Process new results
  results.forEach(newResult => {
    const existingResult = aggregatedResultsMap.get(newResult.modelName);
    if (existingResult) {
      // Merge calls
      existingResult.calls.push(...newResult.calls);
      const totalCalls = existingResult.calls.length;
      const successfulCalls = existingResult.calls.filter((call: import("../types/stress-test").ModelCall) => call.successful).length;
      const totalTimeMs = existingResult.calls.reduce((sum: number, call: import("../types/stress-test").ModelCall) => sum + call.timeMs, 0);

      existingResult.averageTimeMs = totalCalls > 0 ? totalTimeMs / totalCalls : 0;
      existingResult.successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
    } else {
      // Add new model result (deep copy calls)
      aggregatedResultsMap.set(newResult.modelName, { ...newResult, calls: [...newResult.calls] });
    }
  });

  systemPromptTest.results = Array.from(aggregatedResultsMap.values());
  systemPromptTest.updatedAt = now;
  systemPromptTest.runCount += 1;

  // Ensure selection stays on the updated prompt
  set({
    savedTests,
    selectedTestId: savedTest.id,
    selectedPromptHashes: [systemPromptTest.systemPromptHash],
    latestResults: systemPromptTest.results,
    editingPromptHash: systemPromptTest.systemPromptHash,
  });
} else {
          systemPromptTest = {
            id: generateHash(systemPrompt + now),
            systemPrompt,
            systemPromptHash,
            models,
            callTimes,
            results,
            createdAt: now,
            updatedAt: now,
            runCount: 1
          };
          savedTest.systemPrompts.push(systemPromptTest);

          set({
            savedTests,
            selectedTestId: savedTest.id,
            selectedPromptHashes: [systemPromptTest.systemPromptHash],
            latestResults: results,
            editingPromptHash: systemPromptTest.systemPromptHash,
          });
        }
      },

      removeTest: (testId) => {
        let savedTests = get().savedTests.filter(t => t.id !== testId);
        set({
          savedTests,
          selectedTestId: get().selectedTestId === testId ? null : get().selectedTestId,
          selectedPromptHashes: get().selectedTestId === testId ? [] : get().selectedPromptHashes,
          latestResults: null,
          editingPromptHash: null,
        });
      },

      removeSystemPrompt: (testId, promptHash) => {
        let savedTests = get().savedTests.map(test => {
          if (test.id === testId) {
            return {
              ...test,
              systemPrompts: test.systemPrompts.filter(sp => sp.systemPromptHash !== promptHash)
            };
          }
          return test;
        });
        set({
          savedTests,
          selectedPromptHashes: get().selectedPromptHashes.filter(h => h !== promptHash),
          latestResults: null,
          editingPromptHash: null,
        });
      }
      }),
    {
        name: 'stress-test-storage',
        partialize: (state) => ({
          savedTests: state.savedTests,
          selectedTestId: state.selectedTestId,
          selectedPromptHashes: state.selectedPromptHashes,
          latestResults: state.latestResults,
          editingPromptHash: state.editingPromptHash,
          schemaError: state.schemaError,
          saveTestError: state.saveTestError,
        }),
        migrate: (persistedState: any, version) => {
          if (
            !persistedState ||
            typeof persistedState !== 'object' ||
            !Array.isArray(persistedState.savedTests)
          ) {
            return {
              savedTests: [],
              selectedTestId: null,
              selectedPromptHashes: [],
              latestResults: null,
              editingPromptHash: null,
              schemaError: null,
              saveTestError: null,
            };
          }
          return persistedState;
        },
      }
    )
  );

import { createSelector } from 'reselect';

// Basic input selectors
const getSavedTests = (state: TestState) => state.savedTests;
const getSelectedTestId = (state: TestState) => state.selectedTestId;
const getSelectedPromptHashes = (state: TestState) => state.selectedPromptHashes;
const getEditingPromptHash = (state: TestState) => state.editingPromptHash;

// Memoized selectors
export const selectSelectedTest = createSelector(
  [getSavedTests, getSelectedTestId],
  (savedTests, selectedTestId) =>
    savedTests.find(t => t.id === selectedTestId) || null
);

const EMPTY_ARRAY: SystemPromptTest[] = [];

export const selectSelectedPrompts = createSelector(
  [selectSelectedTest, getSelectedPromptHashes],
  (selectedTest, selectedPromptHashes) => {
    if (!selectedTest) return EMPTY_ARRAY;
    return selectedTest.systemPrompts.filter(sp =>
      selectedPromptHashes.includes(sp.systemPromptHash)
    );
  }
);

export const selectEditingPrompt = createSelector(
  [selectSelectedTest, getEditingPromptHash],
  (selectedTest, editingPromptHash) => {
    if (!selectedTest) return null;
    return selectedTest.systemPrompts.find(sp => sp.systemPromptHash === editingPromptHash) || null;
  }
);
