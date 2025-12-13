import { Violation, ImportStatement } from "../../types";

/**
 * Check if features import from other features directly
 */
export function checkCrossFeatureImports(
  imports: ImportStatement[],
  _projectRoot: string
): Violation[] {
  const violations: Violation[] = [];

  for (const imp of imports) {
    if (!imp.isRelative) continue;
    if (imp.layer !== "features") continue;
    if (!imp.toLayer || !imp.toSlice) continue; // ← MUDANÇA: usar toLayer e toSlice já resolvidos

    // Check if importing from another feature
    if (imp.toLayer === "features" && imp.toSlice !== imp.slice) {
      violations.push({
        type: "CROSS_FEATURE_IMPORT",
        severity: "error",
        message: `Feature "${imp.slice}" cannot directly import from feature "${imp.toSlice}"`,
        file: imp.file,
        line: imp.line,
        suggestion: `Extract shared logic to entities or shared layers, or use composition at a higher layer`,
        autoFixable: false,
      });
    }
  }

  return violations;
}
