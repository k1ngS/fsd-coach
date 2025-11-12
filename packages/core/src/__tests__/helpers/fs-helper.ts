import { promises as fs } from "fs";
import * as path from "path";
import { tmpdir } from "os";

export class TestFileSystem {
  private testDir: string;

  constructor(private name: string) {
    this.testDir = path.join(tmpdir(), `fsd-coach-test-${name}-${Date.now()}`);
  }

  async setup(): Promise<string> {
    await fs.mkdir(this.testDir, { recursive: true });
    return this.testDir;
  }

  async cleanup(): Promise<void> {
    try {
      await fs.rm(this.testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to cleanup test directory: ${this.testDir}`, error);
    }
  }

  async fileExists(relativePath: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.testDir, relativePath));
      return true;
    } catch {
      return false;
    }
  }

  async readFile(relativePath: string): Promise<string> {
    return fs.readFile(path.join(this.testDir, relativePath), "utf-8");
  }

  async dirExists(relativePath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(path.join(this.testDir, relativePath));
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  async listFiles(relativePath: string = ""): Promise<string[]> {
    const fullPath = path.join(this.testDir, relativePath);
    try {
      return await fs.readdir(fullPath);
    } catch {
      return [];
    }
  }

  getPath(relativePath: string = ""): string {
    return path.join(this.testDir, relativePath);
  }
}
