import { Command } from "commander";
import chalk from "chalk";
import {
  getEffectiveConfig,
  saveConfig,
  getConfigValue,
  setConfigValue,
  findConfigFile,
  deleteConfig,
  DEFAULT_CONFIG,
  configExists,
} from "@fsd-coach/core";
import { logger, isFSDCoachError } from "@fsd-coach/core";

export function createConfigCommand(): Command {
  const config = new Command("config");

  config.description("Manage FSD Coach configuration");

  // config init
  config
    .command("init")
    .description("Initialize a new configuration file")
    .option("-f, --force", "Overwrite existing config file")
    .action(async (options) => {
      try {
        const exists = await configExists();

        if (exists && !options.force) {
          logger.error("Config file already exists. Use --force to overwrite.");
          process.exit(1);
        }

        const configPath = await saveConfig(DEFAULT_CONFIG);
        logger.success(`Config file created: ${chalk.cyan(configPath)}`);

        console.log(
          chalk.gray("\nYou can now customize the config file to your needs.")
        );
        console.log(
          chalk.gray(
            'Run "fsd-coach config show" to see the current configuration.\n'
          )
        );
      } catch (error) {
        if (isFSDCoachError(error)) {
          logger.error(error.message);
        } else if (error instanceof Error) {
          logger.error("Failed to initialize config", error);
        }
        process.exit(1);
      }
    });

  // config show
  config
    .command("show")
    .description("Show current configuration")
    .option("-d, --defaults", "Show default configuration")
    .action(async (options) => {
      try {
        const configData = options.defaults
          ? DEFAULT_CONFIG
          : await getEffectiveConfig();

        const configPath = await findConfigFile();

        if (configPath) {
          console.log(chalk.blue("📄 Config file:"), chalk.cyan(configPath));
        } else {
          console.log(
            chalk.yellow(
              "⚠  Using default configuration (no config file found)"
            )
          );
        }

        console.log(chalk.blue("\n⚙  Configuration:\n"));
        console.log(JSON.stringify(configData, null, 2));
      } catch (error) {
        if (isFSDCoachError(error)) {
          logger.error(error.message);
        } else if (error instanceof Error) {
          logger.error("Failed to show config", error);
        }
        process.exit(1);
      }
    });

  // config get <key>
  config
    .command("get")
    .description("Get a specific configuration value")
    .argument("<key>", 'Configuration key (e.g., "rootDir.features")')
    .action(async (key: string) => {
      try {
        const configData = await getEffectiveConfig();
        const value = getConfigValue(configData, key);

        if (value === undefined) {
          logger.error(`Config key "${key}" not found`);
          process.exit(1);
        }

        console.log(chalk.blue(`${key}:`), JSON.stringify(value, null, 2));
      } catch (error) {
        if (isFSDCoachError(error)) {
          logger.error(error.message);
        } else if (error instanceof Error) {
          logger.error("Failed to get config value", error);
        }
        process.exit(1);
      }
    });

  // config set <key> <value>
  config
    .command("set")
    .description("Set a configuration value")
    .argument("<key>", 'Configuration key (e.g., "rootDir.features")')
    .argument("<value>", "Configuration value (JSON format)")
    .action(async (key: string, value: string) => {
      try {
        // Check if config exists
        const exists = await configExists();

        if (!exists) {
          logger.error(
            'No config file found. Run "fsd-coach config init" first.'
          );
          process.exit(1);
        }

        // Parse value
        let parsedValue: unknown;
        try {
          parsedValue = JSON.parse(value);
        } catch {
          // If not valid JSON, treat as string
          parsedValue = value;
        }

        // Load current config
        const currentConfig = await getEffectiveConfig();

        // Update config
        const newConfig = setConfigValue(currentConfig, key, parsedValue);

        // Save
        await saveConfig(newConfig);

        logger.success(
          `Config updated: ${chalk.cyan(key)} = ${JSON.stringify(parsedValue)}`
        );
      } catch (error) {
        if (isFSDCoachError(error)) {
          logger.error(error.message);
        } else if (error instanceof Error) {
          logger.error("Failed to set config value", error);
        }
        process.exit(1);
      }
    });

  // config reset
  config
    .command("reset")
    .description("Reset configuration to defaults")
    .option("-y, --yes", "Skip confirmation")
    .action(async (options) => {
      try {
        const exists = await configExists();

        if (!exists) {
          logger.warn("No config file found to reset");
          return;
        }

        if (!options.yes) {
          console.log(
            chalk.yellow("⚠  This will reset your configuration to defaults.")
          );
          console.log(chalk.gray("Use --yes to skip this confirmation.\n"));
          process.exit(0);
        }

        await deleteConfig();
        const configPath = await saveConfig(DEFAULT_CONFIG);

        logger.success(`Config reset to defaults: ${chalk.cyan(configPath)}`);
      } catch (error) {
        if (isFSDCoachError(error)) {
          logger.error(error.message);
        } else if (error instanceof Error) {
          logger.error("Failed to reset config", error);
        }
        process.exit(1);
      }
    });

  // config delete
  config
    .command("delete")
    .description("Delete configuration file")
    .option("-y, --yes", "Skip confirmation")
    .action(async (options) => {
      try {
        const exists = await configExists();

        if (!exists) {
          logger.warn("No config file found to delete");
          return;
        }

        if (!options.yes) {
          console.log(
            chalk.yellow("⚠  This will delete your configuration file.")
          );
          console.log(chalk.gray("Use --yes to skip this confirmation.\n"));
          process.exit(0);
        }

        await deleteConfig();
        logger.success("Config file deleted");
      } catch (error) {
        if (isFSDCoachError(error)) {
          logger.error(error.message);
        } else if (error instanceof Error) {
          logger.error("Failed to delete config", error);
        }
        process.exit(1);
      }
    });

  return config;
}
