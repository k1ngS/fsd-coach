import { ITemplate, TemplateMetadata, TemplateName } from "./types";
import { createError } from "../utils/errors";

export class TemplateRegistry {
  private templates = new Map<TemplateName, ITemplate>();

  /**
   * Register a template
   */
  register(template: ITemplate): void {
    this.templates.set(template.metadata.name, template);
  }

  /**
   * Unregister a template (useful for plugins)
   */
  unregister(name: TemplateName): boolean {
    return this.templates.delete(name);
  }

  /**
   * Get a specific template
   */
  get(name: TemplateName): ITemplate {
    const template = this.templates.get(name);
    if (!template) {
      const available = this.list()
        .map((t) => t.name)
        .join(", ");
      throw createError(
        "TEMPLATE_NOT_FOUND",
        `Template "${name}" not found. Available templates: ${available}`
      );
    }
    return template;
  }

  /**
   * List all registered templates metadata
   */
  list(): TemplateMetadata[] {
    return Array.from(this.templates.values()).map((t) => t.metadata);
  }

  /**
   * Check if template exists
   */
  has(name: TemplateName): boolean {
    return this.templates.has(name);
  }

  /**
   * Get template count
   */
  count(): number {
    return this.templates.size;
  }
}

// Singleton instance
export const templateRegistry = new TemplateRegistry();
