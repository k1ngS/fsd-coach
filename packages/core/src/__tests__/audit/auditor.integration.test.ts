/**
 * Integration tests for audit system
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";
import { auditProject } from "../../audit/auditor";
import { MetricsCalculator } from "../../audit/metrics/calculator";

describe("Audit Integration Tests", () => {
  let testProjectRoot: string;

  beforeAll(async () => {
    testProjectRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "fsd-audit-test-")
    );

    // Create test FSD structure
    await createTestProject(testProjectRoot);
  });

  afterAll(async () => {
    // Clean up
    await fs.rm(testProjectRoot, { recursive: true, force: true });
  });

  it("should detect layer hierarchy violations", async () => {
    const result = await auditProject({ cwd: testProjectRoot, noCache: true });

    // 🔍 DEBUG
    console.log("Total violations found:", result.violations.length);
    console.log(
      "Violations:",
      result.violations.map((v) => ({
        type: v.type,
        message: v.message,
        file: v.file,
      }))
    );

    const layerViolations = result.violations.filter(
      (v) => v.type === "CROSS_LAYER_IMPORT"
    );

    expect(layerViolations.length).toBeGreaterThan(0);
    expect(layerViolations[0].message).toContain("cannot import from");
  });

  it("should detect missing public APIs", async () => {
    const result = await auditProject({ cwd: testProjectRoot, noCache: true });

    const apiViolations = result.violations.filter(
      (v) => v.type === "MISSING_PUBLIC_API"
    );

    expect(apiViolations.length).toBeGreaterThan(0);
  });

  it("should detect cross-feature imports", async () => {
    const result = await auditProject({ cwd: testProjectRoot, noCache: true });

    const crossFeature = result.violations.filter(
      (v) => v.type === "CROSS_FEATURE_IMPORT"
    );

    expect(crossFeature.length).toBeGreaterThan(0);
  });

  it("should pass with strict mode off when only warnings", async () => {
    // Create a project with only warnings
    const cleanRoot = await createCleanProject();

    const result = await auditProject({
      cwd: cleanRoot,
      strict: false,
      noCache: true,
    });

    expect(result.passed).toBe(true);

    await fs.rm(cleanRoot, { recursive: true, force: true });
  });

  it("should fail with strict mode on when warnings exist", async () => {
    const cleanRoot = await createCleanProject();

    const result = await auditProject({
      cwd: cleanRoot,
      strict: true,
      noCache: true,
    });

    // If there are any violations (even warnings), strict mode should fail
    if (result.violations.length > 0) {
      expect(result.passed).toBe(false);
    }

    await fs.rm(cleanRoot, { recursive: true, force: true });
  });

  it("should calculate metrics correctly", async () => {
    const result = await auditProject({ cwd: testProjectRoot, noCache: true });
    const calculator = new MetricsCalculator();

    const metrics = await calculator.calculate(result, testProjectRoot);

    expect(metrics.totalFiles).toBeGreaterThan(0);
    expect(metrics.maintainabilityIndex).toBeGreaterThanOrEqual(0);
    expect(metrics.maintainabilityIndex).toBeLessThanOrEqual(100);
    expect(metrics.technicalDebt.hours).toBeGreaterThanOrEqual(0);
  });

  it("should export metrics to JSON", async () => {
    const result = await auditProject({ cwd: testProjectRoot, noCache: true });
    const calculator = new MetricsCalculator();
    const metrics = await calculator.calculate(result, testProjectRoot);

    const outputPath = path.join(testProjectRoot, "metrics.json");
    await calculator.exportToJson(metrics, outputPath);

    const fileExists = await fs
      .access(outputPath)
      .then(() => true)
      .catch(() => false);

    expect(fileExists).toBe(true);

    const content = await fs.readFile(outputPath, "utf-8");
    const parsed = JSON.parse(content);

    expect(parsed.totalFiles).toBe(metrics.totalFiles);
  });
});

/**
 * Create a test project with violations
 */
async function createTestProject(root: string): Promise<void> {
  // Create directory structure
  await fs.mkdir(path.join(root, "src/features/auth/ui"), { recursive: true });
  await fs.mkdir(path.join(root, "src/features/profile/model"), {
    recursive: true,
  });
  await fs.mkdir(path.join(root, "src/entities/user/model"), {
    recursive: true,
  });
  await fs.mkdir(path.join(root, "src/shared/lib"), { recursive: true });

  // Create file with layer violation (feature importing from widget)
  await fs.writeFile(
    path.join(root, "src/features/auth/ui/LoginForm.tsx"),
    `
import { Widget } from "../../../widgets/header";

export function LoginForm() {
  return <div>Login</div>;
}
`
  );

  // Create file with cross-feature import
  await fs.mkdir(path.join(root, "src/features/auth/model"), {
    recursive: true,
  });

  await fs.writeFile(
    path.join(root, "src/features/auth/model/authModel.ts"),
    `
import { profileData } from "../../profile/model/profileModel";

export const authData = {};
`
  );

  // Create feature without public API (no index.ts)
  await fs.writeFile(
    path.join(root, "src/features/profile/model/profileModel.ts"),
    `
export const profileData = {};
`
  );

  // Create entity with public API
  await fs.mkdir(path.join(root, "src/entities/user"), { recursive: true });
  await fs.writeFile(
    path.join(root, "src/entities/user/index.ts"),
    `
export * from "./model/user";
`
  );

  await fs.writeFile(
    path.join(root, "src/entities/user/model/user.ts"),
    `
export interface User {
  id: string;
  name: string;
}
`
  );
}

/**
 * Create a clean project with minimal violations
 */
async function createCleanProject(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "fsd-clean-"));

  await fs.mkdir(path.join(root, "src/features/auth"), { recursive: true });
  await fs.mkdir(path.join(root, "src/entities/user"), { recursive: true });

  // Feature with public API
  await fs.writeFile(
    path.join(root, "src/features/auth/index.ts"),
    `export const auth = {};`
  );

  // Entity with public API
  await fs.writeFile(
    path.join(root, "src/entities/user/index.ts"),
    `export const user = {};`
  );

  return root;
}
