/**
 * Extended audit types for rule system
 */

import { Violation, ImportStatement } from "./index";

export interface DependencyGraph {
  nodes: Set<string>;
  edges: Map<string, Set<string>>;
}

export interface Cycle {
  nodes: string[];
  edges: Array<[string, string]>;
}

export interface AuditContext {
  projectRoot: string;
  imports: ImportStatement[];
  dependencyGraph: DependencyGraph;
  config: AuditConfig;
}

export interface AuditConfig {
  rules: {
    [ruleName: string]: {
      enabled: boolean;
      severity?: "error" | "warning" | "info";
      options?: Record<string, any>;
    };
  };
  ignore?: string[];
  autoFix?: boolean;
}

export interface AuditViolation extends Violation {
  rule?: string;
  fixes?: AutoFix[];
}

export interface AutoFix {
  description: string;
  changes: FileChange[];
}

export interface FileChange {
  file: string;
  type: "replace" | "insert" | "delete";
  oldText?: string;
  newText?: string;
  line?: number;
  column?: number;
}

export interface AuditRule {
  name: string;
  description: string;
  severity: "error" | "warning" | "info";
  enabled: boolean;
  category?: "architecture" | "performance" | "maintainability" | "security";
  validate(context: AuditContext): AuditViolation[] | Promise<AuditViolation[]>;
  fix?(violation: AuditViolation, context: AuditContext): AutoFix | null;
}

export interface AuditMetrics {
  // Complexity metrics
  cyclomaticComplexity: number;
  dependencyCount: number;
  circularDependencyCount: number;
  layerViolations: number;

  // Size metrics
  totalFiles: number;
  totalLines: number;
  avgLinesPerFile: number;

  // Quality metrics
  publicApiCoverage: number; // % of slices with index.ts
  testCoverage?: number;

  // Maintainability
  maintainabilityIndex: number; // 0-100
  technicalDebt: {
    hours: number;
    issues: number;
  };

  // Timestamp
  measuredAt: Date;
}
