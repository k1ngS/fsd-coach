import {
  ITemplate,
  TemplateMetadata,
  TemplateContext,
  ValidationResult,
  TemplateResult,
  TemplateName,
} from "../types";
import { ensureDir, trackWrite } from "../../utils/fs";
import { FullstackCombination, FULLSTACK_COMBINATIONS } from "./types";
import { logger } from "../../utils/logger";
import * as path from "path";
import { templateRegistry } from "..";

export class FullstackTemplate implements ITemplate {
  readonly metadata: TemplateMetadata = {
    name: "fullstack",
    displayName: "Fullstack FSD Project",
    description: "Full-stack with FSD on frontend and backend",
    version: "1.0.0",
    tags: ["fullstack", "monorepo", "fsd"],
    author: "FSD Coach",
    repository: "https://github.com/k1ngS/fsd-coach",
  };

  async validate(context: TemplateContext): Promise<ValidationResult> {
    const errors: string[] = [];
    const combination = context.options.combination as FullstackCombination;

    if (!combination) {
      errors.push(
        "Missing --combination option. Choose from: " +
          Object.keys(FULLSTACK_COMBINATIONS).join(", ")
      );
    } else if (!FULLSTACK_COMBINATIONS[combination]) {
      errors.push(`Invalid combination: ${combination}`);
    }

    return { valid: errors.length === 0, errors, warnings: [] };
  }

  async applyFSD(
    context: TemplateContext,
    fsOptions: { dryRun?: boolean }
  ): Promise<TemplateResult> {
    const combination = context.options.combination as FullstackCombination;
    const config = FULLSTACK_COMBINATIONS[combination];
    const useMonorepo = context.options.monorepo !== false;

    const created: string[] = [];
    const skipped: string[] = [];

    logger.step(`Creating fullstack: ${config.name}`);

    // Create workspace structure
    if (useMonorepo) {
      await this.createMonorepoStructure(context.cwd, fsOptions, created);
    }

    // Apply frontend template
    const frontendPath = useMonorepo ? "apps/frontend" : "frontend";
    await this.applySubTemplate(
      config.frontend,
      path.join(context.cwd, frontendPath),
      context,
      fsOptions,
      created,
      skipped
    );

    // Apply backend template
    const backendPath = useMonorepo ? "apps/backend" : "backend";
    await this.applySubTemplate(
      config.backend,
      path.join(context.cwd, backendPath),
      context,
      fsOptions,
      created,
      skipped
    );

    // Generate workspace config
    if (useMonorepo) {
      await this.generateMonorepoConfig(context, created, skipped, fsOptions);
    }

    return { created, skipped, metadata: this.metadata };
  }

  private async createMonorepoStructure(
    cwd: string,
    fsOptions: { dryRun?: boolean },
    created: string[]
  ): Promise<void> {
    const dirs = ["apps/frontend", "apps/backend", "packages/shared"];

    for (const dir of dirs) {
      await ensureDir(path.join(cwd, dir), fsOptions);
      if (!fsOptions.dryRun) created.push(dir);
    }
  }

  private async applySubTemplate(
    templateName: string,
    targetPath: string,
    parentContext: TemplateContext,
    fsOptions: { dryRun?: boolean },
    created: string[],
    skipped: string[]
  ): Promise<void> {
    const template = templateRegistry.get(templateName as TemplateName);

    const subContext: TemplateContext = {
      ...parentContext,
      cwd: targetPath,
    };

    // Bootstrap if template supports it
    if ("bootstrap" in template) {
      await (template as any).bootstrap(subContext, fsOptions);
    }

    // Apply FSD structure
    const result = await template.applyFSD(subContext, fsOptions);

    const relativePath = path.relative(parentContext.cwd, targetPath);
    created.push(...result.created.map((p) => path.join(relativePath, p)));
    skipped.push(...result.skipped.map((p) => path.join(relativePath, p)));
  }

  private async generateMonorepoConfig(
    context: TemplateContext,
    created: string[],
    skipped: string[],
    fsOptions: { dryRun?: boolean }
  ): Promise<void> {
    // Root package.json
    await trackWrite(
      context.cwd,
      "package.json",
      JSON.stringify(
        {
          name: context.projectName ?? "fullstack-app",
          private: true,
          workspaces: ["apps/*", "packages/*"],
          scripts: {
            dev: "pnpm -r dev",
            build: "pnpm -r build",
          },
        },
        null,
        2
      ),
      created,
      skipped,
      fsOptions
    );

    // pnpm-workspace.yaml
    await trackWrite(
      context.cwd,
      "pnpm-workspace.yaml",
      "packages:\n  - 'apps/*'\n  - 'packages/*'\n",
      created,
      skipped,
      fsOptions
    );
  }
}
