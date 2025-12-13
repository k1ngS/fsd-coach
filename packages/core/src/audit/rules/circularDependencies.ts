import { DependencyGraphAnalyzer } from "../utils/graph";
import {
  AuditRule,
  AuditContext,
  AuditViolation,
  AutoFix,
} from "../../types/audit";
import * as path from "path";

export class CircularDependenciesRule implements AuditRule {
  name = "circular-dependencies";
  description = "Detects circular dependencies between modules";
  severity = "error" as const;
  enabled = true;
  category = "architecture" as const;

  validate(context: AuditContext): AuditViolation[] {
    const { dependencyGraph, projectRoot } = context;
    const analyzer = new DependencyGraphAnalyzer(dependencyGraph);
    const cycles = analyzer.detectCycles();

    if (cycles.length === 0) {
      return [];
    }

    return cycles.map((cycle) => {
      const firstFile = cycle.nodes[0];
      const relativeNodes = cycle.nodes.map((node) =>
        path.relative(projectRoot, node)
      );

      return {
        type: "CIRCULAR_DEPENDENCY",
        severity: "error" as const,
        rule: this.name,
        file: firstFile,
        message: `Circular dependency detected: ${relativeNodes.join(" → ")} → ${relativeNodes[0]}`,
        suggestion:
          "Consider reorganizing code to break this cycle. Options:\n" +
          "1. Extract shared code to a new module in a lower layer\n" +
          "2. Move one of the modules to a higher layer\n" +
          "3. Use dependency injection to reduce coupling\n" +
          "4. Apply the Dependency Inversion Principle (DIP)",
        autoFixable: false,
      };
    });
  }

  fix(_violation: AuditViolation, _context: AuditContext): AutoFix | null {
    // Circular dependencies cannot be auto-fixed safely
    // Would require architectural changes
    return null;
  }
}
