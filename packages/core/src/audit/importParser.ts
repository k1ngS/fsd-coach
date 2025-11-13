import * as path from "path";
import { promises as fs } from "fs";
import { FSDLayer, ImportStatement } from "../types";

/**
 * Extract imports from a TypeScript/JavaScript file
 */
export async function extractImports(
  filePath: string
): Promise<ImportStatement[]> {
  const content = await fs.readFile(filePath, "utf-8");
  const imports: ImportStatement[] = [];

  // Regex to match import statements
  const importRegex =
    /^(?:import\s+(?:(?:[\w\s{},*]+)\s+from\s+)?['"]([^'"]+)['"]|(?:const|let|var)\s+.*?=\s*require\(['"]([^'"]+)['"]\))/gm;

  let match;
  let lineNumber = 0;

  const lines = content.split("\n");

  for (const line of lines) {
    lineNumber++;
    const trimmedLine = line.trim();

    // ES6 import
    const es6Match = trimmedLine.match(
      /^import\s+(?:(?:[\w\s{},*]+)\s+from\s+)?['"]([^'"]+)['"]/
    );
    if (es6Match) {
      const source = es6Match[1];
      imports.push({
        source,
        file: filePath,
        line: lineNumber,
        isRelative: source.startsWith(".") || source.startsWith("/"),
      });
    }

    // CommonJS require
    const cjsMatch = trimmedLine.match(
      /(?:const|let|var)\s+.*?=\s*require\(['"]([^'"]+)['"]\)/
    );
    if (cjsMatch) {
      const source = cjsMatch[1];
      imports.push({
        source,
        file: filePath,
        line: lineNumber,
        isRelative: source.startsWith(".") || source.startsWith("/"),
      });
    }
  }

  return imports;
}

/**
 * Parse FSD layer, slice, and segment from a path
 */
export function parseFSDPath(
  filePath: string,
  projectRoot: string
): { layer?: FSDLayer; slice?: string; segment?: string } {
  const relativePath = path.relative(projectRoot, filePath);
  const parts = relativePath.split(path.sep);

  // Expected format: src/[layer]/[slice]/[segment]/file.ts
  if (parts[0] !== "src") {
    return {};
  }

  const layer = parts[1] as FSDLayer;
  const slice = parts[2];
  const segment = parts[3];

  const validLayers: FSDLayer[] = [
    "app",
    "processes",
    "pages",
    "widgets",
    "features",
    "entities",
    "shared",
  ];

  return {
    layer: validLayers.includes(layer) ? layer : undefined,
    slice,
    segment,
  };
}

/**
 * Resolve import path to absolute file path
 */
export function resolveImportPath(
  importSource: string,
  fromFile: string,
  projectRoot: string
): string | null {
  if (!importSource.startsWith(".")) {
    // External or alias import
    return null;
  }

  const fromDir = path.dirname(fromFile);
  let resolved = path.resolve(fromDir, importSource);

  // Try common extensions
  const extensions = [
    "",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    "/index.ts",
    "/index.tsx",
    "/index.js",
  ];

  for (const ext of extensions) {
    const testPath = resolved + ext;
    try {
      const stat = require("fs").statSync(testPath);
      if (stat.isFile()) {
        return testPath;
      }
    } catch {
      continue;
    }
  }

  return null;
}
