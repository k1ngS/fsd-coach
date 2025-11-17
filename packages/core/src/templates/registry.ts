import { TemplateStrategy } from "./base";
import { FastAPITemplate } from "./fastapi";
import { NextAppTemplate } from "./next-app";

export class TemplateRegistry {
  private templates = new Map<string, TemplateStrategy>();

  constructor() {
    this.register(new NextAppTemplate());
    this.register(new FastAPITemplate());
    // this.register(new FullstackTemplate());
  }

  register(template: TemplateStrategy): void {
    this.templates.set(template.name, template);
  }

  get(name: string): TemplateStrategy | undefined {
    return this.templates.get(name);
  }

  list(): string[] {
    return Array.from(this.templates.keys());
  }

  async detectTemplate(cwd: string): Promise<string | null> {
    for (const [name, template] of this.templates) {
      if (await template.validate(cwd)) {
        return name;
      }
    }
    return null;
  }
}
