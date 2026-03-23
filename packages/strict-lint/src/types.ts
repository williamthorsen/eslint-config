import type { Linter } from 'eslint';

export type MaxSeverityMap = Record<string, 'error' | 'warn'>;

export interface StrictLintConfig {
  maxSeverity?: MaxSeverityMap;
}

export interface StrictLintOptions {
  baseConfig?: Linter.Config[];
  maxSeverity?: MaxSeverityMap;
  patterns?: string[];
  ruleOverrides?: Record<string, Linter.RuleSeverity>;
}
