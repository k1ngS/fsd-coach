import { FSDLayer, Violation, ImportStatement } from "../../types";
import { parseFSDPath } from "../importParser";

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
  projectRoot: string
): Violation[] {
  const violations: Violation[] = [];

  for (const imp of imports) {
    if (!imp.isRelative) continue;

    const fromPath = parseFSDPath(imp.file, projectRoot);
    if (!fromPath.layer) continue;

    // Parse destination layer from import source
    const importParts = imp.source.split("/");
    let destLayer: FSDLayer | undefined;

    // Look for layer in import path
    for (const part of importParts) {
      if (part in LAYER_HIERARCHY) {
        destLayer = part as FSDLayer;
        break;
      }
    }

    if (!destLayer) continue;

    const fromLevel = LAYER_HIERARCHY[fromPath.layer];
    const toLevel = LAYER_HIERARCHY[destLayer];

    // Violation: lower layer importing from higher layer
    if (fromLevel > toLevel) {
      violations.push({
        type: "CROSS_LAYER_IMPORT",
        severity: "error",
        message: `Layer "${fromPath.layer}" cannot import from "${destLayer}" (violates layer hierarchy)`,
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
  projectRoot: string
): Violation[] {
  const violations: Violation[] = [];

  for (const imp of imports) {
    if (!imp.isRelative) continue;

    const fromPath = parseFSDPath(imp.file, projectRoot);
    if (fromPath.layer !== "shared") continue;

    // Parse destination layer
    const importParts = imp.source.split("/");
    for (const part of importParts) {
      if (part in LAYER_HIERARCHY && part !== "shared") {
        violations.push({
          type: "SHARED_IMPORTS_LAYER",
          severity: "error",
          message: `Shared layer cannot import from "${part}" layer`,
          file: imp.file,
          line: imp.line,
          suggestion: `Shared should only contain reusable code with no dependencies on business layers`,
          autoFixable: false,
        });
        break;
      }
    }
  }

  return violations;
}
