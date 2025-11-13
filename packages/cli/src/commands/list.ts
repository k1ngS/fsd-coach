import { Command } from "commander";
import chalk from "chalk";
import { promises as fs } from "fs";
import * as path from "path";
import { logger } from "@fsd-coach/core";

interface ProjectStructure {
  features: string[];
  entities: string[];
  widgets: string[];
}

async function getProjectStructure(): Promise<ProjectStructure> {
  const srcDir = path.join(process.cwd(), "src");
  const structure: ProjectStructure = {
    features: [],
    entities: [],
    widgets: [],
  };

  for (const layer of ["features", "entities", "widgets"] as const) {
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
    .option("-j, --json", "Output as JSON")
    .action(async (options) => {
      const structure = await getProjectStructure();

      if (options.json) {
        logger.info(JSON.stringify(structure, null, 2));
        return;
      }

      const showAll =
        !options.features && !options.entities && !options.widgets;

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

      const total =
        structure.features.length +
        structure.entities.length +
        structure.widgets.length;

      logger.info(chalk.dim(`\nTotal: ${total} slices\n`));
    });

  return cmd;
}
