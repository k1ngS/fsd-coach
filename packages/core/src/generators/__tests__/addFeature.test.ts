import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TestFileSystem } from "../../__tests__/helpers/fs-helper";
import { addFeature } from "../addFeature";
import { FSDCoachError } from "../../utils/errors";

describe("addFeature", () => {
  let testFS: TestFileSystem;
  let originalCwd: string;

  beforeEach(async () => {
    testFS = new TestFileSystem("add-feature");
    const testDir = await testFS.setup();
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await testFS.cleanup();
  });

  it("should create feature with default segments", async () => {
    const result = await addFeature({ name: "auth" });

    expect(result.featureName).toBe("auth");
    expect(result.segments).toEqual(["ui", "model", "api"]);
    expect(result.created.length).toBeGreaterThan(0);

    // Check directories
    expect(await testFS.dirExists("src/features/auth")).toBe(true);
    expect(await testFS.dirExists("src/features/auth/ui")).toBe(true);
    expect(await testFS.dirExists("src/features/auth/model")).toBe(true);
    expect(await testFS.dirExists("src/features/auth/api")).toBe(true);

    // Check files
    expect(await testFS.fileExists("src/features/auth/index.ts")).toBe(true);
    expect(await testFS.fileExists("src/features/auth/README.md")).toBe(true);
    expect(await testFS.fileExists("src/features/auth/ui/README.md")).toBe(
      true
    );
    expect(await testFS.fileExists("src/features/auth/model/README.md")).toBe(
      true
    );
    expect(await testFS.fileExists("src/features/auth/api/README.md")).toBe(
      true
    );
  });

  it("should create feature with custom segments", async () => {
    const result = await addFeature({
      name: "profile",
      segments: ["ui", "lib"],
    });

    expect(result.segments).toEqual(["ui", "lib"]);
    expect(await testFS.dirExists("src/features/profile/ui")).toBe(true);
    expect(await testFS.dirExists("src/features/profile/lib")).toBe(true);
    expect(await testFS.dirExists("src/features/profile/model")).toBe(false);
    expect(await testFS.dirExists("src/features/profile/api")).toBe(false);
  });

  it("should create feature in custom root directory", async () => {
    const result = await addFeature({
      name: "campaigns",
      rootDir: "custom/features",
    });

    expect(await testFS.dirExists("custom/features/campaigns")).toBe(true);
    expect(await testFS.fileExists("custom/features/campaigns/index.ts")).toBe(
      true
    );
  });

  it("should reject invalid feature names", async () => {
    await expect(addFeature({ name: "" })).rejects.toThrow(FSDCoachError);
    await expect(addFeature({ name: "InvalidName" })).rejects.toThrow(
      FSDCoachError
    );
    await expect(addFeature({ name: "user_profile" })).rejects.toThrow(
      FSDCoachError
    );
    await expect(addFeature({ name: "123feature" })).rejects.toThrow(
      FSDCoachError
    );
  });

  it("should reject invalid segments", async () => {
    await expect(
      addFeature({ name: "auth", segments: ["invalid"] })
    ).rejects.toThrow(FSDCoachError);
  });

  it("should not overwrite existing files", async () => {
    // Create feature first time
    const firstResult = await addFeature({ name: "auth" });
    expect(firstResult.created.length).toBeGreaterThan(0);

    // Try to create again
    const secondResult = await addFeature({ name: "auth" });

    expect(secondResult.skipped.length).toBeGreaterThan(0);

    const skippedFiles = secondResult.skipped.join("|");
    expect(skippedFiles).toContain("README.md");
    expect(skippedFiles).toContain("index.ts");
  });

  it("should generate correct public API template", async () => {
    await addFeature({ name: "auth" });

    const indexContent = await testFS.readFile("src/features/auth/index.ts");
    expect(indexContent).toContain("Public API");
    expect(indexContent).toContain('"auth"');
    expect(indexContent).toContain("Auth"); // Capitalized version
  });

  it("should generate README with coaching questions", async () => {
    await addFeature({ name: "profile" });

    const readmeContent = await testFS.readFile(
      "src/features/profile/README.md"
    );
    expect(readmeContent).toContain("Feature: profile");
    expect(readmeContent).toContain("What concrete problem");
    expect(readmeContent).toContain("entities");
    expect(readmeContent).toContain("public API");
  });
});
