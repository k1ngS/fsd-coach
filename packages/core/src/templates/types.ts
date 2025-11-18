export type TemplateName = "next-app" | "fastapi" | "fullstack" | "react-vite";

export interface TemplateMetadata {
  name: TemplateName;
  displayName: string;
  description: string;
  version: string;
  tags: string[];
  author?: string;
  repository?: string;
}

export interface TemplateContext {
  cwd: string;
  projectName?: string;
  options: TemplateOptions;
}

export interface TemplateOptions {
  typescript?: boolean;
  eslint?: boolean;
  prettier?: boolean;
  git?: boolean;
  packageManager?: "pnpm" | "npm" | "yarn";
  [key: string]: unknown;
}

export interface TemplateResult {
  created: string[];
  skipped: string[];
  metadata: TemplateMetadata;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ITemplate {
  readonly metadata: TemplateMetadata;

  /**
   * Validate if current directory is compatible with this template
   */
  validate(context: TemplateContext): Promise<ValidationResult>;

  /**
   * Generate project structure and files
   */
  generate(
    context: TemplateContext,
    fsOptions: { dryRun?: boolean }
  ): Promise<TemplateResult>;

  /**
   * Post-generation hooks (e.g., install dependencies, run migrations)
   */
  postGenerate?(context: TemplateContext): Promise<void>;
}

export interface DirectoryStructure {
  [key: string]: DirectoryStructure | string | null;
}

export interface FileTemplate {
  path: string;
  content: string | ((context: TemplateContext) => string);
}
