import { promises as fs } from "fs";
import * as path from "path";
import { logger } from "./logger";

export interface FSOptions {
  dryRun?: boolean;
}

export async function ensureDir(dirPath: string, options: FSOptions = {}) {
  if (options.dryRun) {
    logger.info(`[DRY RUN] Would create directory: ${dirPath}`);
    return;
  }
  await fs.mkdir(dirPath, { recursive: true });
}

export async function writeFileSafe(
  filePath: string,
  content: string,
  options: FSOptions = {}
): Promise<boolean> {
  if (options.dryRun) {
    logger.info(`[DRY RUN] Would create file: ${filePath}`);
    return false;
  }
  try {
    await fs.access(filePath);
    return false;
  } catch {
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, "utf-8");
    return true;
  }
}

export async function trackWrite(
  cwd: string,
  relPath: string,
  content: string,
  created: string[],
  skipped: string[],
  options: FSOptions = {}
) {
  const full = path.join(cwd, relPath);
  const ok = await writeFileSafe(full, content, options);
  (ok ? created : skipped).push(relPath);
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function isDirectory(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export async function readJsonFile<T = any>(
  filePath: string
): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function writeJsonFile(
  filePath: string,
  data: any
): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function findProjectRoot(
  startDir: string = process.cwd()
): Promise<string | null> {
  let currentDir = startDir;

  while (currentDir !== path.parse(currentDir).root) {
    const packageJsonPath = path.join(currentDir, "package.json");
    if (await pathExists(packageJsonPath)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}
