import * as path from "path";
import { ensureDir, writeFileSafe, trackWrite, capitalize } from "../utils/fs";

export interface AddFeatureOptions {
    name: string;
    segments?: string[]; // e.g., ['ui', 'models', 'api']
    rootDir?: string;   // e.g., "src/features"
}

export interface AddFeatureResult {
    featureName: string;
    basePath: string;
    segments: string[];
    created: string[];
    skipped: string[];
}

export async function addFeature(options: AddFeatureOptions): Promise<AddFeatureResult> {
    const segments = options.segments && options.segments.length
        ? options.segments
        : ["ui", "model", "api"]; // default

    const rootDir = options.rootDir ?? "src/features";
    const basePath = path.join(process.cwd(), rootDir, options.name);

    const created: string[] = [];
    const skipped: string[] = [];

    await ensureDir(basePath);

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
// export { ${capitalize(options.name)}Widget } from "./ui/${capitalize(options.name)}Widget";
// export * from "./model/selector";
//`
        ,
        created,
        skipped
    );

    // Create segments directories
    for (const seg of segments) {
        const dir = path.join(basePath, seg);
        await ensureDir(dir);
        created.push(path.relative(process.cwd(), dir));

        // Optional: README for segment
        await writeSegmentReadme(basePath, seg, created, skipped);
    }

    return {
        featureName: options.name,
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
        ui: `# ui/
        
Specific visual components of the feature.
        
- Dont' put heavy business rules here.
- Use props and data coming from the model.
- If something here becomes generic, move it to shared/ui.
        `,
        model: `# model/
        
State, hooks and business logic of this feature.

- Can call APIs (via api/) and orchestrate data.
- Does not render anything directly.
- Must be testable without relying on UI.
        `,
        api: `# api/
        
HTTP calls/clients related only to this feature.

- Encapsulate URLs, parameters and data adaptation.
- Do not use directly in UI components.
        `,
        lib: `# lib/

Helpers specific to this feature.

- Reusable stuff **inside** the feature.
- If it becomes too generic -> move to shared/lib.
        `,
    };

    const content = map[segment];
    if (!content) return;

    await trackWrite(basePath, `${segment}/README.md`, content, created, skipped);
}
