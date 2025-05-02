"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTestStore } from "./store/testStore";

function HomePage() {
  const [newTestName, setNewTestName] = useState("");
  const router = useRouter();

  const savedTests = useTestStore((state) => state.savedTests);

  const handleCreateTest = () => {
    if (newTestName.trim()) {
      router.push(`/${encodeURIComponent(newTestName.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">AI Model Stress Test</h1>
        <p className="text-slate-600 mb-8">
          Create and compare structured output performance for multiple AI models.
        </p>
        <div className="flex flex-col gap-4">
          <label className="text-sm font-medium text-slate-700" htmlFor="testNameInput">
            Test Name
          </label>
          <input
            id="testNameInput"
            type="text"
            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm text-black p-4"
            placeholder="Enter a name for your test"
            value={newTestName}
            onChange={e => setNewTestName(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleCreateTest();
            }}
          />
          <button
            className={`mt-2 px-4 py-2 rounded-md text-white font-medium transition-colors ${
              newTestName.trim()
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-300 cursor-not-allowed"
            }`}
            disabled={!newTestName.trim()}
            onClick={handleCreateTest}
          >
            Create Test
          </button>
        </div>
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Saved Tests</h2>
          {savedTests.length === 0 ? (
            <p className="text-slate-500">No saved tests found.</p>
          ) : (
            <ul className="divide-y divide-slate-200">
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
