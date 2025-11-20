import { templateRegistry } from "../templates";
import {
  TemplateName,
  TemplateContext,
  IBootstrappableTemplate,
} from "../templates/types";
import { logger } from "../utils/logger";
import { FSOptions } from "../utils/fs";

export interface InitProjectOptions {
  template: TemplateName;
  projectName?: string;
  cwd?: string;
  dryRun?: boolean;
  templateOptions?: Record<string, unknown>;
}

export interface InitResult {
  cwd: string;
  template: TemplateName;
  created: string[];
  skipped: string[];
}

/**
 * Initialize a new project with FSD architecture
 *
 * Process:
 * 1. Get template from registry
 * 2. Validate context
 * 3. Bootstrap app (if template supports it)
 * 4. Apply FSD structure
 */
export async function initProject(
  options: InitProjectOptions
): Promise<InitResult> {
  const cwd = options.cwd ?? process.cwd();
  const fsOptions: FSOptions = { dryRun: options.dryRun };

  // Get template (DIP - depends on abstraction)
  const template = templateRegistry.get(options.template);

  // Create context
  const context: TemplateContext = {
    cwd,
    projectName: options.projectName,
    options: options.templateOptions ?? {},
  };

  // Validate
  logger.step("Validating...");
  const validation = await template.validate(context);

  if (!validation.valid) {
    logger.error("Validation failed:");
    validation.errors.forEach((err) => logger.error(`  - ${err}`));
    throw new Error("Template validation failed");
  }

  if (validation.warnings.length > 0) {
    validation.warnings.forEach((warn) => logger.warn(warn));
  }

  // Step 1: Bootstrap app (if supported and enabled)
  const shouldBootstrap = context.options.createApp !== false;

  if (shouldBootstrap && "bootstrap" in template) {
    logger.step(`Bootstrapping ${template.metadata.displayName}...`);
    await (template as IBootstrappableTemplate).bootstrap(context, fsOptions);
  } else if (!shouldBootstrap) {
    logger.info("Skipping app bootstrap (--no-create-app)");
  }

  // Step 2: Apply FSD structure
  logger.step("Applying FSD architecture...");
  const result = await template.applyFSD(context, fsOptions);

  logger.success("Project initialized successfully!");

  return {
    cwd,
    template: options.template,
    created: result.created,
    skipped: result.skipped,
  };
}
