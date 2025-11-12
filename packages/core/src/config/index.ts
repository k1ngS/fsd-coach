import { promises as fs } from "fs";
import * as path from "path";
import { FSDConfig } from "../types";

const CONFIG_FILE_NAMES = [
  ".fsdcoachrc",
  ".fsdcoachrc.json",
  "fsdcoach.config.json",
];

export async function loadConfig(
  cwd: string = process.cwd()
): Promise<FSDConfig | null> {
  for (const fileName of CONFIG_FILE_NAMES) {
    const configPath = path.join(cwd, fileName);

    try {
      const content = await fs.readFile(configPath, "utf-8");
      const config: FSDConfig = JSON.parse(content);
      return config;
    } catch {
      // File not found or JSON parse error, try next
      continue;
    }
  }
  return null;
}

export async function saveConfig(
  config: FSDConfig,
  cwd: string = process.cwd(),
  fileName: string = "fsdcoach.config.json"
): Promise<void> {
  const configPath = path.join(cwd, fileName);
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
}

export function mergeConfig(
  base: FSDConfig,
  override: Partial<FSDConfig>
): FSDConfig {
  return {
    ...base,
    ...override,
    defaultSegments: {
      ...base.defaultSegments,
      ...override.defaultSegments,
    },
    rootDir: {
      ...base.rootDir,
      ...override.rootDir,
    },
    lint: {
      ...base.lint,
      ...override.lint,
    },
  };
}

export const DEFAULT_CONFIG: FSDConfig = {
  template: "next-app",
  defaultSegments: {
    features: ["ui", "model", "api"],
    entities: ["model", "ui"],
    widgets: ["ui", "model"],
  },
  rootDir: {
    features: "src/features",
    entities: "src/entities",
    widgets: "src/widgets",
  },
  naming: "kebab-case",
  lint: {
    enforcePublicApi: true,
    checkCircularDeps: true,
  },
  locale: "en",
};
