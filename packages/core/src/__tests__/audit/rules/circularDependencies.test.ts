/**
 * Unit tests for CircularDependenciesRule
 */

import { describe, it, expect } from "vitest";
import { AuditContext, DependencyGraph } from "../../../types/audit";
import { CircularDependenciesRule } from "../../../audit/rules";

describe("CircularDependenciesRule", () => {
  const rule = new CircularDependenciesRule();

  it("should have correct metadata", () => {
    expect(rule.name).toBe("circular-dependencies");
    expect(rule.severity).toBe("error");
    expect(rule.enabled).toBe(true);
    expect(rule.category).toBe("architecture");
  });

  it("should detect simple circular dependency", () => {
    const graph: DependencyGraph = {
      nodes: new Set(["fileA.ts", "fileB.ts"]),
      edges: new Map([
        ["fileA.ts", new Set(["fileB.ts"])],
        ["fileB.ts", new Set(["fileA.ts"])],
      ]),
    };

    const context: AuditContext = {
      projectRoot: "/test",
      imports: [],
      dependencyGraph: graph,
      config: { rules: {} },
    };

    const violations = rule.validate(context);

    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].type).toBe("CIRCULAR_DEPENDENCY");
    expect(violations[0].severity).toBe("error");
  });

  it("should detect complex circular dependency", () => {
    const graph: DependencyGraph = {
      nodes: new Set(["fileA.ts", "fileB.ts", "fileC.ts"]),
      edges: new Map([
        ["fileA.ts", new Set(["fileB.ts"])],
        ["fileB.ts", new Set(["fileC.ts"])],
        ["fileC.ts", new Set(["fileA.ts"])],
      ]),
    };

    const context: AuditContext = {
      projectRoot: "/test",
      imports: [],
      dependencyGraph: graph,
      config: { rules: {} },
    };

    const violations = rule.validate(context);

    expect(violations.length).toBeGreaterThan(0);
  });

  it("should not detect cycles in acyclic graph", () => {
    const graph: DependencyGraph = {
      nodes: new Set(["fileA.ts", "fileB.ts", "fileC.ts"]),
      edges: new Map([
        ["fileA.ts", new Set(["fileB.ts"])],
        ["fileB.ts", new Set(["fileC.ts"])],
      ]),
    };

    const context: AuditContext = {
      projectRoot: "/test",
      imports: [],
      dependencyGraph: graph,
      config: { rules: {} },
    };

    const violations = rule.validate(context);

    expect(violations.length).toBe(0);
  });

  it("should return null for fix (not auto-fixable)", () => {
    const violation: any = {
      type: "CIRCULAR_DEPENDENCY",
      file: "test.ts",
    };

    const context: AuditContext = {
      projectRoot: "/test",
      imports: [],
      dependencyGraph: { nodes: new Set(), edges: new Map() },
      config: { rules: {} },
    };

    const fix = rule.fix(violation, context);
    expect(fix).toBeNull();
  });
});
