import { IAppBootstrapper, BootstrapOptions } from "./types";
import { runCommand, isFrameworkInstalled } from "../shared/CommandRunner";
import { logger } from "../../utils/logger";

export class NextAppBootstrapper implements IAppBootstrapper {
  readonly frameworkName = "next";

  async isInstalled(cwd: string): Promise<boolean> {
    return isFrameworkInstalled(cwd, this.frameworkName);
  }

  async create(options: BootstrapOptions): Promise<void> {
    const pm = options.packageManager ?? "pnpm";

    logger.step("Creating Next.js application with create-next-app...");

    await runCommand(
      pm,
      [
        pm === "pnpm" ? "dlx" : pm === "npm" ? "npx" : "dlx",
        "create-next-app@latest",
        ".",
        "--typescript",
        "--tailwind",
        "--eslint",
        "--app",
        "--src-dir",
        "--import-alias",
        "@/*",
        `--use-${pm}`,
        "--yes", // Skip prompts
      ],
      {
        cwd: options.cwd,
        dryRun: options.dryRun,
      }
    );

    logger.success("Next.js app created successfully");
  }
}
