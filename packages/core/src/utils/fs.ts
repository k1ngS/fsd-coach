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