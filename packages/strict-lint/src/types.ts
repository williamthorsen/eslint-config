import type { Linter } from 'eslint';

export type MaxSeverityMap = Record<string, 'error' | 'warn'>;

export interface StrictLintConfig {
  maxSeverity?: MaxSeverityMap;
  /** Bound the upward search at this config's directory, so configs above it do not apply and are never imported. */
  shouldIgnoreAncestors?: boolean;
}

export interface StrictLintOptions {
  baseConfig?: Linter.Config[];
  maxSeverity?: MaxSeverityMap;
  patterns?: string[];
  ruleOverrides?: Record<string, Linter.RuleSeverity>;
}
