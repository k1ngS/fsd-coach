import { promises as fs } from "fs";
import * as path from "path";
import { Violation, ImportStatement } from "../../types";
import { parseFSDPath } from "../importParser";

/**
 * Check if slices have public API (index.ts)
 */
export async function checkPublicApi(
  slicePath: string,
  projectRoot: string
): Promise<Violation[]> {
  const violations: Violation[] = [];

  const indexFiles = ["index.ts", "index.tsx", "index.js", "index.jsx"];
  let hasIndex = false;

  for (const indexFile of indexFiles) {
    const indexPath = path.join(slicePath, indexFile);
    try {
      await fs.access(indexPath);
      hasIndex = true;
      break;
    } catch {
      continue;
    }
  }

  if (!hasIndex) {
    violations.push({
      type: "MISSING_PUBLIC_API",
      severity: "warning",
      message: `Slice missing public API (index.ts)`,
      file: slicePath,
      suggestion: `Create an index.ts file to define the public API of this slice`,
      autoFixable: true,
    });
  }

  return violations;
}

/**
 * Check if imports bypass public API
 */
export function checkDirectSegmentImports(
  imports: ImportStatement[],
  projectRoot: string
): Violation[] {
  const violations: Violation[] = [];

  for (const imp of imports) {
    if (!imp.isRelative) continue;

    // Check if importing directly from a segment (ui/, model/, api/, etc.)
    // Instead of from slice's public API
    const importParts = imp.source.split("/");

    // Pattern: ../slice-name/segment/file instead of ../slice-name
    const segments = ["ui", "model", "api", "lib", "config", "types"];

    for (let i = 0; i < importParts.length; i++) {
      if (segments.includes(importParts[i])) {
        // Check if this is a cross-slice import
        const fromPath = parseFSDPath(imp.file, projectRoot);

        // If importing from segment in another slice
        if (fromPath.slice && importParts.includes("..")) {
          violations.push({
            type: "DIRECT_SEGMENT_IMPORT",
            severity: "warning",
            message: `Direct import from segment bypasses public API`,
            file: imp.file,
            line: imp.line,
            suggestion: `Import from the slice's public API (index.ts) instead of directly from segments`,
            autoFixable: false,
          });
        }
        break;
      }
    }
  }

  return violations;
}
