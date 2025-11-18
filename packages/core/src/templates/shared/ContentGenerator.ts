import { promises as fs } from "fs";
import * as path from "path";
import { TemplateContext } from "../types";

const TEMPLATES_DIR = path.join(__dirname, "../");

/**
 * Load file content from templates directory
 */
export async function loadFileContent(relativePath: string): Promise<string> {
  const fullPath = path.join(TEMPLATES_DIR, relativePath);
  try {
    return await fs.readFile(fullPath, "utf-8");
  } catch (error) {
    throw new Error(
      `Failed to load template file: ${relativePath}. Error: ${error}`
    );
  }
}

/**
 * Generate dynamic content with variable substitution
 * Supports {{variableName}} syntax
 */
export function generateContent(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] ?? match;
  });
}

/**
 * Load and process template with variables
 */
export async function loadTemplate(
  relativePath: string,
  variables: Record<string, string> = {}
): Promise<string> {
  const content = await loadFileContent(relativePath);
  return generateContent(content, variables);
}

/**
 * Generate content from inline function or string
 */
export function resolveContent(
  content: string | ((context: TemplateContext) => string),
  context: TemplateContext
): string {
  if (typeof content === "function") {
    return content(context);
  }
  return content;
}

/**
 * Create variables object from context
 */
export function createTemplateVariables(
  context: TemplateContext
): Record<string, string> {
  return {
    projectName: context.projectName ?? "my-project",
    cwd: context.cwd,
    timestamp: new Date().toISOString(),
    year: new Date().getFullYear().toString(),
    ...Object.entries(context.options).reduce(
      (acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      },
      {} as Record<string, string>
    ),
  };
}
