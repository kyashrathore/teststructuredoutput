"use client";
import React, { useState } from "react";
import StressTestForm from "@/app/components/StressTestForm";
import ResultsDisplay from "@/app/components/results/ResultsDisplay";
import { Brain } from "lucide-react";
import { useTestStore } from "@/app/store/testStore";

interface StressTestPageProps {
  testName?: string;
}

const StressTestPage: React.FC<StressTestPageProps> = ({ testName }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveTestResults = useTestStore((state) => state.saveTestResults);

  const handleRunTest = async (testParams: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testParams),
        next: { revalidate: 0 },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      saveTestResults(
        {
          testName: testParams.testName,
          models: testParams.models,
          schema: testParams.schema,
          userPrompt: testParams.userPrompt,
          callTimes: testParams.callTimes,
        },
        testParams.systemPrompt,
        data.results
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
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-slate-800">
            AI Model Stress Test
          </h1>
        </div>
        <p className="text-slate-600 max-w-3xl">
          Test multiple AI models with parallel calls and compare their
          performance in generating structured outputs that match your specified
          Zod schema.
        </p>
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

          {/* Always render ResultsDisplay. It will use global state for results */}
          <ResultsDisplay />

          {isLoading && (
            <div className="h-96 flex items-center justify-center bg-white border border-slate-200 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <h3 className="text-xl font-medium text-slate-700">
                  Running tests...
                </h3>
                <p className="text-slate-500 mt-2">
                  This may take a few moments.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StressTestPage;
