/**
 * Auto-fix engine for audit violations
 */

import { promises as fs } from "fs";
import * as path from "path";
import { AuditViolation, AutoFix, FileChange } from "../../types/audit";
import { logger } from "../../utils/logger";

export interface FixResult {
  fixed: number;
  failed: number;
  skipped: number;
  details: FixDetail[];
}

export interface FixDetail {
  violation: AuditViolation;
  success: boolean;
  error?: string;
  changes?: string[];
}

export class AutoFixEngine {
  async applyFixes(
    violations: AuditViolation[],
    dryRun: boolean = false
  ): Promise<FixResult> {
    const result: FixResult = {
      fixed: 0,
      failed: 0,
      skipped: 0,
      details: [],
    };

    const fixableViolations = violations.filter(
      (v) => v.autoFixable && v.fixes
    );

    logger.info(
      `Found ${fixableViolations.length} auto-fixable violations out of ${violations.length} total`
    );

    for (const violation of fixableViolations) {
      try {
        if (!violation.fixes || violation.fixes.length === 0) {
          result.skipped++;
          result.details.push({
            violation,
            success: false,
            error: "No fixes available",
          });
          continue;
        }

        for (const fix of violation.fixes) {
          const applied = await this.applyFix(fix, dryRun);

          if (applied.success) {
            result.fixed++;
            result.details.push({
              violation,
              success: true,
              changes: applied.changes,
            });
          } else {
            result.failed++;
            result.details.push({
              violation,
              success: false,
              error: applied.error,
            });
          }
        }
      } catch (error) {
        result.failed++;
        result.details.push({
          violation,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return result;
  }

  private async applyFix(
    fix: AutoFix,
    dryRun: boolean
  ): Promise<{ success: boolean; error?: string; changes?: string[] }> {
    const appliedChanges: string[] = [];

    try {
      for (const change of fix.changes) {
        const applied = await this.applyFileChange(change, dryRun);
        if (applied) {
          appliedChanges.push(change.file);
        }
      }

      return { success: true, changes: appliedChanges };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async applyFileChange(
    change: FileChange,
    dryRun: boolean
  ): Promise<boolean> {
    const { file, type } = change;

    if (dryRun) {
      logger.info(`[DRY RUN] Would apply ${type} to ${file}`);
      return true;
    }

    switch (type) {
      case "insert":
        return await this.insertContent(file, change.newText!);

      case "replace":
        return await this.replaceContent(
          file,
          change.oldText!,
          change.newText!
        );

      case "delete":
        return await this.deleteContent(file, change.oldText!);

      default:
        logger.warn(`Unknown change type: ${type}`);
        return false;
    }
  }

  private async insertContent(
    filePath: string,
    content: string
  ): Promise<boolean> {
    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Check if file already exists
      try {
        await fs.access(filePath);
        logger.warn(`File already exists, skipping: ${filePath}`);
        return false;
      } catch {
        // File doesn't exist, proceed
      }

      await fs.writeFile(filePath, content, "utf-8");
      logger.success(`Created ${filePath}`);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Failed to insert content to ${filePath}`, error);
      } else {
        logger.error(
          `Failed to insert content to ${filePath}`,
          new Error(String(error))
        );
      }
      return false;
    }
  }

  private async replaceContent(
    filePath: string,
    oldText: string,
    newText: string
  ): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, "utf-8");

      if (!content.includes(oldText)) {
        logger.warn(`Old text not found in ${filePath}, skipping replacement`);
        return false;
      }

      const newContent = content.replace(oldText, newText);
      await fs.writeFile(filePath, newContent, "utf-8");
      logger.success(`Replaced content in ${filePath}`);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Failed to replace content in ${filePath}`, error);
      } else {
        logger.error(
          `Failed to replace content in ${filePath}`,
          new Error(String(error))
        );
      }
      return false;
    }
  }

  private async deleteContent(
    filePath: string,
    textToDelete: string
  ): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, "utf-8");

      if (!content.includes(textToDelete)) {
        logger.warn(`Text not found in ${filePath}, skipping deletion`);
        return false;
      }

      const newContent = content.replace(textToDelete, "");
      await fs.writeFile(filePath, newContent, "utf-8");
      logger.success(`Deleted content from ${filePath}`);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Failed to delete content from ${filePath}`, error);
      } else {
        logger.error(
          `Failed to delete content from ${filePath}`,
          new Error(String(error))
        );
      }
      return false;
    }
  }

  /**
   * Create backup before applying fixes
   */
  async createBackup(projectRoot: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(projectRoot, `.fsd-backup-${timestamp}`);

    await fs.mkdir(backupDir, { recursive: true });

    // Copy src directory
    const srcDir = path.join(projectRoot, "src");
    const backupSrc = path.join(backupDir, "src");

    await this.copyDirectory(srcDir, backupSrc);

    logger.success(`Backup created at ${backupDir}`);
    return backupDir;
  }

  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupDir: string, projectRoot: string): Promise<void> {
    const backupSrc = path.join(backupDir, "src");
    const projectSrc = path.join(projectRoot, "src");

    // Remove current src
    await fs.rm(projectSrc, { recursive: true, force: true });

    // Restore from backup
    await this.copyDirectory(backupSrc, projectSrc);

    logger.success(`Restored from backup ${backupDir}`);
  }
}
