import { promises as fs } from "fs";
import * as path from "path";
import * as crypto from "crypto";

interface CacheEntry<T> {
  data: T;
  hash: string;
  timestamp: number;
}

export class FileCache<T> {
  private cacheDir: string;

  constructor(cacheDir: string = ".fsd-coach/cache") {
    this.cacheDir = cacheDir;
  }

  private getCachePath(key: string): string {
    return path.join(process.cwd(), this.cacheDir, `${key}.json`);
  }

  private async getFileHash(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return crypto.createHash("md5").update(content).digest("hex");
    } catch {
      return "";
    }
  }

  async get(key: string, filePath: string): Promise<T | null> {
    const cachePath = this.getCachePath(key);

    try {
      const cacheContent = await fs.readFile(cachePath, "utf-8");
      const entry: CacheEntry<T> = JSON.parse(cacheContent);

      // Verify if the file changed
      const currentHash = await this.getFileHash(filePath);

      if (entry.hash === currentHash) {
        return entry.data;
      }
    } catch {
      // Cache miss or file read error
    }

    return null;
  }

  async set(key: string, data: T, filePath: string): Promise<void> {
    const cachePath = this.getCachePath(key);
    const hash = await this.getFileHash(filePath);

    const entry: CacheEntry<T> = {
      data,
      hash,
      timestamp: Date.now(),
    };

    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify(entry), "utf-8");
  }

  async clear(): Promise<void> {
    const cacheRoot = path.join(process.cwd(), this.cacheDir);
    try {
      await fs.rm(cacheRoot, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
  }

  async invalidate(key: string): Promise<void> {
    const cachePath = this.getCachePath(key);
    try {
      await fs.unlink(cachePath);
    } catch {
      // Ignore errors
    }
  }

  async getStats(): Promise<{ files: number; totalSize: number }> {
    const cacheRoot = path.join(process.cwd(), this.cacheDir);

    try {
      const files = await fs.readdir(cacheRoot);
      const sizes = await Promise.all(
        files.map(async (file) => {
          const stat = await fs.stat(path.join(cacheRoot, file));
          return stat.size;
        })
      );

      return {
        files: files.length,
        totalSize: sizes.reduce((a, b) => a + b, 0),
      };
    } catch {
      return { files: 0, totalSize: 0 };
    }
  }
}
