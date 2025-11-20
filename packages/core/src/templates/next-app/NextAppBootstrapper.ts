import {
  BootstrapOptions,
  IAppBootstrapper,
  isFrameworkInstalled,
  runCommand,
} from "../bootstrappers";

export class NextAppBootstrapper implements IAppBootstrapper {
  readonly frameworkName = "next";

  async isInstalled(cwd: string): Promise<boolean> {
    return isFrameworkInstalled(cwd, this.frameworkName);
  }

  async create(options: BootstrapOptions): Promise<void> {
    const pm = options.packageManager ?? "pnpm";

    await runCommand(
      pm,
      [
        "dlx",
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
      ],
      {
        cwd: options.cwd,
        dryRun: options.dryRun,
      }
    );
  }
}
