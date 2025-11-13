import { Violation, ImportStatement } from "../../types";
import { parseFSDPath } from "../importParser";

/**
 * Check if features import from other features directly
 */
export function checkCrossFeatureImports(
  imports: ImportStatement[],
  projectRoot: string
): Violation[] {
  const violations: Violation[] = [];

  for (const imp of imports) {
    if (!imp.isRelative) continue;

    const fromPath = parseFSDPath(imp.file, projectRoot);
    if (fromPath.layer !== "features") continue;

    // Check if importing from another feature
    const importParts = imp.source.split("/");

    // Look for "features" in import path
    const featuresIndex = importParts.indexOf("features");
    if (featuresIndex !== -1 && featuresIndex < importParts.length - 1) {
      const targetSlice = importParts[featuresIndex + 1];

      // If importing from different feature
      if (targetSlice !== fromPath.slice) {
        violations.push({
          type: "CROSS_FEATURE_IMPORT",
          severity: "error",
          message: `Feature "${fromPath.slice}" cannot directly import from feature "${targetSlice}"`,
          file: imp.file,
          line: imp.line,
          suggestion: `Extract shared logic to entities or shared layers, or use composition at a higher layer`,
          autoFixable: false,
        });
      }
    }
  }

  return violations;
}
