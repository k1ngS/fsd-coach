import { BaseTemplate } from "../base/BaseTemplate";
import {
  TemplateMetadata,
  TemplateContext,
  ValidationResult,
  FileTemplate,
} from "../types";
import { FSOptions, ensureDir, trackWrite } from "../../utils/fs";
import {
  loadTemplate,
  createTemplateVariables,
  resolveContent,
} from "../shared/ContentGenerator";
import * as path from "path";
import { promises as fs } from "fs";

export class NextAppTemplate extends BaseTemplate {
  readonly metadata: TemplateMetadata = {
    name: "next-app",
    displayName: "Next.js App Router + FSD",
    description: "Next.js application with Feature-Sliced Design architecture",
    version: "1.0.0",
    tags: ["frontend", "react", "nextjs", "fsd", "typescript"],
    author: "FSD Coach",
    repository: "https://github.com/k1ngS/fsd-coach",
  };

  protected async customValidate(
    context: TemplateContext
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if Next.js is already installed
    const pkgPath = path.join(context.cwd, "package.json");
    try {
      const pkgContent = await fs.readFile(pkgPath, "utf-8");
      const pkg = JSON.parse(pkgContent);

      if (pkg.dependencies?.next) {
        warnings.push(
          "Next.js already installed. Only FSD structure will be added."
        );
      }
    } catch {
      // No package.json found - this is fine for new projects
    }

    // Check if directory is not empty (except for allowed files)
    try {
      const entries = await fs.readdir(context.cwd);
      const allowedFiles = new Set([
        ".git",
        ".gitignore",
        ".gitattributes",
        "README.md",
        "LICENSE",
        "package.json",
        "node_modules",
      ]);

      const unexpectedFiles = entries.filter((e) => !allowedFiles.has(e));

      if (unexpectedFiles.length > 0) {
        warnings.push(
          `Directory is not empty. Found unexpected files: ${unexpectedFiles.join(", ")}`
        );
      }
    } catch {
      // Directory doesn't exist - will be created
    }

    return { valid: true, errors, warnings };
  }

  protected async createDirectoryStructure(
    context: TemplateContext,
    created: string[],
    skipped: string[],
    fsOptions: FSOptions
  ): Promise<void> {
    const dirs = [
      "app",
      "app/(public)",
      "src/app",
      "src/processes",
      "src/pages",
      "src/widgets",
      "src/features",
      "src/features/example",
      "src/entities",
      "src/shared/ui",
      "src/shared/lib",
      "src/shared/config",
    ];

    for (const dir of dirs) {
      const fullPath = path.join(context.cwd, dir);
      try {
        await ensureDir(fullPath, fsOptions);
        created.push(dir);
      } catch (error) {
        skipped.push(dir);
      }
    }
  }

  protected async generateFiles(
    context: TemplateContext,
    created: string[],
    skipped: string[],
    fsOptions: FSOptions
  ): Promise<void> {
    const fileTemplates = this.getFileTemplates(context);

    for (const fileTemplate of fileTemplates) {
      const content = resolveContent(fileTemplate.content, context);

      await trackWrite(
        context.cwd,
        fileTemplate.path,
        content,
        created,
        skipped,
        fsOptions
      );
    }
  }

  protected async generateDocs(
    context: TemplateContext,
    created: string[],
    skipped: string[],
    fsOptions: FSOptions
  ): Promise<void> {
    const variables = createTemplateVariables(context);

    // Main FSD README
    const readmeContent = await loadTemplate(
      "next-app/files/README.fsd.md",
      variables
    );

    await trackWrite(
      context.cwd,
      "README.fsd.md",
      readmeContent,
      created,
      skipped,
      fsOptions
    );

    // Example feature README
    const exampleReadme = await loadTemplate(
      "next-app/files/example/README.md",
      variables
    );

    await trackWrite(
      context.cwd,
      "src/features/example/README.md",
      exampleReadme,
      created,
      skipped,
      fsOptions
    );
  }

  protected getFileTemplates(context: TemplateContext): FileTemplate[] {
    return [
      {
        path: "src/features/example/index.ts",
        content: `// Public API for example feature
// Export only what makes sense for other layers to use
// Example (after implementing):
// export { ExampleComponent } from "./ui/ExampleComponent";
// export { useExample } from "./model/useExample";

export {};
`,
      },
      {
        path: "src/shared/config/index.ts",
        content: `// Shared configuration and constants
export const APP_NAME = "${context.projectName ?? "My App"}";
export const IS_DEV = process.env.NODE_ENV === "development";
`,
      },
      {
        path: "src/shared/lib/index.ts",
        content: `// Shared utility functions and helpers
export {};
`,
      },
      {
        path: "src/shared/ui/index.ts",
        content: `// Shared UI components
export {};
`,
      },
    ];
  }
}
