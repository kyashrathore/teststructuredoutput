import React, { useState, useEffect } from "react";
import ResultsChart from "./ResultsChart";
import ResultsSummary from "./ResultsSummary";
import ResultsTable from "./ResultsTable";
import { BarChart as ChartBar, Table, Trash2 } from "lucide-react";
import { useTestStore, selectSelectedTest, selectSelectedPrompts } from "../../store/testStore";
import { shallow } from "zustand/shallow";
import { SystemPromptTest } from "../../types/stress-test";

type ViewMode = "summary" | "detail";

const ResultsDisplay: React.FC = () => {
  const latestResults = useTestStore((state) => state.latestResults);
  const selectedTestId = useTestStore((state) => state.selectedTestId);
  const selectedPrompts = useTestStore(selectSelectedPrompts);
  const removeSystemPrompt = useTestStore((state) => state.removeSystemPrompt);
  const selectedTest = useTestStore(selectSelectedTest);

  const [viewMode, setViewMode] = useState<ViewMode>("summary");


  if (latestResults && latestResults.length > 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">
              Test Results
            </h2>
            <div className="flex space-x-2 p-1 bg-slate-100 rounded-md">
              <button
                onClick={() => setViewMode("summary")}
                className={`flex items-center px-3 py-1.5 text-sm rounded-md ${
                  viewMode === "summary"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ChartBar className="h-4 w-4 mr-1.5" />
                Summary
              </button>
              <button
                onClick={() => setViewMode("detail")}
                className={`flex items-center px-3 py-1.5 text-sm rounded-md ${
                  viewMode === "detail"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Table className="h-4 w-4 mr-1.5" />
                Details
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          {viewMode === "summary" ? (
            <>
              <ResultsSummary results={latestResults || []} />
              <div className="mt-8">
                <h3 className="text-lg font-medium text-slate-800 mb-4">
                  Performance Comparison
                </h3>
                <ResultsChart results={latestResults || []} />
              </div>
            </>
          ) : (
            <ResultsTable results={latestResults || []} />
          )}
        </div>
      </div>
    );
  }

  // Interactive results display for saved tests
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">
            Saved Test Results
          </h2>
        </div>
      </div>
      <div className="p-6">
        {selectedTest && selectedPrompts.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedPrompts.map((sp: SystemPromptTest) => (
                <div
                  key={sp.systemPromptHash}
                  className="flex items-center bg-slate-100 rounded px-2 py-1 text-xs"
                >
                  <span className="font-mono">
                    {sp.systemPrompt.length > 40
                      ? sp.systemPrompt.slice(0, 40) + "..."
                      : sp.systemPrompt}
                  </span>
                  <span className="ml-2 text-slate-500">
                    ({sp.runCount} runs)
                  </span>
                  <button
                    className="ml-2 text-red-500 hover:text-red-700"
                    title="Remove this system prompt result"
                    onClick={() =>
                      removeSystemPrompt(selectedTest.id, sp.systemPromptHash)
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex space-x-2 p-1 bg-slate-100 rounded-md">
                <button
                  onClick={() => setViewMode("summary")}
                  className={`flex items-center px-3 py-1.5 text-sm rounded-md ${
                    viewMode === "summary"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ChartBar className="h-4 w-4 mr-1.5" />
                  Summary
                </button>
                <button
                  onClick={() => setViewMode("detail")}
                  className={`flex items-center px-3 py-1.5 text-sm rounded-md ${
                    viewMode === "detail"
                      ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Table className="h-4 w-4 mr-1.5" />
                  Details
                </button>
              </div>
            </div>
            {viewMode === "summary" ? (
              <>
                <ResultsSummary results={latestResults || []} />
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-slate-800 mb-4">
                    Performance Comparison
                  </h3>
                  <ResultsChart results={latestResults || []} />
                </div>
              </>
            ) : (
              <ResultsTable results={latestResults || []} />
            )}
          </>
        ) : (
          <div className="text-slate-500 text-center py-12">
            <p>
              Select a test and one or more system prompt variations to compare
              results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsDisplay;
