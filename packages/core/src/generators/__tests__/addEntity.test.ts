import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TestFileSystem } from "../../__tests__/helpers/fs-helper";
import { addEntity } from "../addEntity";
import { FSDCoachError } from "../../utils/errors";

describe("addEntity", () => {
  let testFS: TestFileSystem;
  let originalCwd: string;

  beforeEach(async () => {
    testFS = new TestFileSystem("add-entity");
    const testDir = await testFS.setup();
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await testFS.cleanup();
  });

  it("should create entity with default segments (model, ui)", async () => {
    const result = await addEntity({ name: "user" });

    expect(result.entityName).toBe("user");
    expect(result.segments).toEqual(["model", "ui"]);
    expect(result.created.length).toBeGreaterThan(0);

    // Check directories
    expect(await testFS.dirExists("src/entities/user")).toBe(true);
    expect(await testFS.dirExists("src/entities/user/model")).toBe(true);
    expect(await testFS.dirExists("src/entities/user/ui")).toBe(true);

    // Check files
    expect(await testFS.fileExists("src/entities/user/index.ts")).toBe(true);
    expect(await testFS.fileExists("src/entities/user/README.md")).toBe(true);
    expect(await testFS.fileExists("src/entities/user/model/README.md")).toBe(
      true
    );
    expect(await testFS.fileExists("src/entities/user/ui/README.md")).toBe(
      true
    );
  });

  it("should create entity with custom segments", async () => {
    const result = await addEntity({
      name: "campaign",
      segments: ["model", "lib"],
    });

    expect(result.segments).toEqual(["model", "lib"]);
    expect(await testFS.dirExists("src/entities/campaign/model")).toBe(true);
    expect(await testFS.dirExists("src/entities/campaign/lib")).toBe(true);
    expect(await testFS.dirExists("src/entities/campaign/ui")).toBe(false);
  });

  it("should create entity in custom root directory", async () => {
    const result = await addEntity({
      name: "session",
      rootDir: "custom/entities",
    });

    expect(await testFS.dirExists("custom/entities/session")).toBe(true);
    expect(await testFS.fileExists("custom/entities/session/index.ts")).toBe(
      true
    );
  });

  it("should reject invalid entity names", async () => {
    await expect(addEntity({ name: "" })).rejects.toThrow(FSDCoachError);
    await expect(addEntity({ name: "InvalidName" })).rejects.toThrow(
      FSDCoachError
    );
    await expect(addEntity({ name: "user_entity" })).rejects.toThrow(
      FSDCoachError
    );
  });

  it("should reject invalid segments", async () => {
    await expect(
      addEntity({ name: "user", segments: ["invalid"] })
    ).rejects.toThrow(FSDCoachError);
  });

  it("should generate correct public API template", async () => {
    await addEntity({ name: "user" });

    const indexContent = await testFS.readFile("src/entities/user/index.ts");
    expect(indexContent).toContain("Public API");
    expect(indexContent).toContain('"user"');
    expect(indexContent).toContain("User"); // Capitalized version
  });

  it("should generate README with domain questions", async () => {
    await addEntity({ name: "campaign" });

    const readmeContent = await testFS.readFile(
      "src/entities/campaign/README.md"
    );
    expect(readmeContent).toContain("Entity: campaign");
    expect(readmeContent).toContain("domain concept");
    expect(readmeContent).toContain("mandatory");
    expect(readmeContent).toContain("invariants");
  });

  it("should not overwrite existing files", async () => {
    // Create entity first time
    const firstResult = await addEntity({ name: "user" });
    expect(firstResult.created.length).toBeGreaterThan(0);

    // Try to create again
    const secondResult = await addEntity({ name: "user" });

    expect(secondResult.skipped.length).toBeGreaterThan(0);

    const skippedFiles = secondResult.skipped.join("|");
    expect(skippedFiles).toContain("README.md");
    expect(skippedFiles).toContain("index.ts");
  });
});
