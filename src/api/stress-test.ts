import { z } from 'zod';
import { StressTestRequestBody, ModelCall, TestResult } from '../types/stress-test';

// Mock implementation of API call since we can't actually call LLM APIs from the browser
// In a real implementation, this would be a serverless function or API endpoint
export const runStressTest = async (params: StressTestRequestBody): Promise<{ results: TestResult[] }> => {
  console.log('Running stress test with params:', params);
  
  // Parse the schema
  let schema;
  try {
    schema = JSON.parse(params.schema);
  } catch (err) {
    throw new Error('Invalid JSON schema');
  }

  // Create a Zod schema from the JSON schema (simplified validation)
  let zodSchema;
  try {
    zodSchema = createZodSchemaFromJson(schema);
  } catch (err) {
    throw new Error('Failed to create Zod schema from JSON schema');
  }

  // Simulate API calls for each model
  const results = await Promise.all(
    params.models.map(async (model) => {
      const calls: ModelCall[] = [];
      
      // Simulate parallel calls
      const callPromises = Array.from({ length: params.callTimes }).map(async (_, i) => {
        const startTime = performance.now();
        
        try {
          // Simulate model response time (between 500ms and 3000ms)
          const responseTime = 500 + Math.random() * 2500;
          await new Promise(resolve => setTimeout(resolve, responseTime));
          
          // Generate mock output based on the model
          const output = generateMockOutput(model, schema);
          
          // Validate output against schema
          let successful = true;
          try {
            zodSchema.parse(output);
          } catch (err) {
            successful = false;
            return {
              successful: false,
              timeMs: performance.now() - startTime,
              error: 'Output failed schema validation',
              output
            };
          }
          
          return {
            successful: true,
            timeMs: performance.now() - startTime,
            output
          };
        } catch (err) {
          return {
            successful: false,
            timeMs: performance.now() - startTime,
            error: err instanceof Error ? err.message : 'Unknown error'
          };
        }
      });
      
      const completedCalls = await Promise.all(callPromises);
      calls.push(...completedCalls);
      
      // Calculate stats
      const successfulCalls = calls.filter(call => call.successful);
      const averageTimeMs = calls.reduce((sum, call) => sum + call.timeMs, 0) / calls.length;
      const successRate = successfulCalls.length / calls.length;
      
      return {
        modelName: model,
        calls,
        averageTimeMs,
        successRate
      };
    })
  );
  
  return { results };
};

// Utility function to create a Zod schema from a JSON schema (simplified version)
function createZodSchemaFromJson(jsonSchema: any): z.ZodType<any> {
  if (!jsonSchema.type) {
    throw new Error('Missing type in JSON schema');
  }
  
  switch (jsonSchema.type) {
    case 'object':
      const shape: Record<string, z.ZodType<any>> = {};
      
      if (jsonSchema.properties) {
        for (const [key, prop] of Object.entries<any>(jsonSchema.properties)) {
          shape[key] = createZodSchemaFromJson(prop);
        }
      }
      
      let schema = z.object(shape);
      
      // Handle required properties
      if (jsonSchema.required && Array.isArray(jsonSchema.required)) {
        const required = new Set(jsonSchema.required);
        for (const key of Object.keys(shape)) {
          if (!required.has(key)) {
            // Make non-required properties optional
            shape[key] = shape[key].optional();
          }
        }
        schema = z.object(shape);
      }
      
      return schema;
      
    case 'array':
      if (jsonSchema.items) {
        return z.array(createZodSchemaFromJson(jsonSchema.items));
      }
      return z.array(z.any());
      
    case 'string':
      return z.string();
      
    case 'number':
      return z.number();
      
    case 'boolean':
      return z.boolean();
      
    case 'null':
      return z.null();
      
    default:
      return z.any();
  }
}

// Generate mock output based on model and schema
function generateMockOutput(model: string, schema: any): any {
  // Simplified mock output generator
  if (schema.type === 'object') {
    const result: Record<string, any> = {};
    
    if (schema.properties) {
      for (const [key, prop] of Object.entries<any>(schema.properties)) {
        // Sometimes introduce errors for some models to simulate varying reliability
        const errorProne = model.includes('gpt-3.5') || model.includes('mistral');
        const makeError = errorProne && Math.random() < 0.3;
        
        if (makeError) {
          // Introduce a type error
          if (prop.type === 'string') result[key] = Math.random() * 100;
          else if (prop.type === 'number') result[key] = 'wrong type';
          else if (prop.type === 'boolean') result[key] = 'not a boolean';
          else if (prop.type === 'array') result[key] = 'not an array';
        } else {
          // Generate correct type
          if (prop.type === 'string') result[key] = `Sample ${key}`;
          else if (prop.type === 'number') result[key] = Math.floor(Math.random() * 100);
          else if (prop.type === 'boolean') result[key] = Math.random() > 0.5;
          else if (prop.type === 'array') {
            result[key] = ['item1', 'item2', 'item3'].slice(0, Math.floor(Math.random() * 3) + 1);
          } else if (prop.type === 'object') {
            result[key] = generateMockOutput(model, prop);
          }
        }
        
        // Sometimes skip required properties to simulate errors
        const isRequired = schema.required && schema.required.includes(key);
        if (isRequired && errorProne && Math.random() < 0.2) {
          delete result[key];
        }
      }
    }
    
    return result;
  }
  
  // For non-object types, return a simple value
  if (schema.type === 'string') return 'sample value';
  if (schema.type === 'number') return 42;
  if (schema.type === 'boolean') return true;
  if (schema.type === 'array') return ['item1', 'item2'];
  
  return null;
}