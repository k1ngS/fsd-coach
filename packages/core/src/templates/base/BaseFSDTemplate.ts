import {
  IBootstrappableTemplate,
  TemplateContext,
  ValidationResult,
  TemplateResult,
} from "../types";
import { IAppBootstrapper } from "../bootstrappers";
import { logger } from "../../utils/logger";
import { FSOptions } from "../../utils/fs";

/**
 * Abstract base for FSD templates
 * Implements Template Method Pattern
 */
export abstract class BaseFSDTemplate implements IBootstrappableTemplate {
  protected bootstrapper?: IAppBootstrapper;

  abstract readonly metadata: any;

  /**
   * Template Method - defines algorithm steps
   */
  async bootstrap(
    context: TemplateContext,
    fsOptions: FSOptions
  ): Promise<void> {
    if (!this.bootstrapper) {
      throw new Error("Template does not support bootstrapping");
    }

    const shouldBootstrap = context.options.createApp !== false;
    const isInstalled = await this.bootstrapper.isInstalled(context.cwd);

    if (shouldBootstrap && !isInstalled) {
      await this.bootstrapper.create({
        cwd: context.cwd,
        dryRun: fsOptions.dryRun,
        packageManager: context.options.packageManager,
        projectName: context.projectName,
      });
    } else if (isInstalled) {
      logger.info(
        `${this.bootstrapper.frameworkName} already installed, skipping bootstrap`
      );
    }
  }

  /**
   * Default validation - can be overridden
   */
  async validate(context: TemplateContext): Promise<ValidationResult> {
    return { valid: true, errors: [], warnings: [] };
  }

  /**
   * Apply FSD structure - must be implemented
   */
  abstract applyFSD(
    context: TemplateContext,
    fsOptions: FSOptions
  ): Promise<TemplateResult>;
}
