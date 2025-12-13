// Generators
export {
  initProject,
  InitProjectOptions,
  InitResult,
} from "./generators/initProject";
export { addFeature } from "./generators/addFeature";
export { addEntity } from "./generators/addEntity";
export { addWidget } from "./generators/addWidget";
export { addProcess } from "./generators/addProcess";
export { addPage } from "./generators/addPage";
export type {
  PageGeneratorOptions,
  PageGeneratorResult,
} from "./generators/addPage";

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
export * from "./config";

// Audit
export { auditProject } from "./audit/auditor";

// Cache
export { FileCache } from "./cache";

// Utils
export { logger } from "./utils/logger";
export { isFSDCoachError, createError } from "./utils/errors";
export type { FSDCoachError } from "./utils/errors";

// Audit Rules
export { ruleRegistry } from "./audit/rules";
export type {
  AuditRule,
  AuditContext,
  AuditViolation,
  AutoFix,
  AuditMetrics,
} from "./types/audit";

// Metrics
export { MetricsCalculator } from "./audit/metrics/calculator";

// Auto-fix
export { AutoFixEngine } from "./audit/autofix/engine";

// I18n
export { i18n, I18n } from "./i18n";
export type { Locale } from "./i18n";

// CI/CD
export {
  runCIAudit,
  generateGitHubAnnotations,
  generateGitLabReport,
} from "./ci";

// Types
export type {
  FSDConfig,
  GeneratorOptions,
  GeneratorResult,
  AuditOptions,
  AuditResult,
  Segment,
} from "./types";
