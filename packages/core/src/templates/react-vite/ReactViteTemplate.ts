import {
  IBootstrappableTemplate,
  TemplateMetadata,
  TemplateContext,
  ValidationResult,
  TemplateResult,
} from "../types";
import { ensureDir, trackWrite } from "../../utils/fs";
import { ViteBootstrapper } from "../bootstrappers/ViteBootstrapper";
import { isSafeDirectory } from "../shared/CommandRunner";
import { logger } from "../../utils/logger";
import * as path from "path";

export class ReactViteTemplate implements IBootstrappableTemplate {
  private readonly bootstrapper = new ViteBootstrapper("react");

  readonly metadata: TemplateMetadata = {
    name: "react-vite",
    displayName: "React + Vite + FSD",
    description: "React SPA with Vite and Feature-Sliced Design",
    version: "1.0.0",
    tags: ["frontend", "react", "vite", "fsd", "typescript"],
    author: "FSD Coach",
    repository: "https://github.com/k1ngS/fsd-coach",
  };

  async validate(context: TemplateContext): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const hasReact = await this.bootstrapper.isInstalled(context.cwd);

    if (!hasReact && context.options.createApp !== false) {
      const isSafe = await isSafeDirectory(context.cwd);

      if (!isSafe && !context.options.force) {
        errors.push("Directory is not empty. Use --force or empty directory.");
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async bootstrap(
    context: TemplateContext,
    fsOptions: { dryRun?: boolean }
  ): Promise<void> {
    const hasReact = await this.bootstrapper.isInstalled(context.cwd);

    if (!hasReact) {
      await this.bootstrapper.create({
        cwd: context.cwd,
        packageManager: context.options.packageManager as string,
        dryRun: fsOptions.dryRun,
      });
    }
  }

  async applyFSD(
    context: TemplateContext,
    fsOptions: { dryRun?: boolean }
  ): Promise<TemplateResult> {
    const created: string[] = [];
    const skipped: string[] = [];

    logger.step("Applying FSD structure...");

    const fsdDirs = [
      "src/app",
      "src/pages",
      "src/widgets",
      "src/features/example",
      "src/entities",
      "src/shared/ui",
      "src/shared/lib",
      "src/shared/api",
      "src/shared/config",
    ];

    for (const dir of fsdDirs) {
      await ensureDir(path.join(context.cwd, dir), fsOptions);
      if (!fsOptions.dryRun) created.push(dir);
    }

    // Generate minimal docs
    await trackWrite(
      context.cwd,
      "README.fsd.md",
      `# ${context.projectName ?? "React App"} - FSD Architecture

React SPA with Feature-Sliced Design.

## Development
\`\`\`bash
npm run dev
\`\`\`
`,
      created,
      skipped,
      fsOptions
    );

    await trackWrite(
      context.cwd,
      "src/features/example/index.ts",
      "// Public API\nexport {};",
      created,
      skipped,
      fsOptions
    );

    return { created, skipped, metadata: this.metadata };
  }
}
