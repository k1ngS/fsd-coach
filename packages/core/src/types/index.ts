export type FSDLayer =
  | "app"
  | "processes"
  | "pages"
  | "widgets"
  | "features"
  | "entities"
  | "shared";

export type Segment = "ui" | "model" | "api" | "lib" | "config" | "types";

export type Template = "next-app" | "fastapi" | "fullstack";

export type NamingConvention = "kebab-case" | "camelCase" | "PascalCase";

export type Locale = "en" | "pt-BR";

export interface GeneratorOptions {
  name: string;
  segments?: Segment[];
  rootDir?: string;
  withTests?: boolean;
  dryRun?: boolean;
  cwd?: string;
}

export interface GeneratorResult {
  name: string;
  basePath: string;
  segments: Segment[];
  created: string[];
  skipped: string[];
  errors?: string[];
}

export interface FSDConfig {
  version?: string;
  template?: Template;
  defaultSegments?: {
    features?: Segment[];
    entities?: Segment[];
    widgets?: Segment[];
  };
  rootDir?: {
    features?: string;
    entities?: string;
    widgets?: string;
    pages?: string;
    processes?: string;
  };
  naming?: NamingConvention;
  lint?: {
    enforcePublicApi?: boolean;
    checkCircularDeps?: boolean;
    strictLayerImports?: boolean;
  };
  locale?: Locale;
  generators?: {
    includeTests?: boolean;
    includeStorybook?: boolean;
  };
}

export const CONFIG_VERSION = "1.0.0";

export type ViolationType =
  | "CROSS_LAYER_IMPORT"
  | "CROSS_FEATURE_IMPORT"
  | "MISSING_PUBLIC_API"
  | "DIRECT_SEGMENT_IMPORT"
  | "CIRCULAR_DEPENDENCY"
  | "INVALID_LAYER"
  | "SHARED_IMPORTS_LAYER";

export type ViolationSeverity = "error" | "warning" | "info";

export interface Violation {
  type: ViolationType;
  severity: ViolationSeverity;
  message: string;
  file: string;
  line?: number;
  column?: number;
  suggestion?: string;
  autoFixable?: boolean;
}

export interface AuditResult {
  passed: boolean;
  totalFiles: number;
  violations: Violation[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
  scannedAt: Date;
}

export interface AuditOptions {
  cwd?: string;
  strict?: boolean;
  autoFix?: boolean;
  ignore?: string[];
  layers?: FSDLayer[];
}

export interface ImportStatement {
  source: string;
  file: string;
  line: number;
  isRelative: boolean;
  layer?: FSDLayer;
  slice?: string;
  segment?: Segment;
}
