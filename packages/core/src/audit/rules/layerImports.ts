import { FSDLayer, Violation, ImportStatement } from "../../types";

const LAYER_HIERARCHY: Record<FSDLayer, number> = {
  app: 0,
  processes: 1,
  pages: 2,
  widgets: 3,
  features: 4,
  entities: 5,
  shared: 6,
};

/**
 * Check if import violates layer hierarchy
 * Lower layers cannot import from higher layers
 */
export function checkLayerImports(
  imports: ImportStatement[],
  _projectRoot: string
): Violation[] {
  const violations: Violation[] = [];

  for (const imp of imports) {
    if (!imp.isRelative) continue;
    if (!imp.layer || !imp.toLayer) continue; // ← MUDANÇA: usar toLayer já resolvido

    const fromLevel = LAYER_HIERARCHY[imp.layer];
    const toLevel = LAYER_HIERARCHY[imp.toLayer];

    // Violation: lower layer importing from higher layer
    if (fromLevel > toLevel) {
      violations.push({
        type: "CROSS_LAYER_IMPORT",
        severity: "error",
        message: `Layer "${imp.layer}" cannot import from "${imp.toLayer}" (violates layer hierarchy)`,
        file: imp.file,
        line: imp.line,
        suggestion: `Move the code to a lower layer or use dependency inversion`,
        autoFixable: false,
      });
    }
  }

  return violations;
}

/**
 * Check if shared layer imports from other layers
 */
export function checkSharedImports(
  imports: ImportStatement[],
  _projectRoot: string
): Violation[] {
  const violations: Violation[] = [];

  for (const imp of imports) {
    if (!imp.isRelative) continue;
    if (imp.layer !== "shared") continue;
    if (!imp.toLayer) continue; // ← MUDANÇA: usar toLayer já resolvido

    // Shared cannot import from any business layer
    if (imp.toLayer !== "shared") {
      violations.push({
        type: "SHARED_IMPORTS_LAYER",
        severity: "error",
        message: `Shared layer cannot import from "${imp.toLayer}" layer`,
        file: imp.file,
        line: imp.line,
        suggestion: `Shared should only contain reusable code with no dependencies on business layers`,
        autoFixable: false,
      });
    }
  }

  return violations;
}
