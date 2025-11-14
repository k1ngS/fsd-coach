import * as path from "path";
import { ensureDir, trackWrite, FSOptions } from "../utils/fs";

export interface SegmentConfig {
  name: string;
  description: string;
  defaultFiles?: Array<{
    name: string;
    content: string | ((context: any) => string);
  }>;
}

export const FEATURE_SEGMENTS: Record<string, SegmentConfig> = {
  ui: {
    name: "ui",
    description: `# ui/

Specific visual components of the feature.

- Don't put heavy business rules here.
- Use props and data coming from the model.
- If something here becomes generic, move it to shared/ui.`,
  },
  model: {
    name: "model",
    description: `# model/

State, hooks and business logic of this feature.

- Can call APIs (via api/) and orchestrate data.
- Does not render anything directly.
- Must be testable without relying on UI.`,
  },
  api: {
    name: "api",
    description: `# api/

HTTP calls/clients related only to this feature.

- Encapsulate URLs, parameters and data adaptation.
- Do not use directly in UI components.`,
  },
  lib: {
    name: "lib",
    description: `# lib/

Helpers specific to this feature.

- Reusable stuff **inside** the feature.
- If it becomes too generic -> move to shared/lib.`,
  },
};

export const ENTITY_SEGMENTS: Record<string, SegmentConfig> = {
  model: {
    name: "model",
    description: `# model/

Entity type definitions, schema, validations, and domain logic.

- No UI dependency.
- No direct API call.
- Can be used on both the front and back if you share types.`,
  },
  ui: {
    name: "ui",
    description: `# ui/

Visual components to represent this entity.

Examples:
- User avatar
- Status badge
- Campaign card

Rules:
- They are focused on displaying entity data.
- No complex business rules here.`,
  },
  lib: {
    name: "lib",
    description: `# lib/

Helpers specific to this entity.

If it gets too generic → move to shared/lib.`,
  },
};

export async function createSegments(
  basePath: string,
  segments: string[],
  segmentConfigs: Record<string, SegmentConfig>,
  created: string[],
  skipped: string[],
  options: FSOptions = {}
): Promise<void> {
  for (const segmentName of segments) {
    const config = segmentConfigs[segmentName];
    if (!config) continue;

    const segmentPath = path.join(basePath, segmentName);
    await ensureDir(segmentPath, options);
    created.push(path.relative(process.cwd(), segmentPath));

    // README
    await trackWrite(
      basePath,
      `${segmentName}/README.md`,
      config.description,
      created,
      skipped,
      options
    );

    // Arquivos adicionais (se configurado)
    if (config.defaultFiles) {
      for (const file of config.defaultFiles) {
        const content =
          typeof file.content === "function"
            ? file.content({ segmentName, basePath })
            : file.content;

        await trackWrite(
          segmentPath,
          file.name,
          content,
          created,
          skipped,
          options
        );
      }
    }
  }
}
