import { promises as fs } from "fs";
import * as path from "path";
import { FSDConfig, CONFIG_VERSION } from "../types";
import { createError } from "../utils/errors";

export const CONFIG_FILE_NAMES = [
  ".fsdcoachrc",
  ".fsdcoachrc.json",
  "fsdcoach.config.json",
];

export const DEFAULT_CONFIG: FSDConfig = {
  version: CONFIG_VERSION,
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
    pages: "src/pages",
    processes: "src/processes",
  },
  naming: "kebab-case",
  lint: {
    enforcePublicApi: true,
    checkCircularDeps: true,
    strictLayerImports: true,
  },
  locale: "en",
  generators: {
    includeTests: false,
    includeStorybook: false,
  },
};

/**
 * Find config file in the given directory
 */
export async function findConfigFile(
  cwd: string = process.cwd()
): Promise<string | null> {
  for (const fileName of CONFIG_FILE_NAMES) {
    const configPath = path.join(cwd, fileName);

    try {
      await fs.access(configPath);
      return configPath;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Load config from file
 */
export async function loadConfig(
  cwd: string = process.cwd()
): Promise<FSDConfig | null> {
  const configPath = await findConfigFile(cwd);

  if (!configPath) {
    return null;
  }

  try {
    const content = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(content) as FSDConfig;

    // Validate version
    if (config.version && config.version !== CONFIG_VERSION) {
      console.warn(
        `Warning: Config version mismatch. Expected ${CONFIG_VERSION}, got ${config.version}`
      );
    }

    return config;
  } catch (error) {
    throw createError(
      "INVALID_CONFIG",
      `Failed to load config from ${configPath}`,
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Save config to file
 */
export async function saveConfig(
  config: FSDConfig,
  cwd: string = process.cwd(),
  fileName: string = ".fsdcoachrc.json"
): Promise<string> {
  const configPath = path.join(cwd, fileName);

  try {
    const configWithVersion = {
      ...config,
      version: CONFIG_VERSION,
    };

    await fs.writeFile(
      configPath,
      JSON.stringify(configWithVersion, null, 2),
      "utf-8"
    );

    return configPath;
  } catch (error) {
    throw createError(
      "INVALID_CONFIG",
      `Failed to save config to ${configPath}`,
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Merge configs with proper deep merge
 */
export function mergeConfig(
  base: FSDConfig,
  override: Partial<FSDConfig>
): FSDConfig {
  return {
    version: override.version ?? base.version,
    template: override.template ?? base.template,
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
    naming: override.naming ?? base.naming,
    locale: override.locale ?? base.locale,
    generators: {
      ...base.generators,
      ...override.generators,
    },
  };
}

/**
 * Get effective config (loaded + defaults)
 */
export async function getEffectiveConfig(
  cwd: string = process.cwd()
): Promise<FSDConfig> {
  const loadedConfig = await loadConfig(cwd);

  if (!loadedConfig) {
    return DEFAULT_CONFIG;
  }

  return mergeConfig(DEFAULT_CONFIG, loadedConfig);
}

/**
 * Get a specific config value by key path (e.g., "rootDir.features")
 */
export function getConfigValue(config: FSDConfig, keyPath: string): unknown {
  const keys = keyPath.split(".");
  let value: any = config;

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }

  return value;
}

/**
 * Set a specific config value by key path
 */
export function setConfigValue(
  config: FSDConfig,
  keyPath: string,
  value: unknown
): FSDConfig {
  const keys = keyPath.split(".");
  const newConfig = JSON.parse(JSON.stringify(config)); // Deep clone

  let current: any = newConfig;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    if (!(key in current)) {
      current[key] = {};
    }

    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;

  return newConfig;
}

/**
 * Check if config file exists
 */
export async function configExists(
  cwd: string = process.cwd()
): Promise<boolean> {
  const configPath = await findConfigFile(cwd);
  return configPath !== null;
}

/**
 * Delete config file
 */
export async function deleteConfig(cwd: string = process.cwd()): Promise<void> {
  const configPath = await findConfigFile(cwd);

  if (!configPath) {
    throw createError("CONFIG_NOT_FOUND", "No config file found to delete");
  }

  await fs.unlink(configPath);
}
