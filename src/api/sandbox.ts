// api/sandbox.js
import { VercelRequest, VercelResponse } from '@vercel/node';
import vm from 'vm';
import * as zod from 'zod'; // Import the zod library

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code } = req.body;

  if (typeof code !== 'string' || code.trim() === '') {
    return res.status(400).json({ error: 'Missing or invalid "code" in request body' });
  }

  // --- Sandboxing ---
  // Create a context for the VM. Only expose necessary and safe functionalities.
  const sandbox = {
    console: { // Provide a limited console
      log: (...args: any[]) => {
        console.log('Sandbox log:', ...args);
        // Consider capturing logs instead of just printing
      },
      error: (...args: any[]) => {
        console.error('Sandbox error:', ...args);
      },
    },
    // *** Inject the imported zod library into the sandbox ***
    zod: zod,
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
  const context = vm.createContext(sandbox);

  try {
    const script = new vm.Script(code, { filename: 'sandbox-code' });

    // Execute the script with the 2ms timeout
    const result = script.runInContext(context, {
      timeout: 2, // 2 milliseconds execution timeout for the code inside the VM
      displayErrors: true,
    });

    return res.status(200).json({ success: true, result: result });

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
    return res.status(400).json({ success: false, error: errorMessage });
  }
}