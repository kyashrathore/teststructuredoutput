import { StressTestRequestBody, ModelCall } from "@/app/types/stress-test";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject, jsonSchema as aiJsonSchema } from "ai";
import { NextRequest, NextResponse } from "next/server";
import * as esbuild from "esbuild";

const openRouterProvider = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || "",
  baseURL: "https://openrouter.ai/api/v1",
});

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  try {
    console.log("[Stress Test] Starting new stress test request");
    const params: StressTestRequestBody = await req.json();
    console.log("[Stress Test] Parameters:", {
      models: params.models,
      callTimes: params.callTimes,
      hasSystemPrompt: !!params.systemPrompt,
      hasUserPrompt: !!params.userPrompt,
      schema: params.schema,
    });

    // Transpile schema code if it contains ESM syntax
    let transpiledSchema = params.schema;
    if (/^\s*import\s|^\s*export\s/m.test(params.schema)) {
      let transpileError = null;
      for (const loader of ["js", "ts"]) {
        try {
          const options: esbuild.TransformOptions = {
            // Explicitly type options
            loader: loader as "js" | "ts",
            format: "cjs",
            target: "node16", // Use string target
            sourcemap: false,
            // No longer treating zod as external here
          };
          const transpileResult = await esbuild.transform(
            params.schema,
            options
          );
          transpiledSchema = transpileResult.code;
          transpileError = null;
          break;
        } catch (err: any) {
          transpileError = err;
        }
      }
      if (transpileError) {
        return NextResponse.json(
          {
            error: `Failed to transpile schema code: ${transpileError.message}`,
          },
          { status: 400 }
        );
      }
    }

    const sandboxResponse = await fetch(
      new URL("/api/sandbox", req.url).toString(),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: transpiledSchema,
          validate: false,
        }),
      }
    );
    if (!sandboxResponse.ok) {
      console.error(
        "[Stress Test] Schema sandbox validation failed:",
        await sandboxResponse.text()
      );
      return NextResponse.json(
        { error: "Failed to execute schema in sandbox" },
        { status: 500 }
      );
    }

    const { jsonSchema } = await sandboxResponse.json();

    const results = await Promise.all(
      params.models.map(async (model) => {
        console.log(`[Stress Test] Starting test for model: ${model}`);
        const calls: ModelCall[] = [];

        // Make parallel calls
        const callPromises = Array.from({ length: params.callTimes }).map(
          async (_, i) => {
            const startTime = performance.now();

            try {
              let llmResponseTime: number;
              const { object: aiResponseText, ...rest } = await generateObject({
                model: openRouterProvider(model),
                schema: aiJsonSchema(jsonSchema.definitions.GeneratedSchema),
                system: params.systemPrompt || "",
                prompt: params.userPrompt || "",
              });

              llmResponseTime = performance.now() - startTime;
              console.log(
                `[Stress Test] Model ${model} call ${i + 1}/${
                  params.callTimes
                } completed in ${llmResponseTime.toFixed(2)}ms`
              );
              // Validate output against schema
              let successful = true;
              const validationResponse = await fetch(
                new URL("/api/sandbox", req.url).toString(),
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    code: transpiledSchema,
                    validate: true,
                    json: aiResponseText,
                  }),
                }
              );

              if (!validationResponse.ok) {
                console.error(
                  `[Stress Test] Validation request failed for model ${model}, call ${
                    i + 1
                  }`
                );
                return {
                  successful: false,
                  timeMs: llmResponseTime,
                  error: "Failed to execute schema in sandbox",
                  output: aiResponseText,
                };
              }

              const validationData = await validationResponse.json();
              successful = validationData.success;

              if (!successful) {
                console.error(
                  `[Stress Test] Schema validation failed for model ${model}, call ${
                    i + 1
                  }`,
                  validationData.error
                );
                return {
                  successful: false,
                  timeMs: llmResponseTime,
                  error: validationData.error,
                  output: aiResponseText,
                };
              }

              return {
                successful: true,
                timeMs: llmResponseTime,
                output: aiResponseText,
              };
            } catch (err) {
              console.error(
                `[Stress Test] Error in model ${model}, call ${i + 1}:`,
                err
              );
              return {
                successful: false,
                timeMs: 0,
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

        console.log(`[Stress Test] Model ${model} completed:`, {
          averageTimeMs: averageTimeMs.toFixed(2),
          successRate: (successRate * 100).toFixed(1) + "%",
          successfulCalls: successfulCalls.length,
          totalCalls: calls.length,
        });

        return {
          modelName: model,
          calls,
          averageTimeMs,
          successRate,
        };
      })
    );

    console.log("[Stress Test] All tests completed successfully");
    return NextResponse.json({ results });
  } catch (error) {
    console.error("[Stress Test] Unhandled error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
