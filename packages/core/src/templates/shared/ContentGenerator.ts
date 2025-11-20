import { TemplateContext } from "../types";

/**
 * Replace {{variables}} in template string
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
 * Create variables from context
 */
export function createTemplateVariables(
  context: TemplateContext
): Record<string, string> {
  const now = new Date();

  return {
    projectName: context.projectName ?? "my-project",
    cwd: context.cwd,
    timestamp: now.toISOString(),
    year: now.getFullYear().toString(),
    date: now.toLocaleDateString("en-US"),
    ...Object.entries(context.options).reduce(
      (acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      },
      {} as Record<string, string>
    ),
  };
}
