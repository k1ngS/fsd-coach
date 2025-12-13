/**
 * Extended audit command with metrics and auto-fix
 */

import { Command } from "commander";
import chalk from "chalk";
import {
  auditProject,
  MetricsCalculator,
  AutoFixEngine,
  i18n,
} from "@fsd-coach/core";
import { logger, isFSDCoachError } from "@fsd-coach/core";
import { confirm } from "@inquirer/prompts";
import * as path from "path";
import { promises as fs } from "fs";

export function createAuditCommand(): Command {
  const audit = new Command("audit");

  audit
    .description("Audit FSD architecture compliance")
    .option("-s, --strict", "Treat warnings as errors")
    .option("--fix", "Apply automatic fixes")
    .option("--dry-run", "Preview fixes without applying")
    .option("--metrics", "Calculate and display project metrics")
    .option(
      "--export-format <format>",
      "Export format (json, csv, markdown)",
      "json"
    )
    .option(
      "--output-dir <dir>",
      "Output directory for reports",
      ".fsd-reports"
    )
    .option("--locale <locale>", "Language (en, pt-BR)", "en")
    .action(async (options) => {
      try {
        // Set locale
        if (options.locale) {
          i18n.setLocale(options.locale);
        }

        console.log(chalk.blue(i18n.t("cli.audit.starting")));

        const result = await auditProject({
          strict: options.strict,
          autoFix: options.fix,
        });

        // Display summary
        console.log(chalk.blue(`\n${i18n.t("cli.audit.summary")}`));
        console.log(chalk.gray("─".repeat(50)));
        console.log(
          i18n.t("cli.audit.filesScanned", { count: String(result.totalFiles) })
        );
        console.log(
          `${i18n.t("cli.audit.errors")}: ${
            result.summary.errors > 0
              ? chalk.red(result.summary.errors)
              : chalk.green(result.summary.errors)
          }`
        );
        console.log(
          `${i18n.t("cli.audit.warnings")}: ${
            result.summary.warnings > 0
              ? chalk.yellow(result.summary.warnings)
              : chalk.green(result.summary.warnings)
          }`
        );
        console.log(
          `${i18n.t("cli.audit.infos")}: ${chalk.blue(result.summary.infos)}`
        );

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
                  `  ${icon} Line ${violation.line || "?"}: ${violation.message}`
                )
              );

              if (violation.suggestion) {
                console.log(chalk.gray(`    💡 ${violation.suggestion}`));
              }
            }
          }

          // Auto-fix
          if (options.fix) {
            await handleAutoFix(result.violations, options.dryRun);
          }
        }

        // Calculate and display metrics
        if (options.metrics) {
          await handleMetrics(result, options);
        }

        // Final result
        console.log("\n" + chalk.gray("─".repeat(50)));

        if (result.passed) {
          console.log(chalk.green(i18n.t("cli.audit.passed")));
          process.exit(0);
        } else {
          console.log(chalk.red(i18n.t("cli.audit.failed")));
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

async function handleAutoFix(
  violations: any[],
  dryRun: boolean
): Promise<void> {
  const fixableCount = violations.filter((v) => v.autoFixable).length;

  if (fixableCount === 0) {
    console.log(chalk.yellow("\n⚠️  No auto-fixable violations found."));
    return;
  }

  console.log(chalk.blue(`\n🔧 Found ${fixableCount} auto-fixable violations`));

  if (!dryRun) {
    const shouldFix = await confirm({
      message: "Do you want to apply automatic fixes?",
      default: false,
    });

    if (!shouldFix) {
      console.log(chalk.yellow("Skipped auto-fix"));
      return;
    }

    // Create backup
    const engine = new AutoFixEngine();
    const backupDir = await engine.createBackup(process.cwd());
    console.log(chalk.green(`Backup created: ${backupDir}`));
  }

  const engine = new AutoFixEngine();
  const result = await engine.applyFixes(violations, dryRun);

  console.log(chalk.green(`\n✅ Fixed: ${result.fixed}`));
  console.log(chalk.red(`❌ Failed: ${result.failed}`));
  console.log(chalk.yellow(`⏭️  Skipped: ${result.skipped}`));

  if (result.details.length > 0) {
    console.log(chalk.blue("\nFix Details:"));
    for (const detail of result.details) {
      if (detail.success) {
        console.log(
          chalk.green(
            `  ✓ Fixed: ${detail.violation.type} in ${detail.violation.file}`
          )
        );
      } else {
        console.log(
          chalk.red(`  ✗ Failed: ${detail.violation.type} - ${detail.error}`)
        );
      }
    }
  }
}

async function handleMetrics(result: any, options: any): Promise<void> {
  console.log(chalk.blue("\n📊 Calculating metrics..."));

  const calculator = new MetricsCalculator();
  const metrics = await calculator.calculate(result, process.cwd());

  console.log(chalk.blue("\n📈 Project Metrics"));
  console.log(chalk.gray("─".repeat(50)));
  console.log(
    `Cyclomatic Complexity: ${chalk.cyan(metrics.cyclomaticComplexity)}`
  );
  console.log(`Dependency Count: ${chalk.cyan(metrics.dependencyCount)}`);
  console.log(
    `Circular Dependencies: ${chalk.cyan(metrics.circularDependencyCount)}`
  );
  console.log(`Layer Violations: ${chalk.cyan(metrics.layerViolations)}`);
  console.log(`Total Lines: ${chalk.cyan(metrics.totalLines)}`);
  console.log(
    `Avg Lines/File: ${chalk.cyan(metrics.avgLinesPerFile.toFixed(2))}`
  );
  console.log(
    `Public API Coverage: ${chalk.cyan(metrics.publicApiCoverage.toFixed(2))}%`
  );
  console.log(
    `Maintainability Index: ${chalk.cyan(metrics.maintainabilityIndex.toFixed(2))}/100`
  );
  console.log(
    `Technical Debt: ${chalk.cyan(metrics.technicalDebt.hours)} hours (${metrics.technicalDebt.issues} issues)`
  );

  // Export metrics
  if (options.outputDir) {
    const outputDir = path.join(process.cwd(), options.outputDir);
    await fs.mkdir(outputDir, { recursive: true });

    if (options.exportFormat === "json") {
      const outputPath = path.join(outputDir, "metrics.json");
      await calculator.exportToJson(metrics, outputPath);
      console.log(chalk.green(`\n📄 Metrics exported to ${outputPath}`));
    } else if (options.exportFormat === "csv") {
      const outputPath = path.join(outputDir, "metrics.csv");
      await calculator.exportToCsv(metrics, outputPath);
      console.log(chalk.green(`\n📄 Metrics exported to ${outputPath}`));
    }
  }
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
