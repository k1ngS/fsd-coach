import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TestFileSystem } from "../../__tests__/helpers/fs-helper";
import { ensureDir, writeFileSafe, trackWrite, capitalize } from "../fs";
import * as path from "path";

describe("fs utils", () => {
  let testFS: TestFileSystem;
  let testDir: string;

  beforeEach(async () => {
    testFS = new TestFileSystem("fs-utils");
    testDir = await testFS.setup();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  describe("ensureDir", () => {
    it("should create directory if it does not exist", async () => {
      const dirPath = path.join(testDir, "test-dir");
      await ensureDir(dirPath);

      const exists = await testFS.dirExists("test-dir");
      expect(exists).toBe(true);
    });

    it("should create nested directories", async () => {
      const dirPath = path.join(testDir, "level1", "level2", "level3");
      await ensureDir(dirPath);

      const exists = await testFS.dirExists("level1/level2/level3");
      expect(exists).toBe(true);
    });

    it("should not throw if directory already exists", async () => {
      const dirPath = path.join(testDir, "existing-dir");
      await ensureDir(dirPath);
      await expect(ensureDir(dirPath)).resolves.not.toThrow();
    });
  });

  describe("writeFileSafe", () => {
    it("should write file if it does not exist", async () => {
      const filePath = path.join(testDir, "test.txt");
      const result = await writeFileSafe(filePath, "test content");

      expect(result).toBe(true);
      const exists = await testFS.fileExists("test.txt");
      expect(exists).toBe(true);

      const content = await testFS.readFile("test.txt");
      expect(content).toBe("test content");
    });

    it("should not overwrite existing file", async () => {
      const filePath = path.join(testDir, "existing.txt");
      await writeFileSafe(filePath, "original content");

      const result = await writeFileSafe(filePath, "new content");
      expect(result).toBe(false);

      const content = await testFS.readFile("existing.txt");
      expect(content).toBe("original content");
    });

    it("should create parent directories if they do not exist", async () => {
      const filePath = path.join(testDir, "nested", "dirs", "file.txt");
      await writeFileSafe(filePath, "content");

      const exists = await testFS.fileExists("nested/dirs/file.txt");
      expect(exists).toBe(true);
    });
  });

  describe("trackWrite", () => {
    it("should add to created array when file is written", async () => {
      const created: string[] = [];
      const skipped: string[] = [];

      await trackWrite(testDir, "new-file.txt", "content", created, skipped);

      expect(created).toContain("new-file.txt");
      expect(skipped).toHaveLength(0);
    });

    it("should add to skipped array when file already exists", async () => {
      const filePath = path.join(testDir, "existing.txt");
      await writeFileSafe(filePath, "original");

      const created: string[] = [];
      const skipped: string[] = [];

      await trackWrite(
        testDir,
        "existing.txt",
        "new content",
        created,
        skipped
      );

      expect(created).toHaveLength(0);
      expect(skipped).toContain("existing.txt");
    });
  });

  describe("capitalize", () => {
    it("should capitalize first letter", () => {
      expect(capitalize("hello")).toBe("Hello");
      expect(capitalize("world")).toBe("World");
    });

    it("should handle single character", () => {
      expect(capitalize("a")).toBe("A");
    });

    it("should not change already capitalized strings", () => {
      expect(capitalize("Hello")).toBe("Hello");
    });

    it("should handle empty string", () => {
      expect(capitalize("")).toBe("");
    });
  });
});
