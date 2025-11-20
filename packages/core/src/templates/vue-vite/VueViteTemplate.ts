import path from "path";
import { ensureDir } from "../../utils/fs";
import { BaseFSDTemplate } from "../base/BaseFSDTemplate";
import { ViteBootstrapper } from "../bootstrappers";

export class VueViteTemplate extends BaseFSDTemplate {
  protected bootstrapper = new ViteBootstrapper("vue");

  readonly metadata = {
    name: "vue-vite" as const,
    displayName: "Vue 3 + Vite + FSD",
    description: "Vue 3 SPA with Vite and Feature-Sliced Design",
    version: "1.0.0",
    tags: ["frontend", "vue", "vite", "fsd", "typescript"],
    author: "FSD Coach",
  };

  async applyFSD(context: any, fsOptions: any): Promise<any> {
    // Similar to React - create FSD structure
    const created: string[] = [];
    const skipped: string[] = [];

    const fsdDirs = [
      "src/app",
      "src/pages",
      "src/widgets",
      "src/features",
      "src/features/example",
      "src/entities",
      "src/shared/ui",
      "src/shared/lib",
      "src/shared/api",
      "src/shared/config",
    ];

    for (const dir of fsdDirs) {
      await ensureDir(path.join(context.cwd, dir), fsOptions);
      if (!fsOptions.dryRun) created.push(dir);
    }

    return { created, skipped, metadata: this.metadata };
  }
}
