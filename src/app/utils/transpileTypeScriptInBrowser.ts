export default async function transpileTypeScriptInBrowser(
  typescriptCode: any,
  babelInstance: any
) {
  if (!babelInstance || typeof babelInstance.transform !== "function") {
    throw new Error(
      "Invalid Babel instance provided. Make sure Babel Standalone is loaded and passed correctly."
    );
  }

  if (typeof typescriptCode !== "string") {
    throw new Error("Invalid input: typescriptCode must be a string.");
  }

  console.log(
    "Attempting to transpile TypeScript using provided Babel instance..."
  );

  try {
    const result = babelInstance.transform(typescriptCode, {
      presets: ["typescript"],
      plugins: ["transform-modules-commonjs"],
      filename: "userCode.ts",
    });

    console.log("Transpilation successful.");

    return result.code;
  } catch (error) {
    console.error("Babel Transpilation Error:", error);

    throw new Error(`TypeScript Transpilation Failed: ${(error as Error).message}`);
  }
}
