import { IAppBootstrapper, BootstrapOptions } from "./types";
import { runCommand, isFrameworkInstalled } from "../shared/CommandRunner";
import { logger } from "../../utils/logger";

export class ViteBootstrapper implements IAppBootstrapper {
  constructor(
    private variant: "react" | "vue",
    private framework: "react" | "vue" = variant
  ) {}

  get frameworkName(): string {
    return this.framework;
  }

  async isInstalled(cwd: string): Promise<boolean> {
    return isFrameworkInstalled(cwd, this.frameworkName);
  }

  async create(options: BootstrapOptions): Promise<void> {
    const pm = options.packageManager ?? "pnpm";

    logger.step(`Creating ${this.variant} app with Vite...`);

    await runCommand(
      pm,
      ["create", "vite@latest", ".", "--template", `${this.variant}-ts`],
      {
        cwd: options.cwd,
        dryRun: options.dryRun,
      }
    );

    logger.success(`${this.variant} app created successfully`);
  }
}
