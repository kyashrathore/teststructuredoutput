"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTestStore } from "./store/testStore";
import type { FormData } from "./components/StressTestForm";
import Header from "./components/Header";
import CreateTestModal from "./components/CreateTestModal";
import runStressTest from "./utils/runStressTest";

function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const savedTests = useTestStore((state) => state.savedTests);
  const saveTestResults = useTestStore((state) => state.saveTestResults);
  const openRouterKey = useTestStore((state) => state.openRouterKey);

  // Handler for form submission in modal
  const handleCreateTest = async (data: FormData) => {
    setIsCreating(true);
    try {
      const result = await runStressTest(data, openRouterKey || "");

      saveTestResults(
        {
          testName: data.testName,
          schema: data.schema,
          userPrompt: data.userPrompt,
        },
        data.systemPrompt,
        data.models,
        data.callTimes,
        result
      );

      router.push(`/${encodeURIComponent(data.testName.trim())}`);
      setIsModalOpen(false);
    } catch (err) {
      // Optionally, handle error UI here
      alert(
        err instanceof Error
          ? err.message
          : "An unknown error occurred while creating the test."
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <Header onCreateTestClick={() => setIsModalOpen(true)} />
      <CreateTestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTest}
        isLoading={isCreating}
      />
      {savedTests.length === 0 ? (
        <p className="text-slate-500">No saved tests found.</p>
      ) : (
        <table className="min-w-full divide-y divide-slate-200 overflow-auto">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Test Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {savedTests.map((test) => (
              <tr key={test.id}>
                <td className="px-4 py-1 h-10 align-middle font-medium text-slate-700">
                  {test.testName}
                </td>
                <td className="px-4 py-1 h-10 align-middle text-xs text-slate-400">
                  {new Date(test.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-1 h-10 align-middle">
                  <button
                    className="px-3 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm font-medium"
                    onClick={() =>
                      router.push(`/${encodeURIComponent(test.testName)}`)
                    }
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default HomePage;
