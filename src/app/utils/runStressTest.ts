/**
 * Runs a stress test on multiple models using OpenRouter (via aisdk) and validates responses against a JSON schema.
 * @param params { models: string[], callTimes: number, systemPrompt?: string, userPrompt?: string, schema: object }
 * @param openRouterApiKey OpenRouter API key (string)
 * @returns Promise<{ modelName: string, calls: ModelCall[], averageTimeMs: number, successRate: number }[]>
 */

import { generateObject, jsonSchema as aiJsonSchema } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import * as z from "https://cdn.jsdelivr.net/npm/zod@3.23.8/lib/index.mjs";
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

export async function runStressTest(
  params: StressTestParams,
  openRouterApiKey: string
): Promise<ModelResult[]> {
  // Create OpenRouter provider with the given API key
  const openRouterProvider = createOpenRouter({
    apiKey: openRouterApiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });

  // For each model, run callTimes parallel calls
  const results: ModelResult[] = await Promise.all(
    params.models.map(async (model) => {
      const calls: ModelCall[] = [];

      const callPromises = Array.from({ length: params.callTimes }).map(
        async (_, i) => {
          const startTime = performance.now();
          let llmResponseTime: number;
          try {
            const zodScema = await executeUserCodeAndGetSchema(
              params.schema,
              z
            );

            const { object: aiResponseText } = await generateObject({
              model: openRouterProvider(model),
              schema: zodScema,
              system: params.systemPrompt || "",
              prompt: params.userPrompt || "",
            });

            llmResponseTime = performance.now() - startTime;

            const validationResponse = zodScema.safeParse(aiResponseText);
            if (!validationResponse.ok) {
              return {
                successful: false,
                timeMs: llmResponseTime,
                error: "Failed to execute schema in sandbox",
                output: aiResponseText,
              };
            }

            const validationData = await validationResponse.json();
            const successful = !!validationData.success;

            if (!successful) {
              return {
                successful: false,
                timeMs: llmResponseTime,
                error: validationData.error || "Schema validation failed",
                output: aiResponseText,
              };
            }

            return {
              successful: true,
              timeMs: llmResponseTime,
              output: aiResponseText,
            };
          } catch (err: any) {
            return {
              successful: false,
              timeMs: performance.now() - startTime,
              error: err instanceof Error ? err.message : "Unknown error",
            };
          }
        }
      );

      const completedCalls = await Promise.all(callPromises);
      calls.push(...completedCalls);

      // Calculate stats
      const successfulCalls = calls.filter((call) => call.successful);
      const averageTimeMs =
        calls.reduce((sum, call) => sum + call.timeMs, 0) / calls.length;
      const successRate = successfulCalls.length / calls.length;

      return {
        modelName: model,
        calls,
        averageTimeMs,
        successRate,
      };
    })
  );

  return results;
}

export default runStressTest;
