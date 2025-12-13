/**
 * Unit tests for LayerImportsRule
 */

import { describe, it, expect } from "vitest";
import { AuditContext } from "../../../types/audit";
import { ImportStatement } from "../../../types";
import { LayerImportsRule } from "../../../audit/rules";

describe("LayerImportsRule", () => {
  const rule = new LayerImportsRule();

  it("should detect feature importing from widget", () => {
    const imports: ImportStatement[] = [
      {
        source: "../../widgets/header",
        file: "/test/src/features/auth/ui/LoginForm.tsx",
        line: 1,
        isRelative: true,
        layer: "features",
        slice: "auth",
        segment: "ui",
      },
    ];

    const context: AuditContext = {
      projectRoot: "/test",
      imports,
      dependencyGraph: { nodes: new Set(), edges: new Map() },
      config: { rules: {} },
    };

    const violations = rule.validate(context);

    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].type).toBe("CROSS_LAYER_IMPORT");
    expect(violations[0].message).toContain("features");
    expect(violations[0].message).toContain("widgets");
  });

  it("should allow entity importing from shared", () => {
    const imports: ImportStatement[] = [
      {
        source: "../../shared/lib/utils",
        file: "/test/src/entities/user/model/user.ts",
        line: 1,
        isRelative: true,
        layer: "entities",
        slice: "user",
        segment: "model",
      },
    ];

    const context: AuditContext = {
      projectRoot: "/test",
      imports,
      dependencyGraph: { nodes: new Set(), edges: new Map() },
      config: { rules: {} },
    };

    const violations = rule.validate(context);

    expect(violations.length).toBe(0);
  });

  it("should allow widget importing from entities", () => {
    const imports: ImportStatement[] = [
      {
        source: "../../entities/user",
        file: "/test/src/widgets/header/ui/Header.tsx",
        line: 1,
        isRelative: true,
        layer: "widgets",
        slice: "header",
        segment: "ui",
      },
    ];

    const context: AuditContext = {
      projectRoot: "/test",
      imports,
      dependencyGraph: { nodes: new Set(), edges: new Map() },
      config: { rules: {} },
    };

    const violations = rule.validate(context);

    expect(violations.length).toBe(0);
  });

  it("should ignore non-relative imports", () => {
    const imports: ImportStatement[] = [
      {
        source: "react",
        file: "/test/src/features/auth/ui/LoginForm.tsx",
        line: 1,
        isRelative: false,
        layer: "features",
      },
    ];

    const context: AuditContext = {
      projectRoot: "/test",
      imports,
      dependencyGraph: { nodes: new Set(), edges: new Map() },
      config: { rules: {} },
    };

    const violations = rule.validate(context);

    expect(violations.length).toBe(0);
  });
});
