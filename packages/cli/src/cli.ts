#!/usr/bin/env node

import { Command} from "commander";
import chalk from "chalk";
import { initProject } from "@fsd-coach/core";

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

program.parse(process.argv);