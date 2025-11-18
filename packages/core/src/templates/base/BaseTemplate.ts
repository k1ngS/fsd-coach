import {
  ITemplate,
  TemplateContext,
  TemplateResult,
  ValidationResult,
  TemplateMetadata,
  FileTemplate,
} from "../types";
import { FSOptions } from "../../utils/fs";
import { logger } from "../../utils/logger";

export abstract class BaseTemplate implements ITemplate {
  abstract readonly metadata: TemplateMetadata;

  async validate(context: TemplateContext): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Common validations
    if (!context.cwd) {
      errors.push("Working directory not specified");
    }

    // Template-specific validations
    const customValidation = await this.customValidate(context);
    errors.push(...customValidation.errors);
    warnings.push(...customValidation.warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async generate(
    context: TemplateContext,
    fsOptions: FSOptions = {}
  ): Promise<TemplateResult> {
    logger.step(`Generating ${this.metadata.displayName}...`);

    const created: string[] = [];
    const skipped: string[] = [];

    // Template Method Pattern: define the algorithm steps
    await this.beforeGenerate(context, fsOptions);
    await this.createDirectoryStructure(context, created, skipped, fsOptions);
    await this.generateFiles(context, created, skipped, fsOptions);
    await this.generateDocs(context, created, skipped, fsOptions);
    await this.afterGenerate(context, created, skipped, fsOptions);

    logger.success(`${this.metadata.displayName} generated successfully`);

    return {
      created,
      skipped,
      metadata: this.metadata,
    };
  }

  // Hook methods (optional override)
  protected async beforeGenerate(
    _context: TemplateContext,
    _fsOptions: FSOptions
  ): Promise<void> {
    // Default: do nothing
  }

  protected async afterGenerate(
    _context: TemplateContext,
    _created: string[],
    _skipped: string[],
    _fsOptions: FSOptions
  ): Promise<void> {
    // Default: do nothing
  }

  // Abstract methods that each template must implement
  protected abstract customValidate(
    context: TemplateContext
  ): Promise<ValidationResult>;

  protected abstract createDirectoryStructure(
    context: TemplateContext,
    created: string[],
    skipped: string[],
    fsOptions: FSOptions
  ): Promise<void>;

  protected abstract generateFiles(
    context: TemplateContext,
    created: string[],
    skipped: string[],
    fsOptions: FSOptions
  ): Promise<void>;

  protected abstract generateDocs(
    context: TemplateContext,
    created: string[],
    skipped: string[],
    fsOptions: FSOptions
  ): Promise<void>;

  /**
   * Helper method to get file templates to generate
   */
  protected abstract getFileTemplates(context: TemplateContext): FileTemplate[];
}
