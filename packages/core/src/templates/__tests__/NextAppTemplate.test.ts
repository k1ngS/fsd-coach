import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextAppTemplate } from "../next-app/NextAppTemplate";
import { TemplateContext } from "../types";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";

describe("NextAppTemplate", () => {
  let template: NextAppTemplate;
  let testDir: string;

  beforeEach(async () => {
    template = new NextAppTemplate();
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), "fsd-test-"));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("should have correct metadata", () => {
    expect(template.metadata.name).toBe("next-app");
    expect(template.metadata.displayName).toBe("Next.js App Router + FSD");
    expect(template.metadata.tags).toContain("nextjs");
  });

  it("should validate empty directory successfully", async () => {
    const context: TemplateContext = {
      cwd: testDir,
      projectName: "test-project",
      options: {},
    };

    const result = await template.validate(context);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should warn about existing Next.js installation", async () => {
    // Create a package.json with Next.js
    const pkgJson = {
      dependencies: {
        next: "14.0.0",
      },
    };

    await fs.writeFile(
      path.join(testDir, "package.json"),
      JSON.stringify(pkgJson)
    );

    const context: TemplateContext = {
      cwd: testDir,
      projectName: "test-project",
      options: {},
    };

    const result = await template.validate(context);

    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("Next.js already installed");
  });

  it("should generate project structure", async () => {
    const context: TemplateContext = {
      cwd: testDir,
      projectName: "test-project",
      options: {},
    };

    const result = await template.generate(context, { dryRun: false });

    expect(result.created.length).toBeGreaterThan(0);
    expect(result.created).toContain("src/features");
    expect(result.created).toContain("src/shared/ui");

    // Verify directories were created
    const exists = await fs.stat(path.join(testDir, "src/features"));
    expect(exists.isDirectory()).toBe(true);
  });

  it("should generate README files", async () => {
    const context: TemplateContext = {
      cwd: testDir,
      projectName: "test-project",
      options: {},
    };

    await template.generate(context, { dryRun: false });

    // Check README.fsd.md exists
    const readmeExists = await fs.stat(path.join(testDir, "README.fsd.md"));
    expect(readmeExists.isFile()).toBe(true);

    // Check example feature README exists
    const exampleReadme = await fs.stat(
      path.join(testDir, "src/features/example/README.md")
    );
    expect(exampleReadme.isFile()).toBe(true);
  });

  it("should handle dry-run mode", async () => {
    const context: TemplateContext = {
      cwd: testDir,
      projectName: "test-project",
      options: {},
    };

    const result = await template.generate(context, { dryRun: true });

    expect(result.created.length).toBeGreaterThan(0);

    // Verify nothing was actually created
    const entries = await fs.readdir(testDir);
    expect(entries).toHaveLength(0);
  });
});
