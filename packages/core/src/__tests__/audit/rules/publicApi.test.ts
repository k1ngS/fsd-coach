/**
 * Unit tests for PublicApiRule
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";
import { AuditContext } from "../../../types/audit";
import { ImportStatement } from "../../../types";
import { PublicApiRule } from "../../../audit/rules";

describe("PublicApiRule", () => {
  const rule = new PublicApiRule();
  let testRoot: string;

  beforeAll(async () => {
    testRoot = await fs.mkdtemp(path.join(os.tmpdir(), "api-rule-test-"));

    // Create feature without index.ts
    await fs.mkdir(path.join(testRoot, "src/features/noapi"), {
      recursive: true,
    });

    // Create feature with index.ts
    await fs.mkdir(path.join(testRoot, "src/features/withapi"), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(testRoot, "src/features/withapi/index.ts"),
      "export {}"
    );
  });

  afterAll(async () => {
    await fs.rm(testRoot, { recursive: true, force: true });
  });

  it("should detect missing public API", async () => {
    const context: AuditContext = {
      projectRoot: testRoot,
      imports: [],
      dependencyGraph: { nodes: new Set(), edges: new Map() },
      config: { rules: {} },
    };

    const violations = await rule.validate(context);

    const missingApi = violations.filter(
      (v) => v.type === "MISSING_PUBLIC_API"
    );

    expect(missingApi.length).toBeGreaterThan(0);
    expect(missingApi[0].message).toContain("noapi");
  });

  it("should not flag slices with public API", async () => {
    const context: AuditContext = {
      projectRoot: testRoot,
      imports: [],
      dependencyGraph: { nodes: new Set(), edges: new Map() },
      config: { rules: {} },
    };

    const violations = await rule.validate(context);

    const withApiViolations = violations.filter((v) =>
      v.message.includes("withapi")
    );

    expect(withApiViolations.length).toBe(0);
  });

  it("should detect direct segment imports", async () => {
    const imports: ImportStatement[] = [
      {
        source: "../feature-b/ui/Component",
        file: path.join(testRoot, "src/features/feature-a/ui/App.tsx"),
        line: 1,
        isRelative: true,
        layer: "features",
        slice: "feature-a",
      },
    ];

    const context: AuditContext = {
      projectRoot: testRoot,
      imports,
      dependencyGraph: { nodes: new Set(), edges: new Map() },
      config: { rules: {} },
    };

    const violations = await rule.validate(context);

    const directImports = violations.filter(
      (v) => v.type === "DIRECT_SEGMENT_IMPORT"
    );

    expect(directImports.length).toBeGreaterThan(0);
  });

  it("should provide auto-fix for missing API", () => {
    const violation: any = {
      type: "MISSING_PUBLIC_API",
      file: path.join(testRoot, "src/features/noapi"),
    };

    const context: AuditContext = {
      projectRoot: testRoot,
      imports: [],
      dependencyGraph: { nodes: new Set(), edges: new Map() },
      config: { rules: {} },
    };

    const fix = rule.fix(violation, context);

    expect(fix).not.toBeNull();
    expect(fix?.changes.length).toBeGreaterThan(0);
    expect(fix?.changes[0].file).toContain("index.ts");
    expect(fix?.changes[0].type).toBe("insert");
  });
});
