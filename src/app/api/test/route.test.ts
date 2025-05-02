import { http, HttpResponse, passthrough } from "msw";
import { setupServer } from "msw/node";
import { POST } from "./route";
import type { NextRequest } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const mockOpenRouterResponse = {
  id: "mock-id",
  object: "chat.completion",
  created: Date.now(),
  model: "openai/gpt-4.1",
  choices: [
    {
      message: {
        role: "assistant",
        content: JSON.stringify({
          name: "John Doe",
          age: 30,
          isStudent: false,
          interests: ["hiking", "photography", "cooking"],
          address: {
            street: "123 Main St",
            city: "Anytown",
          },
        }),
      },
      finish_reason: "stop",
      index: 0,
    },
  ],
};

const server = setupServer(
  http.post(OPENROUTER_URL, async ({ request, ...rest }) => {
    const body = await request.json();
    console.log(JSON.stringify(body, null, 2), "request body");
    return HttpResponse.json(mockOpenRouterResponse);
  }),
  http.post("http://localhost/api/sandbox", () => {
    return HttpResponse.json({
      success: true,
      jsonSchema: {
        definitions: {
          GeneratedSchema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "The person's full name",
              },
              age: {
                type: "integer",
              },
              isStudent: {
                type: "boolean",
              },
              interests: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "A list of hobbies or interests",
              },
              address: {
                type: "object",
                properties: {
                  street: {
                    type: "string",
                  },
                  city: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
            },
            required: ["name", "age"],
            additionalProperties: false,
          },
        },
      },
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createNextRequest(body: any) {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    json: async () => body,
    url: "http://localhost/api/test",
  } as unknown as NextRequest;
}

describe("POST /api/test", () => {
  it("intercepts OpenRouter call and asserts response", async () => {
    const requestBody = {
      models: ["openai/gpt-4.1"],
      callTimes: 1,
      systemPrompt: "system",
      userPrompt: "user",
      schema: `
import { z } from "zod";

 const personSchema = z.object({
  name: z.string().describe("The person's full name"),
  age: z.number().int().min(0),
  isStudent: z.boolean().optional(),
  interests: z.array(z.string()).describe("A list of hobbies or interests").optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional()
  }).optional()
});

export default personSchema;
`,
    };

    const req = createNextRequest(requestBody);
    const res = await POST(req);

    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.results).toBeDefined();
    expect(json.results[0].modelName).toBe("openai/gpt-4.1");
    expect(json.results[0].calls[0].output).toEqual({ result: "mocked" });
    expect(json.results[0].calls[0].successful).toBe(true);
  });
});
