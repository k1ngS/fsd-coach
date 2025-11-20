#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import {
  initProject,
  addFeature,
  addEntity,
  isFSDCoachError,
  logger,
  templateRegistry,
  FULLSTACK_COMBINATIONS,
} from "@fsd-coach/core";
import { checkbox, select } from "@inquirer/prompts";
import { createConfigCommand } from "./commands/config";
import { createAuditCommand } from "./commands/audit";
import { createCacheCommand } from "./commands/cache";
import { createListCommand } from "./commands/list";

import { spawn } from "child_process";
import { promises as fs } from "fs";

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

// Add command to list available templates
program
  .command("templates")
  .description("List available project templates")
  .action(() => {
    const templates = templateRegistry.list();

    console.log(chalk.blue("\n📦 Available Templates:\n"));

    templates.forEach((template) => {
      console.log(chalk.cyan(`  ${template.name}`));
      console.log(chalk.gray(`     ${template.description}`));
      console.log(chalk.gray(`     Tags: ${template.tags.join(", ")}`));
      console.log();
    });
  });

// Command: fsd-coach init --template next-app
program
  .command("init")
  .description("Initialize FSD project")
  .option("-t, --template <name>", "Template name", "next-app")
  .option("-n, --name <name>", "Project name")
  .option("--combination <combo>", "Fullstack combination")
  .option("--no-create-app", "Skip framework bootstrap (FSD only)")
  .option("--no-monorepo", "Disable monorepo (fullstack only)")
  .option("--force", "Force in non-empty directory")
  .option("--dry-run", "Simulate without writing")
  .action(async (opts) => {
    await safeExecute(async () => {
      // Validate template exists
      if (!templateRegistry.has(opts.template)) {
        const available = templateRegistry
          .list()
          .map((t) => t.name)
          .join(", ");
        throw new Error(`Unknown template. Available: ${available}`);
      }

      // Interactive combination selection for fullstack
      let combination = opts.combination;

      if (opts.template === "fullstack" && !combination) {
        combination = await select({
          message: "Choose fullstack combination:",
          choices: Object.entries(FULLSTACK_COMBINATIONS).map(
            ([key, config]) => ({
              name: `${config.name} - ${config.description}`,
              value: key,
            })
          ),
        });
      }

      // Execute
      const result = await initProject({
        template: opts.template,
        projectName: opts.name,
        dryRun: opts.dryRun,
        templateOptions: {
          createApp: opts.createApp,
          combination,
          monorepo: opts.monorepo,
          force: opts.force,
        },
      });

      // Show results
      logger.success("✅ Project initialized!");
      logger.info(`Template: ${chalk.cyan(result.template)}`);
      logger.info(`Location: ${chalk.cyan(result.cwd)}`);

      if (result.created.length > 0) {
        console.log(chalk.green("\nCreated:"));
        result.created.slice(0, 15).forEach((f) => console.log(`  ${f}`));
        if (result.created.length > 15) {
          console.log(
            chalk.gray(`  ... and ${result.created.length - 15} more`)
          );
        }
      }

      console.log(
        chalk.magenta("\n📚 Read README.fsd.md for architecture guide!\n")
      );
    });
  });

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

// --- Helpers for Next.js app detection and creation ---
async function detectExistingNextApp(cwd: string): Promise<boolean> {
  try {
    const pkgPath = path.join(cwd, "package.json");
    const raw = await fs.readFile(pkgPath, "utf-8");
    const pkg = JSON.parse(raw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const deps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    };
    return typeof deps["next"] === "string";
  } catch {
    // Could not read package.json, assume no Next.js
    return false;
  }
}

async function isSafeToCreateNextApp(cwd: string): Promise<boolean> {
  const entries = await fs.readdir(cwd, { withFileTypes: true });

  if (!entries.length) return true;

  // We allow only "harmless" files so as not to destroy an existing project
  const allowed = new Set([
    ".git",
    ".gitignore",
    ".gitattributes",
    "README.md",
    "LICENSE",
  ]);

  for (const entry of entries) {
    if (!allowed.has(entry.name)) {
      return false;
    }
  }

  return true;
}

async function runCreateNextApp(cwd: string, dryRun: boolean): Promise<void> {
  const cmd = "pnpm";
  const args = ["dlx", "create-next-app@latest", ".", "--yes", "--use-pnpm"];

  const pretty = `${cmd} ${args.join(" ")}`;

  logger.step(
    `${dryRun ? "[DRY RUN] " : ""}Creating Next.js app with command: ${chalk.cyan(pretty)}`
  );

  if (dryRun) return;

  await new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`create-next-app exited with code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

program.parse(process.argv);
