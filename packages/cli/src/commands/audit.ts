import { Command } from "commander";
import chalk from "chalk";
import { auditProject } from "@fsd-coach/core";
import { logger, isFSDCoachError } from "@fsd-coach/core";

export function createAuditCommand(): Command {
  const audit = new Command("audit");

  audit
    .description("Audit FSD architecture compliance")
    .option("-s, --strict", "Treat warnings as errors")
    .option("--fix", "Apply automatic fixes (not implemented yet)")
    .action(async (options) => {
      try {
        console.log(chalk.blue("🔍 Auditing FSD architecture...\n"));

        const result = await auditProject({
          strict: options.strict,
          autoFix: options.fix,
        });

        // Display summary
        console.log(chalk.blue("\n📊 Audit Summary"));
        console.log(chalk.gray("─".repeat(50)));
        console.log(`Files scanned: ${chalk.cyan(result.totalFiles)}`);
        console.log(
          `Errors: ${
            result.summary.errors > 0
              ? chalk.red(result.summary.errors)
              : chalk.green(result.summary.errors)
          }`
        );
        console.log(
          `Warnings: ${
            result.summary.warnings > 0
              ? chalk.yellow(result.summary.warnings)
              : chalk.green(result.summary.warnings)
          }`
        );
        console.log(`Infos: ${chalk.blue(result.summary.infos)}`);

        // Display violations
        if (result.violations.length > 0) {
          console.log(chalk.blue("\n⚠️  Violations Found:\n"));

          const grouped = groupViolationsByFile(result.violations);

          for (const [file, violations] of Object.entries(grouped)) {
            console.log(chalk.cyan(`\n📄 ${file}`));

            for (const violation of violations) {
              const icon =
                violation.severity === "error"
                  ? "✗"
                  : violation.severity === "warning"
                    ? "⚠"
                    : "ℹ";
              const color =
                violation.severity === "error"
                  ? chalk.red
                  : violation.severity === "warning"
                    ? chalk.yellow
                    : chalk.blue;

              console.log(
                color(
                  `  ${icon} Line ${violation.line || "?"}: ${
                    violation.message
                  }`
                )
              );

              if (violation.suggestion) {
                console.log(chalk.gray(`    💡 ${violation.suggestion}`));
              }
            }
          }
        }

        // Final result
        console.log("\n" + chalk.gray("─".repeat(50)));

        if (result.passed) {
          console.log(
            chalk.green("✅ Audit passed! FSD architecture is valid.\n")
          );
          process.exit(0);
        } else {
          console.log(
            chalk.red("❌ Audit failed! Please fix the violations above.\n")
          );
          process.exit(1);
        }
      } catch (error) {
        if (isFSDCoachError(error)) {
          logger.error(error.message);
        } else if (error instanceof Error) {
          logger.error("Audit failed", error);
        }
        process.exit(1);
      }
    });

  return audit;
}

function groupViolationsByFile(violations: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  for (const violation of violations) {
    if (!grouped[violation.file]) {
      grouped[violation.file] = [];
    }
    grouped[violation.file].push(violation);
  }

  return grouped;
}
