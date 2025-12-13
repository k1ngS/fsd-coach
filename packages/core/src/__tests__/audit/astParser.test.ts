import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { TypeScriptASTParser } from "../../audit/astParser";

describe("TypeScriptASTParser", () => {
  let tempDir: string;
  let parser: TypeScriptASTParser;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "fsd-test-"));

    // Create tsconfig.json
    const tsConfigPath = path.join(tempDir, "tsconfig.json");
    await fs.writeFile(
      tsConfigPath,
      JSON.stringify({
        compilerOptions: {
          paths: {
            "@/*": ["./src/*"],
          },
        },
      })
    );

    parser = new TypeScriptASTParser(tsConfigPath);
  });

  it("should parse named imports", async () => {
    const testFile = path.join(tempDir, "test.ts");
    await fs.writeFile(testFile, 'import { foo, bar } from "@/utils";');

    const imports = await parser.parseImports(testFile);
    expect(imports).toHaveLength(1);
    expect(imports[0]).toMatchObject({
      source: "@/utils",
      named: ["foo", "bar"],
      isDefault: false,
      isTypeOnly: false,
    });
  });

  it("should parse default imports", async () => {
    const testFile = path.join(tempDir, "test2.ts");
    await fs.writeFile(testFile, 'import React from "react";');

    const imports = await parser.parseImports(testFile);
    expect(imports).toHaveLength(1);
    expect(imports[0]).toMatchObject({
      source: "react",
      isDefault: true,
    });
  });

  it("should parse namespace imports", async () => {
    const testFile = path.join(tempDir, "test3.ts");
    await fs.writeFile(testFile, 'import * as utils from "@/utils";');

    const imports = await parser.parseImports(testFile);
    expect(imports).toHaveLength(1);
    expect(imports[0].namespace).toBe("utils");
  });

  it("should parse type-only imports", async () => {
    const testFile = path.join(tempDir, "test4.ts");
    await fs.writeFile(
      testFile,
      'import type { User } from "@/entities/user";'
    );

    const imports = await parser.parseImports(testFile);
    expect(imports).toHaveLength(1);
    expect(imports[0].isTypeOnly).toBe(true);
  });

  it("should resolve path aliases", async () => {
    const resolved = parser.resolvePathAlias("@/utils/logger", tempDir);
    expect(resolved).toContain("src/utils/logger");
  });
});
