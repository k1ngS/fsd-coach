import { TemplateStrategy, TemplateContext, TemplateResult } from "./base";
import { ensureDir, trackWrite } from "../utils/fs";
import { FSOptions, readJsonFile } from "../../utils/fs";
import * as path from "path";

export class NextAppTemplate implements TemplateStrategy {
  name = "next-app";

  async validate(cwd: string): Promise<boolean> {
    const pkg = await readJsonFile<PackageJson>(path.join(cwd, "package.json"));
    return pkg?.dependencies?.["next"] !== undefined;
  }

  async generate(context: TemplateContext): Promise<TemplateResult> {
    const { cwd, dryRun } = context;
    const created: string[] = [];
    const skipped: string[] = [];
    const fsOptions = { dryRun };

    // FSD layers structure
    const layers = [
      "src/app",
      "src/processes",
      "src/pages",
      "src/widgets",
      "src/features",
      "src/entities",
      "src/shared/ui",
      "src/shared/lib",
      "src/shared/config",
    ];

    for (const layer of layers) {
      await ensureDir(path.join(cwd, layer), fsOptions);
      created.push(layer);
    }

    // Generate README
    await this.generateReadme(cwd, created, skipped, fsOptions);

    // Generate example feature
    await this.generateExampleFeature(cwd, created, skipped, fsOptions);

    return {
      created,
      skipped,
      postInstallInstructions: this.getPostInstallMessage(),
    };
  }

  private async generateReadme(
    cwd: string,
    created: string[],
    skipped: string[],
    fsOptions: FSOptions
  ) {
    await trackWrite(
      cwd,
      "README.fsd.md",
      this.getReadmeContent(),
      created,
      skipped,
      fsOptions
    );
  }

  private getReadmeContent(): string {
    return `# FSD Coach - Next.js App Router

Your project is now structured with Feature-Sliced Design.

## 📂 Structure Overview

- **app/**: Next.js App Router (entrypoints)
- **src/app**: Global providers and initialization
- **src/processes**: Multi-feature flows (e.g., auth-flow, onboarding)
- **src/pages**: FSD pages (composition only)
- **src/widgets**: Composite UI blocks (e.g., Header, Sidebar)
- **src/features**: Feature modules (e.g., login, create-campaign)
- **src/entities**: Reusable domain models (e.g., User, Campaign)
- **src/shared**: Shared utilities and components

## 🚀 Next Steps

1. Define your project entities and features
2. Create features: \`fsd-coach add:feature <name>\`
3. Document decisions in generated READMEs

## 📚 Resources

- [FSD Documentation](https://feature-sliced.design)
- [FSD Best Practices](https://feature-sliced.design/docs/guides)
`;
  }

  private async generateExampleFeature(
    cwd: string,
    created: string[],
    skipped: string[],
    fsOptions: FSOptions
  ) {
    await trackWrite(
      cwd,
      "src/features/example/README.md",
      `# Feature: example

This is an example feature to demonstrate FSD structure.

## Questions to Answer

- What problem does this feature solve?
- What entities does it use?
- What should be exposed in the public API?
`,
      created,
      skipped,
      fsOptions
    );

    await trackWrite(
      cwd,
      "src/features/example/index.ts",
      `// Public API for example feature\n// Export only what other layers should use\n`,
      created,
      skipped,
      fsOptions
    );
  }

  private getPostInstallMessage(): string {
    return `
📚 Next.js + FSD setup complete!

Run: pnpm dev
Then: fsd-coach add:feature <your-feature>
    `;
  }
}
