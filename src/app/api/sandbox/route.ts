


import vm from 'vm';
import * as zod from 'zod';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { zodToJsonSchema } from "zod-to-json-schema";

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  const body = await req.json();
  const { code, json, validate = true } = body;

  if (typeof code !== 'string' || code.trim() === '') {
    return NextResponse.json({ error: 'Missing or invalid "code" in request body' }, { status: 400 });
  }
  // Check for valid UTF-8 (by encoding and decoding)
  try {
    // This will throw if code contains invalid UTF-8 sequences
    Buffer.from(code, 'utf8').toString('utf8');
  } catch {
    return NextResponse.json({ error: 'Code contains invalid UTF-8 characters.' }, { status: 400 });
  }
  
  if (validate && !json) {
    return NextResponse.json({ error: 'Missing "json" in request body for validation' }, { status: 400 });
  }

  // --- Sandboxing ---
  // Create a context for the VM. Only expose necessary and safe functionalities.
  const sandboxContext: any = { // Use 'any' for flexibility with adding module/require
    // Provide a basic module object for CJS compatibility
    module: { exports: {} },
    // Provide a limited, safe require function
    require: (moduleName: string) => {
      if (moduleName === 'zod') {
        return zod; // Return the actual Zod library if requested
      }
      // Disallow requiring any other modules for security
      throw new Error(`Module '${moduleName}' not allowed in sandbox.`);
    },
    console: { // Provide a limited console
      log: (...args: any[]) => {
        console.log('Sandbox log:', ...args);
        // Consider capturing logs instead of just printing
      },
      error: (...args: any[]) => {
        console.error('Sandbox error:', ...args);
      },
    },
    // zod is now provided via the custom require function above
    // Add any other safe utilities or data here if needed
    // Example: myData: { value: 123 }

    // --- DANGER ZONE ---
    // Avoid exposing these unless absolutely necessary and you understand the risks:
    // require: require, // <-- VERY DANGEROUS with untrusted code
    // process: process, // <-- VERY DANGEROUS
    // Buffer: Buffer,   // <-- Potentially dangerous
    // setTimeout: setTimeout, // Could be used for DoS
    // fetch: fetch, // Could make external requests
    // -----------------
  };

  // Create the context
  const context = vm.createContext(sandboxContext);

  try {
    const script = new vm.Script(code, { filename: 'sandbox-code' });

    // Execute the script. It will populate context.module.exports.
    script.runInContext(context, {
      timeout: 20, // Increased timeout slightly
      displayErrors: true,
    });

    // Access the schema from the populated module.exports
    // Assuming the original code used a default export (e.g., `export default mySchema`)
    const exportedSchema = context.module.exports?.default;

    if (!exportedSchema) {
      // Provide a more generic error message as the export name might vary
      console.error("Sandbox Error: Default export not found in module.exports. Exports:", context.module.exports);
      return NextResponse.json({ success: false, error: 'Could not find the default exported Zod schema object in the provided code. Ensure it uses a default export (e.g., `export default mySchema = ...`).' }, { status: 400 });
    }

    if (validate) {
      const validationResult = exportedSchema.safeParse(json);
      if (validationResult.success) {
        // Validation successful
        return NextResponse.json({
          success: true,
          isValid: true,
          data: validationResult.data
        }, { status: 200 });
      } else {
        // Validation failed
        return NextResponse.json({
          success: false, // Correctly indicate validation failure
          isValid: false,
          error: validationResult.error.flatten() // Keep flattened error
        }, { status: 200 }); // Keep 200 status as sandbox execution was ok, but validation failed
      }
    } else {
      // Generate JSON schema from the found exported schema
      const jsonSchema = zodToJsonSchema(exportedSchema, {
        name: 'GeneratedSchema', // Consider making this dynamic if needed
        target: 'jsonSchema7',
      });

      return NextResponse.json({
        success: true,
        jsonSchema
      }, { status: 200 });
    }

  } catch (error: any) {
    console.error('VM Execution Error:', error);
    let errorMessage = 'Script execution failed.';
    if (error.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
      errorMessage = 'Script execution timed out (2ms limit).';
    } else if (error instanceof SyntaxError) {
      errorMessage = `Syntax Error: ${error.message}`;
    } else {
      errorMessage = `Execution Error: ${error.message}`;
    }
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
