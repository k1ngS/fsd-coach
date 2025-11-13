import { Command } from "commander";
import chalk from "chalk";
import { FileCache } from "@fsd-coach/core";
import { logger } from "@fsd-coach/core";

export function createCacheCommand(): Command {
  const cmd = new Command("cache");

  cmd
    .description("Manage FSD Coach cache")
    .option("-c, --clear", "Clear all cache")
    .option("-s, --stats", "Show cache statistics")
    .action(async (options) => {
      if (options.clear) {
        const cache = new FileCache();
        await cache.clear();
        logger.success("Cache cleared successfully");
        return;
      }

      if (options.stats) {
        const cache = new FileCache();
        const stats = await cache.getStats();

        console.log(chalk.cyan("\n📊 Cache Statistics:"));
        console.log(`Files: ${stats.files}`);
        console.log(`Total size: ${(stats.totalSize / 1024).toFixed(2)} KB`);

        if (stats.files === 0) {
          console.log(
            chalk.gray("\nNo cache found. Run audit to create cache.")
          );
        }
        console.log();
        return;
      }

      // Se nenhuma opção, mostrar stats
      const cache = new FileCache();
      const stats = await cache.getStats();

      console.log(chalk.cyan("\n📊 Cache Statistics:"));
      console.log(`Files: ${stats.files}`);
      console.log(`Total size: ${(stats.totalSize / 1024).toFixed(2)} KB`);
      console.log();
    });

  return cmd;
}
