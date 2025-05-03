import { zodToJsonSchema } from "zod-to-json-schema";
import yaml from "js-yaml";
import { SourceFormat, TargetFormat } from "../types/formats";
import { executeUserCodeAndGetSchema } from "./executeUserCodeAndGetSchema.ts";


export async function convert(
  input: string,
  sourceFormat: SourceFormat,
  targetFormat: TargetFormat
): Promise<string> {
  if (sourceFormat === "json" && targetFormat === "json") {
    try {
      const parsed = JSON.parse(input);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      throw new Error(`Invalid JSON: ${(e as Error).message}`);
    }
  }

  let jsonSchema: object;
  let extractedSchema: object;

  if (sourceFormat === "zod") {
    try {
      try {
        extractedSchema = await executeUserCodeAndGetSchema(input, z);

        console.log("Successfully extracted Zod Schema:");
      } catch (error) {
        console.error("Failed to process user code:", error);
      }
      jsonSchema = zodToJsonSchema(extractedSchema, {
        $refStrategy: "none",
      });
    } catch (e) {
      throw new Error(`Invalid Zod schema: ${(e as Error).message}`);
    }
  } else {
    try {
      jsonSchema = JSON.parse(input);
    } catch (e) {
      throw new Error(`Invalid JSON Schema: ${(e as Error).message}`);
    }
  }

  if (targetFormat === "json") {
    return JSON.stringify(jsonSchema, null, 2);
  } else {
    try {
      return yaml.dump(jsonSchema, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
      });
    } catch (e) {
      throw new Error(`Error converting to YAML: ${(e as Error).message}`);
    }
  }
}
