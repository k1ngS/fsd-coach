import * as path from "path";
import { ensureDir, trackWrite, capitalize, FSOptions } from "../utils/fs";
import { throwIfInvalidName } from "../validators/nameValidator";
import { throwIfInvalidSegments } from "../validators/segmentValidator";
import { logger } from "../utils/logger";
import { GeneratorOptions, GeneratorResult, Segment } from "../types";
import { createSegments, PROCESS_SEGMENTS } from "./segments";

export async function addProcess(
  options: GeneratorOptions
): Promise<GeneratorResult> {
  throwIfInvalidName(options.name, "process");

  const segments =
    options.segments && options.segments.length > 0
      ? options.segments
      : ["model", "lib", "api"];

  throwIfInvalidSegments(segments);

  logger.step(`Creating process: ${options.name}`);

  const rootDir = options.rootDir ?? "src/processes";
  const cwd = options.cwd ?? process.cwd();
  const basePath = path.join(cwd, rootDir, options.name);

  const created: string[] = [];
  const skipped: string[] = [];
  const fsOptions: FSOptions = { dryRun: options.dryRun };

  await ensureDir(basePath, fsOptions);
  logger.debug(`Ensured directory: ${basePath}`);

  // Process README
  await trackWrite(
    basePath,
    "README.md",
    `# Process: ${options.name}

A *process* is a **global system** shared across the application.

Think before implementing:

- What **responsibility** does this system have?
- What **state** does it manage?
- Which **features** and **entities** depend on this?
- How do they **communicate** with this process? (events, subscriptions, actions)
- What are the **invariants** that must always be true?

Document here as if writing a specification for the entire system.

## System Responsibilities

- [ ] Responsibility 1
- [ ] Responsibility 2
- [ ] Responsibility 3

## Public API

\`\`\`typescript
// What can other parts of the app import from here?
export { /* types, actions, hooks, etc */ }
\`\`\`

## Events/Hooks

Document any events or subscription hooks this process emits.

## Usage Example

\`\`\`typescript
import { /* your exports */ } from "@/processes/${options.name}";

// How to use this process
\`\`\`

## Related

- Entities: (which entities this process works with)
- Features: (which features depend on this)
`,
    created,
    skipped,
    fsOptions
  );

  // index.ts Public API for process
  await trackWrite(
    basePath,
    "index.ts",
    `// Public API of process "${options.name}"
//
// Export from here only what other features/entities can use
// Keep implementation details private to this process
//
// Example:
// export { use${capitalize(options.name)} } from "./model/hook";
// export type { ${capitalize(options.name)}State } from "./model/types";
// export { ${capitalize(options.name)}Events } from "./api/events";
`,
    created,
    skipped,
    fsOptions
  );

  // Create segments directories
  await createSegments(
    basePath,
    segments as Segment[],
    PROCESS_SEGMENTS,
    created,
    skipped,
    fsOptions
  );

  return {
    name: options.name,
    basePath,
    segments: segments as Segment[],
    created,
    skipped,
  };
}
