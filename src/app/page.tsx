"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTestStore } from "./store/testStore";
import type { FormData } from "./components/StressTestForm";
import Header from "./components/Header";
import CreateTestModal from "./components/CreateTestModal";

function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const savedTests = useTestStore((state) => state.savedTests);
  const saveTestResults = useTestStore((state) => state.saveTestResults);

  // Handler for form submission in modal
  const handleCreateTest = async (data: FormData) => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        next: { revalidate: 0 },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();

      saveTestResults(
        {
          testName: data.testName,
          schema: data.schema,
          userPrompt: data.userPrompt,
        },
        data.systemPrompt,
        data.models,
        data.callTimes,
        result.results
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
      <div className="max-w-lg w-full bg-white rounded-lg shadow p-8 mt-10">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">AI Model Stress Test</h1>
        <p className="text-slate-600 mb-8">
          Create and compare structured output performance for multiple AI models.
        </p>
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Saved Tests</h2>
          {savedTests.length === 0 ? (
            <p className="text-slate-500">No saved tests found.</p>
          ) : (
            <ul className="divide-y divide-slate-200 h-100 overflow-auto">
              {savedTests.map((test) => (
                <li key={test.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-700">{test.testName}</div>
                    <div className="text-xs text-slate-400">
                      Created: {new Date(test.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    className="ml-4 px-3 py-1.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm font-medium"
                    onClick={() => router.push(`/${encodeURIComponent(test.testName)}`)}
                  >
                    View
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
