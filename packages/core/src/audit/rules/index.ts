/**
 * Audit rules registry
 */

import { AuditRule } from "../../types/audit";
import { CircularDependenciesRule } from "./circularDependencies";
import { CrossFeatureImportsRule } from "./crossFeatureImportsRule";
import { LayerImportsRule } from "./layerImportsRule";
import { PublicApiRule } from "./publicApiRule";

export class RuleRegistry {
  private rules = new Map<string, AuditRule>();

  constructor() {
    this.registerDefaultRules();
  }

  private registerDefaultRules(): void {
    this.register(new CircularDependenciesRule());
    this.register(new LayerImportsRule());
    this.register(new PublicApiRule());
    this.register(new CrossFeatureImportsRule());
  }

  register(rule: AuditRule): void {
    this.rules.set(rule.name, rule);
  }

  get(name: string): AuditRule | undefined {
    return this.rules.get(name);
  }

  getEnabled(): AuditRule[] {
    return Array.from(this.rules.values()).filter((rule) => rule.enabled);
  }

  list(): AuditRule[] {
    return Array.from(this.rules.values());
  }

  disable(name: string): void {
    const rule = this.rules.get(name);
    if (rule) {
      rule.enabled = false;
    }
  }

  enable(name: string): void {
    const rule = this.rules.get(name);
    if (rule) {
      rule.enabled = true;
    }
  }
}

export const ruleRegistry = new RuleRegistry();

// Re-export rules
export { CircularDependenciesRule } from "./circularDependencies";
export { PublicApiRule } from "./publicApiRule";
export { LayerImportsRule } from "./layerImportsRule";
export { CrossFeatureImportsRule } from "./crossFeatureImportsRule";
