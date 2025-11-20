import { spawn } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";
import { logger } from "../../utils/logger";

export async function runCommand(
  command: string,
  args: string[],
  options: { cwd: string; dryRun?: boolean }
): Promise<void> {
  const cmdString = `${command} ${args.join(" ")}`;

  if (options.dryRun) {
    logger.info(`[DRY RUN] Would execute: ${cmdString}`);
    return;
  }

  logger.debug(`Running: ${cmdString}`);

  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

export async function isFrameworkInstalled(
  cwd: string,
  frameworkName: string
): Promise<boolean> {
  try {
    const pkgPath = path.join(cwd, "package.json");
    const pkgContent = await fs.readFile(pkgPath, "utf-8");
    const pkg = JSON.parse(pkgContent);

    return !!(
      pkg.dependencies?.[frameworkName] || pkg.devDependencies?.[frameworkName]
    );
  } catch {
    return false;
  }
}

export async function isSafeDirectory(cwd: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(cwd);

    const allowed = new Set([
      ".git",
      ".gitignore",
      ".gitattributes",
      "README.md",
      "LICENSE",
      ".env",
      ".env.example",
    ]);

    const unexpected = entries.filter((e) => !allowed.has(e));
    return unexpected.length === 0;
  } catch {
    // Directory doesn't exist - safe
    return true;
  }
}
