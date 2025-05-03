import React from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { X } from "lucide-react";

interface CodeViewerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const codeString = `/**
 * Runs a stress test on multiple models using OpenRouter (via aisdk) and validates responses against a given zod schema.
 * @param params { models: string[], callTimes: number, systemPrompt?: string, userPrompt?: string, schema: object }
 * @param openRouterApiKey OpenRouter API key (string)
 * @returns Promise<{ modelName: string, calls: ModelCall[], averageTimeMs: number, successRate: number }[]>
 */

import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { executeUserCodeAndGetSchema } from "./executeUserCodeAndGetSchema";

type StressTestParams = {
  models: string[];
  callTimes: number;
  systemPrompt?: string;
  userPrompt?: string;
  schema: string; // JSON Schema
};

type ModelCall = {
  successful: boolean;
  timeMs: number;
  output?: any;
  error?: string;
};

type ModelResult = {
  modelName: string;
  calls: ModelCall[];
  averageTimeMs: number;
  successRate: number;
};

/**
 * Refactored: Now supports incremental updates via onCallComplete callback.
 * Calls onCallComplete(modelName, callResult) as soon as each call finishes.
 */
export async function runStressTest(
  params: StressTestParams,
  openRouterApiKey: string,
  onCallComplete: (modelName: string, callResult: ModelCall) => void
): Promise<void> {
  const openRouterProvider = createOpenRouter({
    apiKey: openRouterApiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });

  // For each model, run callTimes parallel calls
  await Promise.all(
    params.models.map(async (model) => {
      const callPromises = Array.from({ length: params.callTimes }).map(
        (_, i) => {
          const startTime = performance.now();
          return executeUserCodeAndGetSchema(params.schema, window.Zod)
            .then((zodSchema) =>
              generateObject({
                model: openRouterProvider(model),
                schema: zodSchema,
                system: params.systemPrompt || "",
                prompt: params.userPrompt || "",
              }).then(({ object: aiResponseText }) => {
                const llmResponseTime = performance.now() - startTime;
                const validationData = zodSchema.safeParse(aiResponseText);
                const successful = !!validationData.success;
                const callResult: ModelCall = successful
                  ? {
                      successful: true,
                      timeMs: llmResponseTime,
                      output: aiResponseText,
                    }
                  : {
                      successful: false,
                      timeMs: llmResponseTime,
                      error: validationData.error || "Schema validation failed",
                      output: aiResponseText,
                    };
                onCallComplete(model, callResult);
              })
            )
            .catch((err: any) => {
              const callResult: ModelCall = {
                successful: false,
                timeMs: performance.now() - startTime,
                error: err instanceof Error ? err.message : "Unknown error",
              };
              onCallComplete(model, callResult);
            });
        }
      );
      // Wait for all calls for this model to finish before moving to next model
      await Promise.all(callPromises);
    })
  );
}

export default runStressTest;
`;

const CodeViewerDrawer: React.FC<CodeViewerDrawerProps> = ({ isOpen, onClose }) => {
  // Prevent closing on outside click by passing a no-op to onClose
  const handleDialogClose = (reason?: any) => {};

  return (
    <Dialog open={isOpen} onClose={handleDialogClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 transition-opacity" aria-hidden="true" />
      {/* Drawer Panel */}
      <div className="fixed inset-0 flex w-screen items-start justify-center p-4 z-50">
        <DialogPanel className="max-w-2xl w-full border bg-gray-100 h-[85vh] flex flex-col shadow-xl relative">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 rounded-full p-2 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
          {/* Main Content */}
          <div className="flex-1 min-h-0 flex flex-col overflow-auto p-4">
            <h2 className="text-md font-medium mb-4 text-gray-500">Below is the code use to run this tests with Vercel's "ai" package</h2>
            <pre className="bg-gray-900 text-gray-100 rounded p-4 text-xs overflow-x-auto">
              <code>{codeString}</code>
            </pre>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default CodeViewerDrawer;
