/**
 * Layer Imports Rule - Enforces FSD layer hierarchy
 */

import {
  AuditRule,
  AuditContext,
  AuditViolation,
  AutoFix,
} from "../../types/audit";
import { FSDLayer } from "../../types";
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

export class LayerImportsRule implements AuditRule {
  name = "layer-imports";
  description =
    "Enforces FSD layer hierarchy (lower layers cannot import from higher)";
  severity = "error" as const;
  enabled = true;
  category = "architecture" as const;

  validate(context: AuditContext): AuditViolation[] {
    const violations: AuditViolation[] = [];
    const { imports, projectRoot } = context;

    for (const imp of imports) {
      if (!imp.isRelative) continue;

      const fromPath = parseFSDPath(imp.file, projectRoot);
      if (!fromPath.layer) continue;

      // Parse destination layer from import source
      const importParts = imp.source.split("/");
      let destLayer: FSDLayer | undefined;

      for (const part of importParts) {
        if (part in LAYER_HIERARCHY) {
          destLayer = part as FSDLayer;
          break;
        }
      }

      if (!destLayer) continue;

      const fromLevel = LAYER_HIERARCHY[fromPath.layer];
      const toLevel = LAYER_HIERARCHY[destLayer];

      if (fromLevel > toLevel) {
        violations.push({
          type: "CROSS_LAYER_IMPORT",
          severity: "error",
          rule: this.name,
          message: `Layer "${fromPath.layer}" cannot import from "${destLayer}" (violates layer hierarchy)`,
          file: imp.file,
          line: imp.line,
          suggestion: `Move the code to layer "${fromPath.layer}" or lower, or use dependency inversion`,
          autoFixable: false,
        });
      }
    }

    return violations;
  }

  fix(_violation: AuditViolation, _context: AuditContext): AutoFix | null {
    return null;
  }
}
