import {
  IBootstrappableTemplate,
  TemplateMetadata,
  TemplateContext,
  ValidationResult,
  TemplateResult,
} from "../types";
import { ensureDir, trackWrite } from "../../utils/fs";
import { NextAppBootstrapper } from "../bootstrappers/NextAppBootstrapper";
import { isSafeDirectory } from "../shared/CommandRunner";
import { logger } from "../../utils/logger";
import * as path from "path";
import {
  createTemplateVariables,
  generateContent,
} from "../shared/ContentGenerator";
import {
  EXAMPLE_FEATURE_README,
  README_FSD_MD,
} from "../content/next-app/README.fsd.md";

export class NextAppTemplate implements IBootstrappableTemplate {
  private readonly bootstrapper = new NextAppBootstrapper();

  readonly metadata: TemplateMetadata = {
    name: "next-app",
    displayName: "Next.js App Router + FSD",
    description: "Next.js application with Feature-Sliced Design architecture",
    version: "1.0.0",
    tags: ["frontend", "react", "nextjs", "fsd", "typescript"],
    author: "FSD Coach",
    repository: "https://github.com/k1ngS/fsd-coach",
  };

  async validate(context: TemplateContext): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if Next.js already installed
    const hasNext = await this.bootstrapper.isInstalled(context.cwd);

    if (hasNext) {
      warnings.push(
        "Next.js already installed. Only FSD structure will be added."
      );
    }

    // Check if directory is safe (only if creating new app)
    if (!hasNext && context.options.createApp !== false) {
      const isSafe = await isSafeDirectory(context.cwd);

      if (!isSafe && !context.options.force) {
        errors.push(
          "Directory is not empty. Use --force to proceed, or run in an empty directory."
        );
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async bootstrap(
    context: TemplateContext,
    fsOptions: { dryRun?: boolean }
  ): Promise<void> {
    const hasNext = await this.bootstrapper.isInstalled(context.cwd);

    if (!hasNext) {
      await this.bootstrapper.create({
        cwd: context.cwd,
        packageManager: context.options.packageManager as string,
        dryRun: fsOptions.dryRun,
      });
    } else {
      logger.info("Next.js already installed. Skipping bootstrap.");
    }
  }

  async applyFSD(
    context: TemplateContext,
    fsOptions: { dryRun?: boolean }
  ): Promise<TemplateResult> {
    const created: string[] = [];
    const skipped: string[] = [];

    logger.step("Applying FSD structure...");

    // Create FSD directories
    await this.createFSDStructure(context.cwd, created, skipped, fsOptions);

    // Generate documentation
    await this.generateDocs(context, created, skipped, fsOptions);

    // Generate minimal example files
    await this.generateExampleFiles(context, created, skipped, fsOptions);

    logger.success("FSD structure applied successfully");

    return {
      created,
      skipped,
      metadata: this.metadata,
    };
  }

  private async createFSDStructure(
    cwd: string,
    created: string[],
    skipped: string[],
    fsOptions: { dryRun?: boolean }
  ): Promise<void> {
    const fsdDirs = [
      // App layer (providers, global config)
      "src/app/providers",
      "src/app/styles",

      // Processes layer
      "src/processes",

      // Pages layer (optional)
      "src/pages",

      // Widgets layer
      "src/widgets",

      // Features layer
      "src/features",
      "src/features/example",
      "src/features/example/ui",
      "src/features/example/model",

      // Entities layer
      "src/entities",

      // Shared layer
      "src/shared/ui",
      "src/shared/lib",
      "src/shared/api",
      "src/shared/config",
    ];

    for (const dir of fsdDirs) {
      const fullPath = path.join(cwd, dir);
      try {
        await ensureDir(fullPath, fsOptions);
        if (!fsOptions.dryRun) {
          created.push(dir);
        }
      } catch (error) {
        skipped.push(dir);
      }
    }
  }

  private async generateDocs(
    context: TemplateContext,
    created: string[],
    skipped: string[],
    fsOptions: { dryRun?: boolean }
  ): Promise<void> {
    const variables = createTemplateVariables(context);

    // Main FSD README
    const readmeContent = generateContent(README_FSD_MD, variables);
    await trackWrite(
      context.cwd,
      "README.fsd.md",
      readmeContent,
      created,
      skipped,
      fsOptions
    );

    // Example feature README
    const exampleReadme = generateContent(EXAMPLE_FEATURE_README, variables);
    await trackWrite(
      context.cwd,
      "src/features/example/README.md",
      exampleReadme,
      created,
      skipped,
      fsOptions
    );
  }

  private async generateExampleFiles(
    context: TemplateContext,
    created: string[],
    skipped: string[],
    fsOptions: { dryRun?: boolean }
  ): Promise<void> {
    // Example feature public API
    await trackWrite(
      context.cwd,
      "src/features/example/index.ts",
      `/**
 * Public API for example feature
 *
 * Export only what other layers need to use.
 * Keep this minimal to maintain clear boundaries.
 */

// Example (uncomment when implemented):
// export { ExampleComponent } from "./ui/ExampleComponent";
// export { useExample } from "./model/useExample";

export {};
`,
      created,
      skipped,
      fsOptions
    );

    // Shared config
    await trackWrite(
      context.cwd,
      "src/shared/config/index.ts",
      `/**
 * Shared Configuration
 */

export const APP_NAME = "${context.projectName ?? "My App"}";
export const IS_DEV = process.env.NODE_ENV === "development";
`,
      created,
      skipped,
      fsOptions
    );
  }
}
