import { Command } from "commander";
import chalk from "chalk";
import { promises as fs } from "fs";
import * as path from "path";
import { logger } from "@fsd-coach/core";

interface ProjectStructure {
  features: string[];
  entities: string[];
  widgets: string[];
  processes: string[];
  pages: string[];
}

async function getProjectStructure(): Promise<ProjectStructure> {
  const srcDir = path.join(process.cwd(), "src");
  const structure: ProjectStructure = {
    features: [],
    entities: [],
    widgets: [],
    processes: [],
    pages: [],
  };

  for (const layer of [
    "features",
    "entities",
    "widgets",
    "processes",
    "pages",
  ] as const) {
    const layerDir = path.join(srcDir, layer);

    try {
      const items = await fs.readdir(layerDir, { withFileTypes: true });
      structure[layer] = items
        .filter((item) => item.isDirectory())
        .map((item) => item.name)
        .sort();
    } catch {
      // Layer não existe
    }
  }

  return structure;
}

export function createListCommand(): Command {
  const cmd = new Command("list");

  cmd
    .description("List all features, entities, and widgets in the project")
    .option("--features", "List only features")
    .option("--entities", "List only entities")
    .option("--widgets", "List only widgets")
    .option("--processes", "List only processes")
    .option("--pages", "List only pages")
    .option("-j, --json", "Output as JSON")
    .action(async (options) => {
      const structure = await getProjectStructure();

      if (options.json) {
        logger.info(JSON.stringify(structure, null, 2));
        return;
      }

      const showAll =
        !options.features &&
        !options.entities &&
        !options.widgets &&
        !options.processes &&
        !options.pages;

      if (showAll || options.features) {
        logger.info(chalk.cyan("\n📦 Features:"));
        if (structure.features.length === 0) {
          logger.info(chalk.gray("  (none)"));
        } else {
          structure.features.forEach((f) => logger.info(`  - ${f}`));
        }
      }

      if (showAll || options.entities) {
        logger.info(chalk.cyan("\n🔷 Entities:"));
        if (structure.entities.length === 0) {
          logger.info(chalk.gray("  (none)"));
        } else {
          structure.entities.forEach((e) => logger.info(`  - ${e}`));
        }
      }

      if (showAll || options.widgets) {
        logger.info(chalk.cyan("\n🧩 Widgets:"));
        if (structure.widgets.length === 0) {
          logger.info(chalk.gray("  (none)"));
        } else {
          structure.widgets.forEach((w) => logger.info(`  - ${w}`));
        }
      }

      if (showAll || options.processes) {
        logger.info(chalk.cyan("\n⚙️ Processes:"));
        if (structure.processes.length === 0) {
          logger.info(chalk.gray(" (none)"));
        } else {
          structure.processes.forEach((p) => logger.info(` - ${p}`));
        }
      }

      if (showAll || options.pages) {
        logger.info(chalk.cyan("\n📄 Pages:"));
        if (structure.pages.length === 0) {
          logger.info(chalk.gray(" (none)"));
        } else {
          structure.pages.forEach((pg) => logger.info(` - ${pg}`));
        }
      }

      const total =
        structure.features.length +
        structure.entities.length +
        structure.widgets.length +
        structure.processes.length +
        structure.pages.length;

      logger.info(chalk.dim(`\nTotal: ${total} slices\n`));
    });

  return cmd;
}
