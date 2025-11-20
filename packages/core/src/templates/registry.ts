import { ITemplate, TemplateName, TemplateMetadata } from "./types";
import { createError } from "../utils/errors";

export class TemplateRegistry {
  private templates = new Map<TemplateName, ITemplate>();

  register(template: ITemplate): void {
    this.templates.set(template.metadata.name, template);
  }

  get(name: TemplateName): ITemplate {
    const template = this.templates.get(name);

    if (!template) {
      const available = this.list()
        .map((t) => t.name)
        .join(", ");
      throw createError(
        "TEMPLATE_NOT_FOUND",
        `Template "${name}" not found. Available: ${available}`
      );
    }

    return template;
  }

  list(): TemplateMetadata[] {
    return Array.from(this.templates.values()).map((t) => t.metadata);
  }

  has(name: TemplateName): boolean {
    return this.templates.has(name);
  }
}

export const templateRegistry = new TemplateRegistry();
