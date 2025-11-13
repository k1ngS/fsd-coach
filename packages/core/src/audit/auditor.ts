import { promises as fs } from "fs";
import * as path from "path";
import {
  AuditResult,
  AuditOptions,
  Violation,
  ImportStatement,
  Segment,
} from "../types";
import { extractImports, parseFSDPath } from "./importParser";
import { checkLayerImports, checkSharedImports } from "./rules/layerImports";
import { checkPublicApi, checkDirectSegmentImports } from "./rules/publicApi";
import { checkCrossFeatureImports } from "./rules/featureImports";
import { logger } from "../utils/logger";

async function* walkDirectory(dir: string): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip node_modules, .git, dist, etc.
    if (
      entry.name === "node_modules" ||
      entry.name === ".git" ||
      entry.name === "dist" ||
      entry.name === "build" ||
      entry.name === ".next"
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      yield* walkDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
        yield fullPath;
      }
    }
  }
}

export async function auditProject(
  options: AuditOptions = {}
): Promise<AuditResult> {
  const projectRoot = options.cwd ?? process.cwd();
  const srcDir = path.join(projectRoot, "src");

  logger.step("Starting FSD architecture audit...");

  // Check if src directory exists
  try {
    await fs.access(srcDir);
  } catch {
    return {
      passed: false,
      totalFiles: 0,
      violations: [
        {
          type: "INVALID_LAYER",
          severity: "error",
          message: "No src/ directory found",
          file: projectRoot,
          suggestion: 'Initialize project with "fsd-coach init"',
        },
      ],
      summary: { errors: 1, warnings: 0, infos: 0 },
      scannedAt: new Date(),
    };
  }

  const violations: Violation[] = [];
  const allImports: ImportStatement[] = [];
  let totalFiles = 0;

  // Scan all TypeScript/JavaScript files
  logger.info("Scanning files...");

  for await (const filePath of walkDirectory(srcDir)) {
    totalFiles++;
    logger.debug(`Scanning: ${path.relative(projectRoot, filePath)}`);

    try {
      const imports = await extractImports(filePath);
      allImports.push(...imports);

      for (const imp of imports) {
        const parsed = parseFSDPath(imp.file, projectRoot);
        imp.layer = parsed.layer;
        imp.slice = parsed.slice;
        imp.segment = parsed.segment as Segment | undefined;
      }
    } catch (error) {
      logger.debug(`Failed to scan ${filePath}: ${error}`);
    }
  }

  logger.info(`Scanned ${totalFiles} files`);
  logger.step("Checking FSD rules...");

  // Apply all rules
  violations.push(...checkLayerImports(allImports, projectRoot));
  violations.push(...checkSharedImports(allImports, projectRoot));
  violations.push(...checkDirectSegmentImports(allImports, projectRoot));
  violations.push(...checkCrossFeatureImports(allImports, projectRoot));

  // Check public APIs for each slice
  logger.info("Checking public APIs...");
  const layers = ["features", "entities", "widgets"];

  for (const layer of layers) {
    const layerDir = path.join(srcDir, layer);

    try {
      const slices = await fs.readdir(layerDir, { withFileTypes: true });

      for (const slice of slices) {
        if (slice.isDirectory()) {
          const slicePath = path.join(layerDir, slice.name);
          const apiViolations = await checkPublicApi(slicePath, projectRoot);
          violations.push(...apiViolations);
        }
      }
    } catch {
      // Layer doesn't exist, skip
      continue;
    }
  }

  // Calculate summary
  const summary = {
    errors: violations.filter((v) => v.severity === "error").length,
    warnings: violations.filter((v) => v.severity === "warning").length,
    infos: violations.filter((v) => v.severity === "info").length,
  };

  const passed = options.strict
    ? summary.errors === 0 && summary.warnings === 0
    : summary.errors === 0;

  logger.step("Audit complete");

  return {
    passed,
    totalFiles,
    violations,
    summary,
    scannedAt: new Date(),
  };
}
