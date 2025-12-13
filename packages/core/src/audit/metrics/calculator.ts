/**
 * Metrics calculator for FSD projects
 */

import { promises as fs } from "fs";
import * as path from "path";
import { AuditMetrics } from "../../types/audit";
import { DependencyGraphAnalyzer } from "../utils/graph";
import { AuditResult } from "../../types";

export class MetricsCalculator {
  /**
   * Calculate comprehensive project metrics
   */
  async calculate(
    auditResult: AuditResult,
    projectRoot: string
  ): Promise<AuditMetrics> {
    const srcDir = path.join(projectRoot, "src");

    const [totalLines, publicApiCoverage, dependencyGraph] = await Promise.all([
      this.countTotalLines(srcDir),
      this.calculatePublicApiCoverage(srcDir),
      this.buildDependencyGraph(auditResult),
    ]);

    const analyzer = new DependencyGraphAnalyzer(dependencyGraph);
    const cycles = analyzer.detectCycles();
    const complexityScore = analyzer.getComplexityScore();

    const layerViolations = auditResult.violations.filter(
      (v) =>
        v.type === "CROSS_LAYER_IMPORT" || v.type === "SHARED_IMPORTS_LAYER"
    ).length;

    const maintainabilityIndex = this.calculateMaintainability({
      totalLines,
      complexityScore,
      violationCount: auditResult.violations.length,
      avgLinesPerFile: totalLines / auditResult.totalFiles,
    });

    const technicalDebt = this.estimateTechnicalDebt(auditResult.violations);

    return {
      cyclomaticComplexity: complexityScore,
      dependencyCount: dependencyGraph.edges.size,
      circularDependencyCount: cycles.length,
      layerViolations,
      totalFiles: auditResult.totalFiles,
      totalLines,
      avgLinesPerFile: totalLines / auditResult.totalFiles,
      publicApiCoverage,
      maintainabilityIndex,
      technicalDebt,
      measuredAt: new Date(),
    };
  }

  /**
   * Count total lines of code
   */
  private async countTotalLines(dir: string): Promise<number> {
    let total = 0;

    async function walk(directory: string) {
      const entries = await fs.readdir(directory, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (entry.name === "node_modules" || entry.name === ".git") {
          continue;
        }

        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
            const content = await fs.readFile(fullPath, "utf-8");
            total += content.split("\n").length;
          }
        }
      }
    }

    await walk(dir);
    return total;
  }

  /**
   * Calculate % of slices with public API
   */
  private async calculatePublicApiCoverage(srcDir: string): Promise<number> {
    let totalSlices = 0;
    let slicesWithApi = 0;

    const layers = ["features", "entities", "widgets"];

    for (const layer of layers) {
      const layerDir = path.join(srcDir, layer);

      try {
        const slices = await fs.readdir(layerDir, { withFileTypes: true });

        for (const slice of slices) {
          if (slice.isDirectory()) {
            totalSlices++;

            const slicePath = path.join(layerDir, slice.name);
            const hasIndex = await this.hasPublicApi(slicePath);

            if (hasIndex) {
              slicesWithApi++;
            }
          }
        }
      } catch {
        continue;
      }
    }

    return totalSlices > 0 ? (slicesWithApi / totalSlices) * 100 : 100;
  }

  private async hasPublicApi(slicePath: string): Promise<boolean> {
    const indexFiles = ["index.ts", "index.tsx", "index.js", "index.jsx"];

    for (const indexFile of indexFiles) {
      try {
        await fs.access(path.join(slicePath, indexFile));
        return true;
      } catch {
        continue;
      }
    }

    return false;
  }

  /**
   * Build dependency graph from audit results
   */
  private async buildDependencyGraph(auditResult: AuditResult) {
    const nodes = new Set<string>();
    const edges = new Map<string, Set<string>>();

    for (const violation of auditResult.violations) {
      nodes.add(violation.file);

      if (!edges.has(violation.file)) {
        edges.set(violation.file, new Set());
      }
    }

    return { nodes, edges };
  }

  /**
   * Calculate maintainability index (0-100)
   * Higher is better
   */
  private calculateMaintainability(params: {
    totalLines: number;
    complexityScore: number;
    violationCount: number;
    avgLinesPerFile: number;
  }): number {
    const { totalLines, complexityScore, violationCount, avgLinesPerFile } =
      params;

    // Simplified maintainability index formula
    let score = 100;

    // Penalize for violations
    score -= violationCount * 2;

    // Penalize for complexity
    score -= complexityScore * 0.5;

    // Penalize for large files
    if (avgLinesPerFile > 500) {
      score -= (avgLinesPerFile - 500) / 50;
    }

    // Penalize for large project without proper structure
    if (totalLines > 10000 && violationCount > 10) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Estimate technical debt in hours
   */
  private estimateTechnicalDebt(violations: any[]): {
    hours: number;
    issues: number;
  } {
    let hours = 0;

    for (const violation of violations) {
      switch (violation.type) {
        case "CIRCULAR_DEPENDENCY":
          hours += 4; // 4 hours to refactor circular dep
          break;
        case "CROSS_LAYER_IMPORT":
          hours += 2; // 2 hours to fix layer violation
          break;
        case "CROSS_FEATURE_IMPORT":
          hours += 3; // 3 hours to extract to entity
          break;
        case "MISSING_PUBLIC_API":
          hours += 0.5; // 30 min to create index.ts
          break;
        case "DIRECT_SEGMENT_IMPORT":
          hours += 1; // 1 hour to refactor imports
          break;
        default:
          hours += 1;
      }
    }

    return {
      hours: Math.round(hours * 10) / 10,
      issues: violations.length,
    };
  }

  /**
   * Export metrics to JSON
   */
  async exportToJson(metrics: AuditMetrics, outputPath: string): Promise<void> {
    const json = JSON.stringify(metrics, null, 2);
    await fs.writeFile(outputPath, json, "utf-8");
  }

  /**
   * Export metrics to CSV
   */
  async exportToCsv(metrics: AuditMetrics, outputPath: string): Promise<void> {
    const csv = [
      "Metric,Value",
      `Cyclomatic Complexity,${metrics.cyclomaticComplexity}`,
      `Dependency Count,${metrics.dependencyCount}`,
      `Circular Dependencies,${metrics.circularDependencyCount}`,
      `Layer Violations,${metrics.layerViolations}`,
      `Total Files,${metrics.totalFiles}`,
      `Total Lines,${metrics.totalLines}`,
      `Avg Lines Per File,${metrics.avgLinesPerFile.toFixed(2)}`,
      `Public API Coverage,${metrics.publicApiCoverage.toFixed(2)}%`,
      `Maintainability Index,${metrics.maintainabilityIndex.toFixed(2)}`,
      `Technical Debt Hours,${metrics.technicalDebt.hours}`,
      `Technical Debt Issues,${metrics.technicalDebt.issues}`,
    ].join("\n");

    await fs.writeFile(outputPath, csv, "utf-8");
  }
}
