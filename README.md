# Structured Output LLM Stress Tester

A Next.js application for stress testing and comparing the structured output capabilities of Large Language Models (LLMs) using custom Zod schemas. This tool enables you to evaluate, validate, and visualize how well different LLMs (via OpenRouter) conform to your desired data structures, prompts, and system instructions.

## Disclaimer

- **AI Generated Code**: The codebase is mostly AI-generated.
- **Local Storage**: All test results are stored in localStorage, including your provided OpenRouter API key.
- **No Streaming Support**: The app only uses the `generateObject` function without streaming because you typically want to retry on failure to generate a schema-compliant version. The `generateObject` approach is your best option for this use case.
- **Limited Editing After Creation**: Once a test is created, you are only allowed to change the system prompt. This is intentional as the system prompt is what you'll typically want to experiment with. The schema cannot be changed (as it defines the expected structure), and the user prompt is fixed (as it represents the user's task).
- **Tool Call Implementation**: This app uses OpenRouter AI SDK based on Vercel's AI SDK, which calls OpenAI LLMs as tool calls. Results might differ from directly calling an LLM for structured output.
- **Missing Retry Feature**: The app currently doesn't support configuring max retries. Adding this feature would be valuable since a cost-effective model that can generate correct output in two attempts might be better than a more expensive model that succeeds on the first try.
- **Cost Not Factored**: The application does not factor in the cost of API calls to different models.
- **Limited Output Formats**: Currently only testing JSON output. Future versions should compare other structured formats like YAML and XML.
- **Known Issues**: The codebase has some ESLint and TypeScript errors that need to be addressed.

---

## Features

- **Schema-Driven Testing:** Define expected output formats using Zod schemas and validate LLM responses for compliance.
- **Multi-Model Comparison:** Run tests across multiple LLMs (OpenAI, Anthropic, etc.) in parallel via OpenRouter.
- **Prompt Experimentation:** Test different system prompts for the same schema and user prompt to optimize results.
- **Performance Metrics:** Collect and visualize success rates, average response times, and validation errors.
- **Persistent Results:** Save, revisit, and compare test configurations and results.
- **Rich Visualization:** Interactive charts and tables for detailed analysis.

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- An [OpenRouter](https://openrouter.ai/) API key (required for model access)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/structured-output-llm-tester.git
   cd structured-output-llm-tester
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set your OpenRouter API key:**
   - The app will prompt you for your API key on first use, or you can set it in your environment as `OPENROUTER_API_KEY`.

4. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

---

## Usage

1. **Create a New Test:**
   - Click "Create Test" and fill in:
     - **Test Name**
     - **Models to Test** (select one or more)
     - **Zod Schema** (define the expected output structure)
     - **System Prompt** (instructions for the LLM)
     - **User Prompt** (the actual task/question)
     - **Number of Calls** (how many times to call each model)

2. **Run the Test:**
   - The app will call each selected model multiple times, validate outputs, and collect metrics.

3. **View Results:**
   - See summary statistics, detailed tables, and performance charts.
   - Compare different system prompt variations for the same test.

4. **Manage Tests:**
   - Saved tests and their results are persisted locally.
   - You can revisit, re-run, or remove tests and prompt variations.

---

## Example Zod Schema

```ts
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
```

---

## Technical Overview

- **Frontend:** Next.js (App Router), React, Zustand (state management), Tailwind CSS
- **LLM Integration:** OpenRouter API, `@openrouter/ai-sdk-provider`
- **Schema Validation:** Zod (user-defined schemas, validated in-browser)
- **Persistence:** Local storage via Zustand middleware

---

## License

MIT

---

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [OpenRouter](https://openrouter.ai/)
- [Zod](https://zod.dev/)
- [Lucide Icons](https://lucide.dev/)
