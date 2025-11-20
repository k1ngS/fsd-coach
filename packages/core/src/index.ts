// Generators
export {
  initProject,
  InitProjectOptions,
  InitResult,
} from "./generators/initProject";
export { addFeature } from "./generators/addFeature";
export { addEntity } from "./generators/addEntity";
export { createSegments } from "./generators/segments";

// Templates
export * from "./templates";

// Bootstrappers
export {
  IAppBootstrapper,
  BootstrapOptions,
  NextAppBootstrapper,
  ViteBootstrapper,
  FastAPIBootstrapper,
  runCommand,
  isFrameworkInstalled,
  isSafeDirectory,
} from "./templates/bootstrappers";

// Config
export { loadConfig, saveConfig, mergeConfig } from "./config";
export { DEFAULT_CONFIG } from "./config";

// Audit
export { auditProject } from "./audit/auditor";

// Cache
export { FileCache } from "./cache";

// Utils
export { logger } from "./utils/logger";
export { isFSDCoachError, createError } from "./utils/errors";
export type { FSDCoachError } from "./utils/errors";

// Types
export type {
  FSDConfig,
  GeneratorOptions,
  GeneratorResult,
  AuditOptions,
  AuditResult,
  Segment,
} from "./types";
