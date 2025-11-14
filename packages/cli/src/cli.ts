#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { initProject, addFeature, addEntity } from "@fsd-coach/core";
import { checkbox } from "@inquirer/prompts";
import { logger } from "../../core/src/utils/logger";
import { isFSDCoachError } from "../../core/src/utils/errors";
import { createConfigCommand } from "./commands/config";
import { createAuditCommand } from "./commands/audit";
import { createCacheCommand } from "./commands/cache";
import { createListCommand } from "./commands/list";

async function safeExecute(action: () => Promise<void>) {
  try {
    await action();
  } catch (error) {
    if (isFSDCoachError(error)) {
      logger.error(error.message);
      if (program.opts().verbose) {
        logger.debug(error.toString());
      }
    } else if (error instanceof Error) {
      logger.error("An unexpected error occurred.", error);
    }
    process.exit(1);
  }
}

const program = new Command();

program
  .name("fsd-coach")
  .description("Your personal Feature-Sliced Design coach for new projects.")
  .version("0.1.0")
  .option("-v, --verbose", "Enable verbose logging")
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.verbose) {
      process.env.DEBUG = "1";
      logger.debug("Verbose mode enabled");
    }
  });

// Add config command
program.addCommand(createConfigCommand());

// Add audit command
program.addCommand(createAuditCommand());

// Add cache command
program.addCommand(createCacheCommand());

// Add list command
program.addCommand(createListCommand());

// Command: fsd-coach init --template next-app
program
  .command("init")
  .description("Initialize a new project structure guided by FSD Coach.")
  .option(
    "-t, --template <template>",
    'Project template to use (options: "next-app", "fastapi", "fullstack")',
    "next-app"
  )
  .option("--dry-run", "Simulate project initialization without writing files")
  .action((opts) =>
    safeExecute(async () => {
      const template = opts.template;
      const dryRun = Boolean(opts.dryRun);
      logger.step(
        `${dryRun ? "[DRY RUN] " : ""}Initializing new project with template: ${template}`
      );

      const result = await initProject({
        template,
        dryRun,
      });

      logger.success("Project initialized successfully!");
      logger.info(`Template: ${chalk.cyan(result.template)}`);
      logger.info(`Path: ${chalk.cyan(result.cwd)}`);

      if (result.created.length) {
        console.log(chalk.green("\n✓ Files and directories created:"));
        logger.list(result.created);
      }

      if (result.skipped.length) {
        console.log(
          chalk.yellow("\n⚠ Files and directories skipped (already exist):")
        );
        logger.list(result.skipped, "-");
      }
      console.log(
        chalk.magentaBright(
          "\n📚 Now read the README.fsd.md and complete the README responses for each feature. Happy coding! 🚀\n"
        )
      );
    })
  );

// Command: fsd-coach add:feature
program
  .command("add:feature")
  .description("Create a new feature slice following FSD conventions.")
  .argument("<name>", "Feature name (ex: auth, campaigns, profile)")
  .option(
    "-s, --segments <segments>",
    "Comma-separated segments (default: ui,model,api)"
  )
  .option("--dry-run", "Simulate feature creation without writing files")
  .action((name, options) =>
    safeExecute(async () => {
      const rawSegments = options.segments
        ? String(options.segments)
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : null;

      // If no segments came in the flag, ask interactively:
      const segments =
        rawSegments && rawSegments?.length
          ? rawSegments
          : await checkbox({
              message: `Which segments to create for the feature "${name}"?`,
              choices: [
                { name: "ui", value: "ui", checked: true },
                { name: "model", value: "model", checked: true },
                { name: "api", value: "api", checked: true },
                { name: "lib", value: "lib" },
              ],
            });
      const dryRun = Boolean(options.dryRun);
      const result = await addFeature({
        name,
        segments,
        dryRun,
      });

      logger.success(
        `${dryRun ? "[DRY RUN] Feature would be created" : "Feature created"}: ${chalk.cyan(result.name)}`
      );

      if (result.created.length) {
        console.log(chalk.green("\n✓ Created:"));
        logger.list(result.created);
      }

      if (result.skipped.length) {
        console.log(chalk.yellow("\n⚠ Ignored (already existed):"));
        logger.list(result.skipped, "-");
      }

      console.log(
        chalk.magentaBright(
          "\n📝 Now open the feature README and answer the questions before writing code. 😉\n"
        )
      );
    })
  );

// Command: fsd-coach add:entity
program
  .command("add:entity")
  .description(
    "Create a new entity module (domain model) following FSD conventions."
  )
  .argument("<name>", "Entity name (ex: user, campaign, session)")
  .option(
    "-s, --segments <segments>",
    "Comma-separated segments (default: model,ui)"
  )
  .option("--dry-run", "Simulate entity creation without writing files")
  .action((name, options) =>
    safeExecute(async () => {
      const rawSegments = options.segments
        ? String(options.segments)
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : null;

      const segments =
        rawSegments && rawSegments?.length
          ? rawSegments
          : await checkbox({
              message: `Which segments to create for the entity "${name}"?`,
              choices: [
                { name: "model", value: "model", checked: true },
                { name: "ui", value: "ui", checked: true },
                { name: "lib", value: "lib" },
              ],
            });

      const dryRun = Boolean(options.dryRun);
      const result = await addEntity({
        name,
        segments,
        dryRun,
      });

      logger.success(
        `${dryRun ? "[DRY RUN] Entity would be created" : "Entity created"}: ${chalk.cyan(result.name)}`
      );

      if (result.created.length) {
        console.log(chalk.green("\n✓ Created:"));
        logger.list(result.created);
      }

      if (result.skipped.length) {
        console.log(chalk.yellow("\n⚠ Ignored (already existed):"));
        logger.list(result.skipped, "-");
      }

      console.log(
        chalk.magentaBright(
          "\n🧠 Now open the entity README and document the domain before spreading that entity throughout the project.\n"
        )
      );
    })
  );

program.parse(process.argv);
