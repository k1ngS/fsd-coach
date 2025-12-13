import * as path from "path";
import { ensureDir, trackWrite, FSOptions } from "../utils/fs";
import { getSegmentTemplate } from "../templates/shared/SegmentTemplates";

export interface SegmentConfig {
  name: string;
  description: string;
}

// Export segment lists for backward compatibility
export const FEATURE_SEGMENTS: Record<string, SegmentConfig> = {
  ui: {
    name: "ui",
    description: getSegmentTemplate("feature", "ui")?.description ?? "",
  },
  model: {
    name: "model",
    description: getSegmentTemplate("feature", "model")?.description ?? "",
  },
  api: {
    name: "api",
    description: getSegmentTemplate("feature", "api")?.description ?? "",
  },
  lib: {
    name: "lib",
    description: getSegmentTemplate("feature", "lib")?.description ?? "",
  },
};

export const ENTITY_SEGMENTS: Record<string, SegmentConfig> = {
  model: {
    name: "model",
    description: getSegmentTemplate("entity", "model")?.description ?? "",
  },
  ui: {
    name: "ui",
    description: getSegmentTemplate("entity", "ui")?.description ?? "",
  },
  lib: {
    name: "lib",
    description: getSegmentTemplate("entity", "lib")?.description ?? "",
  },
};

export const WIDGET_SEGMENTS: Record<string, SegmentConfig> = {
  ui: {
    name: "ui",
    description: getSegmentTemplate("widget", "ui")?.description ?? "",
  },
  model: {
    name: "model",
    description: getSegmentTemplate("widget", "model")?.description ?? "",
  },
  lib: {
    name: "lib",
    description: getSegmentTemplate("widget", "lib")?.description ?? "",
  },
};

export const PROCESS_SEGMENTS: Record<string, SegmentConfig> = {
  model: {
    name: "model",
    description: getSegmentTemplate("process", "model")?.description ?? "",
  },
  lib: {
    name: "lib",
    description: getSegmentTemplate("process", "lib")?.description ?? "",
  },
  api: {
    name: "api",
    description: getSegmentTemplate("process", "api")?.description ?? "",
  },
};

export const PAGE_SEGMENTS: Record<string, SegmentConfig> = {
  ui: {
    name: "ui",
    description: getSegmentTemplate("page", "ui")?.description ?? "",
  },
  model: {
    name: "model",
    description: getSegmentTemplate("page", "model")?.description ?? "",
  },
};

/**
 * Create segments directories and READMEs
 */
export async function createSegments(
  basePath: string,
  segments: string[],
  segmentConfigs: Record<string, SegmentConfig>,
  created: string[],
  skipped: string[],
  fsOptions: FSOptions = {}
): Promise<void> {
  for (const segmentName of segments) {
    const config = segmentConfigs[segmentName];

    if (!config) {
      throw new Error(
        `Unknown segment "${segmentName}". Available: ${Object.keys(segmentConfigs).join(", ")}`
      );
    }

    const segmentPath = path.join(basePath, segmentName);

    await ensureDir(segmentPath, fsOptions);

    await trackWrite(
      basePath,
      path.join(segmentName, "README.md"),
      config.description,
      created,
      skipped,
      fsOptions
    );
  }
}
