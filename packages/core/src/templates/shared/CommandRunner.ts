import { spawn } from "child_process";
import { logger } from "../../utils/logger";

export interface RunCommandOptions {
  cwd: string;
  dryRun?: boolean;
  silent?: boolean;
}

/**
 * Execute external command and stream output
 */
export async function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions
): Promise<void> {
  const { cwd, dryRun, silent } = options;
  const cmdString = `${command} ${args.join(" ")}`;

  logger.info(`Running: ${cmdString}`);

  if (dryRun) {
    logger.info(`[DRY RUN] Would execute: ${cmdString}`);
    return;
  }

  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: silent ? "pipe" : "inherit",
      shell: process.platform === "win32",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`Command "${cmdString}" failed with exit code ${code}`)
        );
      }
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to execute "${cmdString}": ${err.message}`));
    });
  });
}

/**
 * Check if framework package exists in package.json
 */
export async function isFrameworkInstalled(
  cwd: string,
  frameworkName: string
): Promise<boolean> {
  const { promises: fs } = await import("fs");
  const path = await import("path");

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

/**
 * Check if directory is safe for project creation
 */
export async function isSafeDirectory(cwd: string): Promise<boolean> {
  const { promises: fs } = await import("fs");

  try {
    const entries = await fs.readdir(cwd);

    // Allow only harmless files
    const allowedFiles = new Set([
      ".git",
      ".gitignore",
      ".gitattributes",
      "README.md",
      "LICENSE",
      ".env",
      ".env.example",
    ]);

    const unexpectedFiles = entries.filter((e) => !allowedFiles.has(e));

    return unexpectedFiles.length === 0;
  } catch {
    // Directory doesn't exist - safe to create
    return true;
  }
}
