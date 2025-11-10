#!/usr/bin/env node

import { Command} from "commander";
import chalk from "chalk";
import { initProject, addFeature } from "@fsd-coach/core";
import { select, input, checkbox } from "@inquirer/prompts";

const program = new Command();

program
    .name("fsd-coach")
    .description("Your personal Feature-Sliced Design coach for new projects.")
    .version("0.0.1");

// Command: fsd-coach init --template next-app
program
    .command("init")
    .description("Initialize a new project structure guided by FSD Coach.")
    .option(
        "-t, --template <template>",
        'Project template to use (options: "next-app", "fastapi", "fullstack")',
        "next-app"
    )
    .action(async (opts) => {
        const template = opts.template;
        const result = await initProject({ template });

        console.log(chalk.magentaBright("\n[FSD Coach] Project Initialized!"));
        console.log(" Template:", chalk.cyan(result.template));
        console.log( " Path:", chalk.cyan(result.cwd));

        if (result.created.length) {
            console.log(chalk.green("\n Files and directories created:"));
            for (const item of result.created) {
                console.log(" +", item);
            }
        }

        if (result.skipped.length) {
            console.log(chalk.yellow("\n Files and directories skipped (already exist):"));
            for (const item of result.skipped) {
                console.log(" -", item);
            }
        }
        console.log(chalk.magentaBright("\nNow read the README.fsd.md and complete the README responses for each" +
            " feature. Happy coding! 🚀"));
    });

// Command: fsd-coach add:feature
program
    .command("add:feature")
    .description("Create a new feature slice following FSD conventions.")
    .argument("<name>", "Feature name (ex: auth, campaigns, profile)")
    .option(
        "-s, --segments <segments>",
        "Comma-separated segments (default: ui,model,api)",
    )
    .action(async (name, options) => {
        const rawSegments = options.segments
            ? String(options.segments).split(",").map((s: string) => s.trimg()).filter(Boolean)
            : null;

        // If no segments came in the flag, ask interactively:
        const segments =
            rawSegments && rawSegments?.length
                ? rawSegments
                : await checkbox({
                    message: `Which segments to create for the feature "${name}"?`,
                    choices: [
                        {name: "ui", value: "ui", checked: true},
                        {name: "model", value: "model", checked: true},
                        {name: "api", value: "api", checked: true},
                        {name: "lib", value: "lib"}
                    ]
                });
        const result = await addFeature({
            name,
            segments
        });

        console.log(
            chalk.magentaBright("\n[FSD Coach] Feature Created:"),
            chalk.cyan(result.featureName)
        );

        if (result.created.length) {
            console.log(chalk.green("\n Created:"));
            result.created.forEach((p) => console.log(" +", p));
        }

        if (result.skipped.length) {
            console.log(chalk.yellow("\n Ignored (already existed):"));
            result.skipped.forEach((p) => console.log(" -", p));
        }

        console.log(
            chalk.magentaBright(
                "\nNow open the feature README and answer the questions before writing code. 😉\n"
            )
        );
    });

program.parse(process.argv);