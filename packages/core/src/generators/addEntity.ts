import * as path from "path";
import { ensureDir, writeFileSafe, trackWrite, capitalize } from "../utils/fs";

export interface AddEntityOptions {
    name: string;
    segments?: string[]; // e.g. ["model", "ui"]
    rootDir?: string;    // default: "src/entities"
}

export interface AddEntityResult {
    entityName: string;
    basePath: string;
    segments: string[];
    created: string[];
    skipped: string[];
}

export async function addEntity(options: AddEntityOptions): Promise<AddEntityResult> {
    const segments = options.segments && options.segments.length
        ? options.segments
        : ["model", "ui"]; // default: definition + value

    const rootDir = options.rootDir ?? "src/entities";
    const basePath = path.join(process.cwd(), rootDir, options.name);

    const created: string[] = [];
    const skipped: string[] = [];

    await ensureDir(basePath);

    // Entity README
    await trackWrite(
        basePath,
        "README.md",
        `# Entity: ${options.name}
An *entity* represents a reusable domain concept.

Answer before implementing:

- What does "${options.name}" represent in the business?
- What properties are mandatory? (e.g. id, name, status...)
- Which invariants/reglas should ALWAYS be true? (e.g. cannot have negative xp)
- Does this entity know any features? (If so, there is something wrong -- dependence inversion here.)

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
// - Pure entity-related helpers functions
// - Specific simple UI components to represent this entity
//
// Example (for you to fill in later):
// export interface ${capitalize(options.name)} { id: string; /* ... */}
// export { ${capitalize(options.name)}Badge } from "./ui/${capitalize(options.name)}Badge";
`,
        created,
        skipped
    );

    // Create segments (model/ui/lib etc)
    for (const seg of segments) {
        const dir = path.join(basePath, seg);
        await ensureDir(dir);
        created.push(path.relative(process.cwd(), dir));

        await writeSegmentReadme(basePath, seg, created, skipped);
    }

    return {
        entityName: options.name,
        basePath,
        segments,
        created,
        skipped
    };
}

async function writeSegmentReadme(
    basePath: string,
    segment: string,
    created: string[],
    skipped: string[]
) {
    const map: Record<string, string> = {
        model: `# model/
Entity type definitions, schema, validations, and domain logic.

- No UI dependency.
- No direct API call.
- Can be used on both the front and back if you share types.
`,
        ui: `# ui/
Visual components to represent this entity.

Examples:
- User avatar
- Status badge
- Campaign card

Rules:
- They are focused on displaying entity data.
- No complex business rules here.
`,
        lib: `# lib/
Helpers specific to this entity.

If it gets too generic → move to shared/lib.
`
    };

    const content = map[segment];
    if (!content) return;

    await trackWrite(basePath, `${segment}/README.md`, content, created, skipped);
}