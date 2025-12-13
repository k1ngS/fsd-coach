import * as path from "path";
import { ensureDir, trackWrite, capitalize, FSOptions } from "../utils/fs";
import { throwIfInvalidName } from "../validators/nameValidator";
import { throwIfInvalidSegments } from "../validators/segmentValidator";
import { logger } from "../utils/logger";
import { GeneratorOptions, GeneratorResult, Segment } from "../types";
import { createSegments, WIDGET_SEGMENTS } from "./segments";

export async function addWidget(
  options: GeneratorOptions
): Promise<GeneratorResult> {
  throwIfInvalidName(options.name, "widget");

  const segments =
    options.segments && options.segments.length > 0
      ? options.segments
      : ["ui", "model"];

  throwIfInvalidSegments(segments);

  logger.step(`Creating widget: ${options.name}`);

  const rootDir = options.rootDir ?? "src/widgets";
  const cwd = options.cwd ?? process.cwd();
  const basePath = path.join(cwd, rootDir, options.name);

  const created: string[] = [];
  const skipped: string[] = [];
  const fsOptions: FSOptions = { dryRun: options.dryRun };

  await ensureDir(basePath, fsOptions);
  logger.debug(`Ensured directory: ${basePath}`);

  // Widget README
  await trackWrite(
    basePath,
    "README.md",
    `# Widget: ${options.name}

A *widget* is a **reusable UI component** used across features and pages.

Think before implementing:

- What **props** does this widget accept?
- What **state** does it manage internally (if any)?
- Is it a "dumb" presentational component or "smart" with business logic?
- Which **entities** does it interact with?
- How does it communicate back to its parent?

Document here as if teaching someone to use this widget.

## Props

\`\`\`typescript
interface ${capitalize(options.name)}Props {
  // Define your props here
}
\`\`\`

## Usage Example

\`\`\`tsx
import { ${capitalize(options.name)} } from "@/widgets/${options.name}";

export function MyComponent() {
  return <${capitalize(options.name)} />;
}
\`\`\`

## Styling

Document your styling approach (CSS modules, Tailwind, Styled Components, etc.)
`,
    created,
    skipped,
    fsOptions
  );

  // index.ts Public API for widget
  await trackWrite(
    basePath,
    "index.ts",
    `// Public API of widget "${options.name}"
//
// Export the main component and any supporting types
//
// Example:
// export { ${capitalize(options.name)} } from "./ui/${capitalize(options.name)}";
// export type { ${capitalize(options.name)}Props } from "./ui/${capitalize(options.name)}";
`,
    created,
    skipped,
    fsOptions
  );

  // Create segments directories
  await createSegments(
    basePath,
    segments as Segment[],
    WIDGET_SEGMENTS,
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
