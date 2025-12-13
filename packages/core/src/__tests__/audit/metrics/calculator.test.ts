/**
 * Unit tests for MetricsCalculator
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";
import { AuditResult } from "../../../types";
import { MetricsCalculator } from "../../../audit/metrics/calculator";

describe("MetricsCalculator", () => {
  const calculator = new MetricsCalculator();
  let testRoot: string;

  beforeAll(async () => {
    testRoot = await fs.mkdtemp(path.join(os.tmpdir(), "metrics-test-"));

    // Create test structure
    await fs.mkdir(path.join(testRoot, "src/features/auth"), {
      recursive: true,
    });
    await fs.mkdir(path.join(testRoot, "src/entities/user"), {
      recursive: true,
    });

    // Create some files
    await fs.writeFile(
      path.join(testRoot, "src/features/auth/index.ts"),
      `export const auth = () => {
  // Some code here
  return true;
};`
    );

    await fs.writeFile(
      path.join(testRoot, "src/entities/user/model.ts"),
      `export interface User {
  id: string;
  name: string;
}`
    );
  });

  afterAll(async () => {
    await fs.rm(testRoot, { recursive: true, force: true });
  });

  it("should calculate basic metrics", async () => {
    const auditResult: AuditResult = {
      passed: true,
      totalFiles: 2,
      violations: [],
      summary: { errors: 0, warnings: 0, infos: 0 },
      scannedAt: new Date(),
    };

    const metrics = await calculator.calculate(auditResult, testRoot);

    expect(metrics.totalFiles).toBe(2);
    expect(metrics.totalLines).toBeGreaterThan(0);
    expect(metrics.avgLinesPerFile).toBeGreaterThan(0);
    expect(metrics.maintainabilityIndex).toBeGreaterThanOrEqual(0);
    expect(metrics.maintainabilityIndex).toBeLessThanOrEqual(100);
  });

  it("should calculate public API coverage", async () => {
    const auditResult: AuditResult = {
      passed: true,
      totalFiles: 2,
      violations: [],
      summary: { errors: 0, warnings: 0, infos: 0 },
      scannedAt: new Date(),
    };

    const metrics = await calculator.calculate(auditResult, testRoot);

    // We have 2 slices, 1 with index.ts
    expect(metrics.publicApiCoverage).toBe(50);
  });

  it("should estimate technical debt", async () => {
    const auditResult: AuditResult = {
      passed: false,
      totalFiles: 2,
      violations: [
        {
          type: "CIRCULAR_DEPENDENCY",
          severity: "error",
          message: "Circular dep",
          file: "test.ts",
        },
        {
          type: "MISSING_PUBLIC_API",
          severity: "warning",
          message: "Missing API",
          file: "test2.ts",
        },
      ],
      summary: { errors: 1, warnings: 1, infos: 0 },
      scannedAt: new Date(),
    };

    const metrics = await calculator.calculate(auditResult, testRoot);

    expect(metrics.technicalDebt.hours).toBeGreaterThan(0);
    expect(metrics.technicalDebt.issues).toBe(2);
  });

  it("should export metrics to JSON", async () => {
    const auditResult: AuditResult = {
      passed: true,
      totalFiles: 2,
      violations: [],
      summary: { errors: 0, warnings: 0, infos: 0 },
      scannedAt: new Date(),
    };

    const metrics = await calculator.calculate(auditResult, testRoot);
    const outputPath = path.join(testRoot, "metrics.json");

    await calculator.exportToJson(metrics, outputPath);

    const content = await fs.readFile(outputPath, "utf-8");
    const parsed = JSON.parse(content);

    expect(parsed.totalFiles).toBe(metrics.totalFiles);
    expect(parsed.maintainabilityIndex).toBe(metrics.maintainabilityIndex);
  });

  it("should export metrics to CSV", async () => {
    const auditResult: AuditResult = {
      passed: true,
      totalFiles: 2,
      violations: [],
      summary: { errors: 0, warnings: 0, infos: 0 },
      scannedAt: new Date(),
    };

    const metrics = await calculator.calculate(auditResult, testRoot);
    const outputPath = path.join(testRoot, "metrics.csv");

    await calculator.exportToCsv(metrics, outputPath);

    const content = await fs.readFile(outputPath, "utf-8");

    expect(content).toContain("Metric,Value");
    expect(content).toContain("Total Files");
    expect(content).toContain("Maintainability Index");
  });

  it("should calculate maintainability index correctly", async () => {
    // Test with violations
    const badAuditResult: AuditResult = {
      passed: false,
      totalFiles: 10,
      violations: Array(20).fill({
        type: "CROSS_LAYER_IMPORT",
        severity: "error",
        message: "Test",
        file: "test.ts",
      }),
      summary: { errors: 20, warnings: 0, infos: 0 },
      scannedAt: new Date(),
    };

    const metrics = await calculator.calculate(badAuditResult, testRoot);

    // With many violations, maintainability should be low
    expect(metrics.maintainabilityIndex).toBeLessThan(70);
  });
});
