import * as path from "path";
import { ensureDir, trackWrite, capitalize } from "../utils/fs";
import { throwIfInvalidName } from "../validators/nameValidator";
import { throwIfInvalidSegments } from "../validators/segmentValidator";
import { logger } from "../utils/logger";
import { Segment } from "../types";
import { createSegments, ENTITY_SEGMENTS } from "./segments";

export interface AddEntityOptions {
  name: string;
  segments?: string[];
  rootDir?: string;
}

export interface AddEntityResult {
  entityName: string;
  basePath: string;
  segments: Segment[];
  created: string[];
  skipped: string[];
}

export async function addEntity(
  options: AddEntityOptions
): Promise<AddEntityResult> {
  throwIfInvalidName(options.name, "entity");

  const segments =
    options.segments && options.segments.length > 0
      ? options.segments
      : ["model", "ui"];

  throwIfInvalidSegments(segments);

  logger.step(`Creating entity: ${options.name}`);

  const rootDir = options.rootDir ?? "src/entities";
  const basePath = path.join(process.cwd(), rootDir, options.name);

  const created: string[] = [];
  const skipped: string[] = [];

  await ensureDir(basePath);
  logger.debug(`Ensured directory: ${basePath}`);

  // Entity README
  await trackWrite(
    basePath,
    "README.md",
    `# Entity: ${options.name}

An *entity* represents a reusable domain concept.

Answer before implementing:

- What does "${options.name}" represent in the business?
- What properties are mandatory? (e.g. id, name, status...)
- Which invariants/rules should ALWAYS be true? (e.g. cannot have negative xp)
- Does this entity know any features? (If so, there is something wrong -- dependency inversion here.)

Document here as if it were a quick reference for the team/future you.
`,
    created,
    skipped
  );

  // index.ts Public API for entity
  await trackWrite(
    basePath,
    "index.ts",
    `// Public API of entity "${options.name}"
// Ideas of what can live here (once you define it):
// - Entity Type/Interface (${capitalize(options.name)})
// - Pure entity-related helper functions
// - Specific simple UI components to represent this entity
//
// Example (for you to fill in later):
// export interface ${capitalize(options.name)} { id: string; /* ... */}
// export { ${capitalize(options.name)}Badge } from "./ui/${capitalize(
      options.name
    )}Badge";
`,
    created,
    skipped
  );

  // Create segments directories
  await createSegments(
    basePath,
    segments as Segment[],
    ENTITY_SEGMENTS,
    created,
    skipped
  );

  return {
    entityName: options.name,
    basePath,
    segments: segments as Segment[],
    created,
    skipped,
  };
}
