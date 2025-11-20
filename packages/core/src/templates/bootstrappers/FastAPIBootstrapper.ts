import { IAppBootstrapper, BootstrapOptions } from "./types";
import { runCommand } from "../shared/CommandRunner";
import { logger } from "../../utils/logger";
import { promises as fs } from "fs";
import * as path from "path";

export class FastAPIBootstrapper implements IAppBootstrapper {
  readonly frameworkName = "fastapi";

  async isInstalled(cwd: string): Promise<boolean> {
    // Check for Python project markers
    try {
      const markers = ["requirements.txt", "pyproject.toml", "setup.py"];

      for (const marker of markers) {
        await fs.access(path.join(cwd, marker));
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  async create(options: BootstrapOptions): Promise<void> {
    logger.step("Setting up Python project with uv...");

    // Use uv (modern Python package manager)
    await runCommand("uv", ["init", "--package"], {
      cwd: options.cwd,
      dryRun: options.dryRun,
    });

    // Create virtual environment
    await runCommand("uv", ["venv"], {
      cwd: options.cwd,
      dryRun: options.dryRun,
    });

    logger.success("Python project initialized");
    logger.info(
      "Activate venv: source .venv/bin/activate (Linux/Mac) or .venv\\Scripts\\activate (Windows)"
    );
  }
}
