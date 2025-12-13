/**
 * Cross-Feature Imports Rule
 */

import {
  AuditRule,
  AuditContext,
  AuditViolation,
  AutoFix,
} from "../../types/audit";
import { parseFSDPath } from "../importParser";

export class CrossFeatureImportsRule implements AuditRule {
  name = "cross-feature-imports";
  description = "Prevents direct imports between feature slices";
  severity = "error" as const;
  enabled = true;
  category = "architecture" as const;

  validate(context: AuditContext): AuditViolation[] {
    const violations: AuditViolation[] = [];
    const { imports, projectRoot } = context;

    for (const imp of imports) {
      if (!imp.isRelative) continue;

      const fromPath = parseFSDPath(imp.file, projectRoot);
      if (fromPath.layer !== "features" || !fromPath.slice) continue;

      // Check if importing from another feature
      const importParts = imp.source.split("/");
      const featureIndex = importParts.indexOf("features");

      if (featureIndex !== -1 && importParts[featureIndex + 1]) {
        const targetFeature = importParts[featureIndex + 1];

        if (targetFeature !== fromPath.slice) {
          violations.push({
            type: "CROSS_FEATURE_IMPORT",
            severity: "error",
            rule: this.name,
            message: `Feature "${fromPath.slice}" cannot directly import from feature "${targetFeature}"`,
            file: imp.file,
            line: imp.line,
            suggestion:
              "Extract shared logic to entities or shared layer. Features should be independent.",
            autoFixable: false,
          });
        }
      }
    }

    return violations;
  }

  fix(_violation: AuditViolation, _context: AuditContext): AutoFix | null {
    return null;
  }
}
