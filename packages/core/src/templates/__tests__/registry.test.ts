import { describe, it, expect, beforeEach } from "vitest";
import { TemplateRegistry } from "../registry";
import { NextAppTemplate } from "../next-app/NextAppTemplate";

describe("TemplateRegistry", () => {
  let registry: TemplateRegistry;

  beforeEach(() => {
    registry = new TemplateRegistry();
  });

  it("should register a template", () => {
    const template = new NextAppTemplate();
    registry.register(template);

    expect(registry.has("next-app")).toBe(true);
    expect(registry.count()).toBe(1);
  });

  it("should retrieve registered template", () => {
    const template = new NextAppTemplate();
    registry.register(template);

    const retrieved = registry.get("next-app");

    expect(retrieved).toBe(template);
    expect(retrieved.metadata.name).toBe("next-app");
  });

  it("should throw error for non-existent template", () => {
    expect(() => registry.get("non-existent" as any)).toThrow(
      'Template "non-existent" not found'
    );
  });

  it("should list all templates", () => {
    const template = new NextAppTemplate();
    registry.register(template);

    const list = registry.list();

    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("next-app");
  });

  it("should unregister a template", () => {
    const template = new NextAppTemplate();
    registry.register(template);

    const result = registry.unregister("next-app");

    expect(result).toBe(true);
    expect(registry.has("next-app")).toBe(false);
  });
});
