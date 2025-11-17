import { promises as fs } from "fs";
import * as path from "path";
import { ensureDir, pathExists, trackWrite } from "../../utils/fs";
import { TemplateContext, TemplateResult, TemplateStrategy } from "../base";

export class FastAPITemplate implements TemplateStrategy {
  name = "fastapi";

  async validate(cwd: string): Promise<boolean> {
    const requirementsPath = path.join(cwd, "requirements.txt");
    const pyprojectPath = path.join(cwd, "pyproject.toml");

    if (await pathExists(requirementsPath)) {
      const content = await fs.readFile(requirementsPath, "utf-8");
      return content.includes("fastapi");
    }

    if (await pathExists(pyprojectPath)) {
      const content = await fs.readFile(pyprojectPath, "utf-8");
      return content.includes("fastapi");
    }

    return false;
  }

  async generate(context: TemplateContext): Promise<TemplateResult> {
    const { cwd, dryRun } = context;
    const created: string[] = [];
    const skipped: string[] = [];
    const fsOptions = { dryRun };

    const structure = [
      "app/core",
      "app/shared/lib",
      "app/shared/config",
      "app/shared/database",
      "app/modules/auth",
      "app/modules/users",
    ];

    for (const dir of structure) {
      await ensureDir(path.join(cwd, dir), fsOptions);
      created.push(dir);
    }

    // Generate main.py
    await trackWrite(
      cwd,
      "app/main.py",
      this.getMainPyContent(),
      created,
      skipped,
      fsOptions
    );

    // Generate requirements.txt
    await trackWrite(
      cwd,
      "requirements.txt",
      this.getRequirementsContent(),
      created,
      skipped,
      fsOptions
    );

    return { created, skipped };
  }

  private getMainPyContent(): string {
    return `from fastapi import FastAPI
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Import routers from modules
# from app.modules.auth.routes import router as auth_router
# app.include_router(auth_router, prefix="/api/v1/auth")
`;
  }

  private getRequirementsContent(): string {
    return `fastapi==0.115.0
uvicorn[standard]==0.32.0
pydantic==2.9.0
pydantic-settings==2.6.0
`;
  }
}
