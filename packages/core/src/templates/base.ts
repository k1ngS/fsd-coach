import { FSDConfig } from "../types";

export interface TemplateStrategy {
  name: string;
  generate(context: TemplateContext): Promise<TemplateResult>;
  validate(cwd: string): Promise<boolean>;
}

export interface TemplateContext {
  cwd: string;
  dryRun: boolean;
  config?: Partial<FSDConfig>;
}

export interface TemplateResult {
  created: string[];
  skipped: string[];
  postInstallInstructions?: string;
}
