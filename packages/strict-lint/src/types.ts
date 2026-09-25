import type { Linter } from 'eslint';

/**
 * Per-rule ceilings on how high strict-lint promotes a severity. A ceiling below `error` exempts its rule from
 * promotion; `undefined` imposes no ceiling, exactly as an absent key does. The value type is ESLint's own severity
 * type, so one map of bare severities serves as a flat-config `rules` value and as a ceiling map alike. Rule entries
 * with options are not ceilings.
 */
export type MaxSeverityMap = Record<string, Linter.RuleSeverity | undefined>;

export interface StrictLintConfig {
  maxSeverity?: MaxSeverityMap;
  /**
   * The configs that the ESLint config extends, passed as values rather than named as a package. A name resolves
   * through `exports` and can load a second instance of a module that the ESLint config already imported, against
   * which no comparison holds. When it is absent, strict-lint runs no repeated-rule check.
   */
  sharedConfigs?: Array<Linter.Config | Linter.Config[]>;
  /** Bounds the upward search at this config's directory, so configs above it do not apply and are never imported. */
  shouldIgnoreAncestors?: boolean;
}

export interface StrictLintOptions {
  baseConfig?: Linter.Config[];
  maxSeverity?: MaxSeverityMap;
  patterns?: string[];
  ruleOverrides?: Record<string, Linter.RuleSeverity>;
}
