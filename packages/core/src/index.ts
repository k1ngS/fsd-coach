// Generators
export {
  initProject,
  InitProjectOptions,
  InitResult,
} from "./generators/initProject";
export { addFeature } from "./generators/addFeature";
export { addEntity } from "./generators/addEntity";
export { createSegments } from "./generators/segments";

// Templates (NEW)
export { templateRegistry } from "./templates";
export type {
  ITemplate,
  TemplateMetadata,
  TemplateContext,
  TemplateName,
} from "./templates";

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
