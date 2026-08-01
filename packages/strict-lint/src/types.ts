import type { Linter } from 'eslint';

/**
 * Per-rule ceilings on how high strict-lint promotes a severity. A ceiling below `error` exempts its rule from
 * promotion; `undefined` imposes no ceiling, exactly as an absent key does. The value type is ESLint's own severity
 * type, so any map valid as a flat-config `rules` value is valid here too.
 */
export type MaxSeverityMap = Record<string, Linter.RuleSeverity | undefined>;

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
