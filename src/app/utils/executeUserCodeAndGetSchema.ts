import transpileTypeScriptInBrowser from "./transpileTypeScriptInBrowser";

declare global {
  interface Window {
    zod: any;
    z: any;
    Babel: any;
  }
}

// Get Zod from global window (loaded via <script> tag, assigned to window.z)
export function loadZodFromCDN() {
  if (window.zod) {
    window.z = window.zod;
    return window.z;
  } else {
    console.error(
      "Zod library not found on window object as 'z'. Check script tag in layout."
    );
    throw new Error("Zod library failed to load.");
  }
}

function findExportedZodSchema(moduleNamespaceObject: any, zodInstance: any) {
  if (
    !moduleNamespaceObject ||
    !zodInstance ||
    typeof zodInstance.ZodType === "undefined"
  ) {
    console.error("Invalid arguments passed to findExportedZodSchema.");
    return null;
  }

  if (
    moduleNamespaceObject.default &&
    moduleNamespaceObject.default instanceof zodInstance.ZodType
  ) {
    console.log("Found schema in default export.");
    return moduleNamespaceObject.default;
  }

  if (
    moduleNamespaceObject.schema &&
    moduleNamespaceObject.schema instanceof zodInstance.ZodType
  ) {
    console.log("Found schema in named export 'schema'.");
    return moduleNamespaceObject.schema;
  }

  for (const key in moduleNamespaceObject) {
    if (
      key !== "default" &&
      Object.prototype.hasOwnProperty.call(moduleNamespaceObject, key)
    ) {
      const potentialSchema = moduleNamespaceObject[key];
      if (potentialSchema instanceof zodInstance.ZodType) {
        console.log(`Found schema in named export '${key}'.`);
        return potentialSchema;
      }
    }
  }

  console.log("No suitable exported Zod schema found in the module namespace.");
  return null;
}

export async function executeUserCodeAndGetSchema(
  codeString: string,
  zodInstance: any
) {
  if (typeof codeString !== "string" || !codeString.trim()) {
    throw new Error(
      "executeUserCodeAndGetSchema: Invalid or empty code string provided."
    );
  }

  if (!zodInstance || typeof zodInstance.ZodType === "undefined") {
    throw new Error(
      "executeUserCodeAndGetSchema: Invalid Zod instance provided for validation."
    );
  }

  try {
    // Remove all import ... from 'zod' and require('zod') statements
    let correctedInputTsCode = codeString
      // Remove ES module imports from 'zod'
      .replace(/import\s+[^;]*\s+from\s*(['"])zod\1\s*;?/g, "")
      // Remove CommonJS requires for 'zod'
      .replace(
        /(const|let|var)\s+\w+\s*=\s*require\(\s*(['"])zod\2\s*\)\s*;?/g,
        ""
      );

    const loadedBabelInstance = window.Babel;
    const transpiledJsCode = await transpileTypeScriptInBrowser(
      correctedInputTsCode,
      loadedBabelInstance
    );

    const moduleNamespaceObject = {};
    const moduleExecutor = new Function("exports", "zod", transpiledJsCode);
    moduleExecutor(moduleNamespaceObject, zodInstance);

    const zodSchemaObject = findExportedZodSchema(
      moduleNamespaceObject,
      zodInstance
    );

    if (!zodSchemaObject) {
      throw new Error(
        "Could not find a valid exported Zod schema in the provided code. Check exports (default, 'schema', or other named exports)."
      );
    }

    return zodSchemaObject;
  } catch (error: any) {
    console.error(
      "Error during user code execution or schema extraction:",
      error
    );

    throw new Error(`Execution failed: ${error.message}`);
  }
}
