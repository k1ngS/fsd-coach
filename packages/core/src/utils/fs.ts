import { promises as fs } from "fs";
import * as path from "path";

export async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function writeFileSafe(filePath: string, content: string) {
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
  skipped: string[]
) {
  const full = path.join(cwd, relPath);
  const ok = await writeFileSafe(full, content);
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
