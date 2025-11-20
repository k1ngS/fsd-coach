import {
  IBootstrappableTemplate,
  TemplateMetadata,
  TemplateContext,
  ValidationResult,
  TemplateResult,
} from "../types";
import { ensureDir, trackWrite } from "../../utils/fs";
import { FastAPIBootstrapper } from "../bootstrappers/FastAPIBootstrapper";
import { logger } from "../../utils/logger";
import * as path from "path";

export class FastAPITemplate implements IBootstrappableTemplate {
  private readonly bootstrapper = new FastAPIBootstrapper();

  readonly metadata: TemplateMetadata = {
    name: "fastapi",
    displayName: "FastAPI + FSD (Python)",
    description: "FastAPI backend with FSD-inspired architecture",
    version: "1.0.0",
    tags: ["backend", "python", "fastapi", "fsd"],
    author: "FSD Coach",
    repository: "https://github.com/k1ngS/fsd-coach",
  };

  async validate(context: TemplateContext): Promise<ValidationResult> {
    return { valid: true, errors: [], warnings: [] };
  }

  async bootstrap(
    context: TemplateContext,
    fsOptions: { dryRun?: boolean }
  ): Promise<void> {
    const hasProject = await this.bootstrapper.isInstalled(context.cwd);

    if (!hasProject) {
      await this.bootstrapper.create({
        cwd: context.cwd,
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

    logger.step("Applying FSD structure for FastAPI...");

    const dirs = [
      "app/core",
      "app/modules/auth",
      "app/shared/models",
      "app/shared/schemas",
      "app/shared/utils",
      "tests",
    ];

    for (const dir of dirs) {
      await ensureDir(path.join(context.cwd, dir), fsOptions);
      if (!fsOptions.dryRun) created.push(dir);
    }

    // Generate requirements.txt
    await trackWrite(
      context.cwd,
      "requirements.txt",
      `fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
sqlalchemy==2.0.25
`,
      created,
      skipped,
      fsOptions
    );

    // Generate main.py
    await trackWrite(
      context.cwd,
      "app/main.py",
      `from fastapi import FastAPI

app = FastAPI(title="${context.projectName ?? "FastAPI App"}")

@app.get("/")
def root():
    return {"message": "Welcome to ${context.projectName ?? "API"}"}
`,
      created,
      skipped,
      fsOptions
    );

    return { created, skipped, metadata: this.metadata };
  }
}
