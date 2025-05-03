"use client";
import React, { useState, useEffect } from "react";
import StressTestForm from "@/app/components/StressTestForm";
import ResultsDisplay from "@/app/components/results/ResultsDisplay";
import { Brain } from "lucide-react";
import { useTestStore } from "@/app/store/testStore";
import Link from "next/link";
import runStressTest from "./utils/runStressTest";

interface StressTestPageProps {
  testName?: string;
}

const StressTestPage: React.FC<StressTestPageProps> = ({ testName }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveTestResults = useTestStore((state) => state.saveTestResults);
  const saveTestError = useTestStore((state) => state.saveTestError);

  const selectedTestId = useTestStore((state) => state.selectedTestId);
  console.log({ selectedTestId });
  const openRouterKey = useTestStore((state) => state.openRouterKey);

  const handleRunTest = async (testParams: any) => {
    setIsLoading(true);
    setError(null);

    try {
      // Initialize the test in the store (empty results)
      saveTestResults(
        {
          testName: testParams.testName,
          schema: testParams.schema,
          userPrompt: testParams.userPrompt,
        },
        testParams.systemPrompt,
        testParams.models,
        testParams.callTimes,
        []
      );

      // Incrementally add results as they arrive
      await runStressTest(
        testParams,
        openRouterKey ?? "",
        (modelName, callResult) => {
          // Add each call result to the store
          useTestStore
            .getState()
            .addCallResult(
              testParams.testName,
              testParams.schema,
              testParams.userPrompt,
              testParams.systemPrompt,
              modelName,
              callResult
            );
        }
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/">
            <Brain className=" text-blue-500" />
          </Link>
          <h1 className="text-xl font-bold text-slate-800">
          Structured output test
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <StressTestForm
            onSubmit={handleRunTest}
            isLoading={isLoading}
            testName={testName}
          />
        </div>

        <div className="lg:col-span-7">
          {error && (
            <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}

          {saveTestError && (
            <div className="p-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
              <p className="font-medium">Warning</p>
              <p>{saveTestError}</p>
            </div>
          )}

          {/* Always render ResultsDisplay. It will use global state for results */}
          <ResultsDisplay />

        </div>
      </div>
    </div>
  );
};

export default StressTestPage;
