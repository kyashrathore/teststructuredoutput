import { StressTestRequestBody } from '../types/stress-test';
import { runStressTest } from './stress-test';

// This file simulates an API middleware layer that would normally be a backend API
// In a real implementation, this would be a Next.js/Express/other backend API route

export async function handleStressTestRequest(request: Request) {
  try {
    // Parse request body
    const body: StressTestRequestBody = await request.json();
    
    // Validate request
    if (!body.models || !Array.isArray(body.models) || body.models.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one model must be selected' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!body.schema) {
      return new Response(
        JSON.stringify({ error: 'Schema is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!body.systemPrompt || !body.userPrompt) {
      return new Response(
        JSON.stringify({ error: 'System and user prompts are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!body.callTimes || body.callTimes < 1 || body.callTimes > 20) {
      return new Response(
        JSON.stringify({ error: 'Call times must be between 1 and 20' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Run the stress test
    const results = await runStressTest(body);
    
    // Return response
    return new Response(
      JSON.stringify(results),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error handling stress test request:', error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}