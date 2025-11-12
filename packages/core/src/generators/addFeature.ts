import * as path from "path";
import { ensureDir, trackWrite, capitalize } from "../utils/fs";
import { logger } from "../utils/logger";
import { Segment } from "../types";
import { createSegments, FEATURE_SEGMENTS, SegmentConfig } from "./segments";
import { throwIfInvalidName } from "../validators/nameValidator";
import { normalizeSegments } from "../validators/segmentValidator";

export interface AddFeatureOptions {
  name: string;
  segments?: string[]; // e.g., ['ui', 'models', 'api']
  rootDir?: string; // e.g., "src/features"
}

export interface AddFeatureResult {
  featureName: string;
  basePath: string;
  segments: Segment[];
  created: string[];
  skipped: string[];
}

export async function addFeature(
  options: AddFeatureOptions
): Promise<AddFeatureResult> {
  // Validate feature name
  throwIfInvalidName(options.name, "feature");

  // Normalize and validate segments
  const segments = normalizeSegments(options.segments);

  logger.step(`Creating feature: ${options.name}`);

  const rootDir = options.rootDir ?? "src/features";
  const basePath = path.join(process.cwd(), rootDir, options.name);

  const created: string[] = [];
  const skipped: string[] = [];

  await ensureDir(basePath);
  logger.debug(`Ensured directory: ${basePath}`);

  // README with questions (coach mode)
  await trackWrite(
    basePath,
    "README.md",
    `# Feature: ${options.name}

Before writing code, answer:

- What concrete problem does this feature solve?
- This feature is triggered by what user action?
- What **entities** does she use? (e.g. User, Campaign, Session...)
- What should be exposed in the **public API** (index.ts)?
- Does it depend on another feature? If so, does it make sense to extract something for entities/shared?
- Where is the boundary between UI (presentational) and model (state/logic)?

Fill out this README as if it were documentation for yourself in the future.
        `,
    created,
    skipped
  );

  // Index.ts as oficial exit port
  await trackWrite(
    basePath,
    "index.ts",
    `// Public API of feature "${options.name}".
//
// Export from here only what other layers can use.
// Examples (after implementing):
// export { ${capitalize(options.name)}Widget } from "./ui/${capitalize(
      options.name
    )}Widget";
// export * from "./model/selector";
//`,
    created,
    skipped
  );

  // Create segments directories
  await createSegments(basePath, segments, FEATURE_SEGMENTS, created, skipped);

  return {
    featureName: options.name,
    basePath,
    segments,
    created,
    skipped,
  };
}
