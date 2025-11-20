import { IAppBootstrapper, BootstrapOptions } from "./types";
import { runCommand, isFrameworkInstalled } from "../shared/CommandRunner";
import { logger } from "../../utils/logger";

export class ExpressBootstrapper implements IAppBootstrapper {
  readonly frameworkName = "express";

  async isInstalled(cwd: string): Promise<boolean> {
    return isFrameworkInstalled(cwd, this.frameworkName);
  }

  async create(options: BootstrapOptions): Promise<void> {
    const pm = options.packageManager ?? "pnpm";

    logger.step("Initializing Node.js project...");

    // Initialize package.json
    await runCommand(pm, ["init", "-y"], {
      cwd: options.cwd,
      dryRun: options.dryRun,
    });

    // Install Express and TypeScript deps
    if (!options.dryRun) {
      logger.step("Installing Express and dependencies...");

      await runCommand(pm, ["add", "express", "cors", "dotenv"], {
        cwd: options.cwd,
        dryRun: options.dryRun,
      });

      await runCommand(
        pm,
        [
          "add",
          "-D",
          "@types/express",
          "@types/cors",
          "@types/node",
          "tsx",
          "typescript",
        ],
        {
          cwd: options.cwd,
          dryRun: options.dryRun,
        }
      );
    }

    logger.success("Express project initialized");
  }
}
