/**
 * Template names available in the system
 */
export type TemplateName =
  | "next-app"
  | "react-vite"
  | "vue-vite"
  | "fastapi"
  | "express"
  | "fullstack";

/**
 * Package managers supported
 */
export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

/**
 * Template metadata for display and identification
 */
export interface TemplateMetadata {
  name: TemplateName;
  displayName: string;
  description: string;
  version: string;
  tags: string[];
  author?: string;
  repository?: string;
}

/**
 * Context passed to templates during generation
 */
export interface TemplateContext {
  cwd: string;
  projectName?: string;
  options: TemplateOptions;
}

/**
 * Options that can be passed to templates
 */
export interface TemplateOptions {
  packageManager?: PackageManager;
  createApp?: boolean;
  force?: boolean;
  [key: string]: unknown;
}

/**
 * Result of template generation
 */
export interface TemplateResult {
  created: string[];
  skipped: string[];
  metadata: TemplateMetadata;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Base template interface (ISP - Interface Segregation)
 * Only methods ALL templates need
 */
export interface ITemplate {
  readonly metadata: TemplateMetadata;

  /**
   * Validate if template can be applied in current context
   */
  validate(context: TemplateContext): Promise<ValidationResult>;

  /**
   * Apply FSD structure (folders + documentation)
   * Does NOT create the base application
   */
  applyFSD(
    context: TemplateContext,
    fsOptions: { dryRun?: boolean }
  ): Promise<TemplateResult>;
}

/**
 * Extended interface for templates that can bootstrap apps
 * (ISP - separate interface for separate responsibility)
 */
export interface IBootstrappableTemplate extends ITemplate {
  /**
   * Bootstrap base application using official CLI tools
   */
  bootstrap(
    context: TemplateContext,
    fsOptions: { dryRun?: boolean }
  ): Promise<void>;
}
