import { ZOD_CDN_URL } from "./CONTANTS.ts";
import transpileTypeScriptInBrowser from "./transpileTypeScriptInBrowser.js";

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

  let blobUrl = null;
  try {
    const importRegex = /from\s*(['"])zod\1/g;

    const correctedInputTsCode = codeString.replace(
      importRegex,
      `from $1${ZOD_CDN_URL}$1`
    );

    const loadedBabelInstance = window.Babel;
    const transpiledJsCode = await transpileTypeScriptInBrowser(
      correctedInputTsCode,
      loadedBabelInstance
    );

    const blob = new Blob([transpiledJsCode], { type: "text/javascript" });
    
    blobUrl = URL.createObjectURL(blob);

    const moduleNamespaceObject = await import(blobUrl);

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
  } finally {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      console.log("Revoked Blob URL.");
    }
  }
}
