import * as path from "path";
import { ensureDir, trackWrite, capitalize, FSOptions } from "../utils/fs";
import { throwIfInvalidName } from "../validators/nameValidator";
import { throwIfInvalidSegments } from "../validators/segmentValidator";
import { logger } from "../utils/logger";
import { GeneratorOptions, GeneratorResult, Segment } from "../types";
import { createSegments, PAGE_SEGMENTS } from "./segments";

export interface PageGeneratorOptions extends GeneratorOptions {
  route?: string; // Optional: /path/to/page
}

export interface PageGeneratorResult extends GeneratorResult {
  route?: string;
}

export async function addPage(
  options: PageGeneratorOptions
): Promise<PageGeneratorResult> {
  throwIfInvalidName(options.name, "page");

  const segments =
    options.segments && options.segments.length > 0
      ? options.segments
      : ["ui", "model"];

  throwIfInvalidSegments(segments);

  logger.step(`Creating page: ${options.name}`);

  const rootDir = options.rootDir ?? "src/pages";
  const cwd = options.cwd ?? process.cwd();
  const basePath = path.join(cwd, rootDir, options.name);

  const created: string[] = [];
  const skipped: string[] = [];
  const fsOptions: FSOptions = { dryRun: options.dryRun };

  // Generate default route if not provided
  const defaultRoute = `/${options.name
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "")}`;
  const route = options.route || defaultRoute;

  await ensureDir(basePath, fsOptions);
  logger.debug(`Ensured directory: ${basePath}`);

  // Page README with routing info
  await trackWrite(
    basePath,
    "README.md",
    `# Page: ${options.name}

A *page* is a **route in your application** that aggregates features, entities, and widgets.

## Route

\`\`\`
${route}
\`\`\`

## Purpose

What is the main goal of this page? What problem does it solve for the user?

## Structure

This page uses:

### Features
- [ ] List features used here

### Entities
- [ ] List entities displayed/edited here

### Widgets
- [ ] List reusable widgets used here

## State Management

How is state managed on this page?
- Component state?
- Process state?
- URL parameters?

## Navigation

What routes can users navigate to from here?

## Testing Scenarios

List important user flows to test:
- [ ] Scenario 1
- [ ] Scenario 2
`,
    created,
    skipped,
    fsOptions
  );

  // index.ts as the page component export
  await trackWrite(
    basePath,
    "index.ts",
    `// Page component: ${options.name}
// Route: ${route}
//
// This page aggregates multiple features and widgets
// Export the main page component here
//
// Example:
// export { default } from "./ui/${capitalize(options.name)}Page";
// Or if using named export:
// export { ${capitalize(options.name)}Page } from "./ui/${capitalize(options.name)}Page";
`,
    created,
    skipped,
    fsOptions
  );

  // Create segments directories
  await createSegments(
    basePath,
    segments as Segment[],
    PAGE_SEGMENTS,
    created,
    skipped,
    fsOptions
  );

  return {
    name: options.name,
    basePath,
    segments: segments as Segment[],
    route,
    created,
    skipped,
  };
}
