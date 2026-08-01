/* eslint-disable @typescript-eslint/consistent-type-assertions */

import type { Linter } from 'eslint';

import { allowsPromotion } from './common/severity.ts';
import type { MaxSeverityMap } from './types.ts';

/**
 * Promotes every `warn`-level rule in a config block to `error`, skipping rules whose `maxSeverity` ceiling sits
 * below `error`. Severities the author set explicitly are never lowered: the ceiling bounds the promotion, not the
 * config.
 */
export function convertWarnToError(config: Linter.Config, maxSeverity?: MaxSeverityMap): Linter.Config {
  if (!config.rules) return config;
  const ruleEntries = Object.entries(config.rules);
  const errorRuleEntries = ruleEntries.map(([ruleName, ruleValue]) => {
    if (!allowsPromotion(maxSeverity?.[ruleName])) {
      return [ruleName, ruleValue];
    }
    if (ruleValue === 'warn' || ruleValue === 1) {
      return [ruleName, 'error'];
    }
    if (Array.isArray(ruleValue)) {
      const [severity, ...options] = ruleValue;
      if (severity === 'warn' || severity === 1) {
        const resolvedOptions: unknown[] = options;
        return [ruleName, ['error', ...resolvedOptions]];
      }
    }
    return [ruleName, ruleValue];
  });
  return {
    ...config,
    rules: Object.fromEntries(errorRuleEntries) as typeof config.rules,
  };
}
