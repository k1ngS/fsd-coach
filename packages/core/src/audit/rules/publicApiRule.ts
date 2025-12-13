/**
 * Public API Rule - Ensures slices have index.ts and checks for bypass
 */

import { promises as fs } from "fs";
import * as path from "path";
import {
  AuditRule,
  AuditContext,
  AuditViolation,
  AutoFix,
  FileChange,
} from "../../types/audit";
import { parseFSDPath } from "../importParser";

export class PublicApiRule implements AuditRule {
  name = "public-api";
  description =
    "Ensures slices have public API (index.ts) and prevents bypassing it";
  severity = "warning" as const;
  enabled = true;
  category = "architecture" as const;

  async validate(context: AuditContext): Promise<AuditViolation[]> {
    const violations: AuditViolation[] = [];
    const { imports, projectRoot } = context;

    // Check for missing index.ts in slices
    const slicePaths = new Set<string>();
    const srcDir = path.join(projectRoot, "src");

    const layers = ["features", "entities", "widgets"];
    for (const layer of layers) {
      const layerDir = path.join(srcDir, layer);

      try {
        const slices = await fs.readdir(layerDir, { withFileTypes: true });

        for (const slice of slices) {
          if (slice.isDirectory()) {
            const slicePath = path.join(layerDir, slice.name);
            slicePaths.add(slicePath);

            const hasIndex = await this.checkForIndex(slicePath);
            if (!hasIndex) {
              violations.push({
                type: "MISSING_PUBLIC_API",
                severity: "warning",
                rule: this.name,
                message: `Slice "${layer}/${slice.name}" is missing public API (index.ts)`,
                file: slicePath,
                suggestion: `Create an index.ts file to define the public API of this slice`,
                autoFixable: true,
              });
            }
          }
        }
      } catch {
        continue;
      }
    }

    // Check for direct segment imports
    const segments = ["ui", "model", "api", "lib", "config", "types"];

    for (const imp of imports) {
      if (!imp.isRelative) continue;

      const importParts = imp.source.split("/");

      for (let i = 0; i < importParts.length; i++) {
        if (segments.includes(importParts[i])) {
          const fromPath = parseFSDPath(imp.file, projectRoot);

          if (fromPath.slice && importParts.includes("..")) {
            violations.push({
              type: "DIRECT_SEGMENT_IMPORT",
              severity: "warning",
              rule: this.name,
              message: `Direct import from segment "${importParts[i]}" bypasses public API`,
              file: imp.file,
              line: imp.line,
              suggestion: `Import from the slice's public API (index.ts) instead`,
              autoFixable: false,
            });
          }
          break;
        }
      }
    }

    return violations;
  }

  private async checkForIndex(slicePath: string): Promise<boolean> {
    const indexFiles = ["index.ts", "index.tsx", "index.js", "index.jsx"];

    for (const indexFile of indexFiles) {
      const indexPath = path.join(slicePath, indexFile);
      try {
        await fs.access(indexPath);
        return true;
      } catch {
        continue;
      }
    }

    return false;
  }

  fix(violation: AuditViolation, _context: AuditContext): AutoFix | null {
    if (violation.type !== "MISSING_PUBLIC_API") {
      return null;
    }

    const indexContent = `/**
 * Public API for this slice
 *
 * Export only what other layers should use.
 * Keep internal implementation details private.
 */

// Example exports:
// export { MyComponent } from "./ui/MyComponent";
// export * from "./model";
`;

    const change: FileChange = {
      file: path.join(violation.file, "index.ts"),
      type: "insert",
      newText: indexContent,
    };

    return {
      description: `Create index.ts for ${path.basename(violation.file)}`,
      changes: [change],
    };
  }
}
