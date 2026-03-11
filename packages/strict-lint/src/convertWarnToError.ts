/* eslint-disable @typescript-eslint/consistent-type-assertions */

import type { Linter } from 'eslint';

import type { MaxSeverityMap } from './types.ts';

export function convertWarnToError(config: Linter.Config, maxSeverity?: MaxSeverityMap): Linter.Config {
  if (!config.rules) return config;
  const ruleEntries = Object.entries(config.rules);
  const errorRuleEntries = ruleEntries.map(([ruleName, ruleValue]) => {
    if (maxSeverity?.[ruleName] === 'warn') {
      return [ruleName, ruleValue];
    }
    if (ruleValue === 'warn') {
      return [ruleName, 'error'];
    }
    if (Array.isArray(ruleValue)) {
      const [severity, ...options] = ruleValue;
      if (severity === 'warn' || severity === 2) {
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
