import type { Linter } from 'eslint';

export function convertWarnToError(config: Linter.Config): Linter.Config {
  if (!config.rules) return config;
  const ruleEntries = Object.entries(config.rules);
  const errorRuleEntries = ruleEntries.map(([ruleName, ruleValue]) => {
    if (ruleValue === 'warn') {
      return [ruleName, 'error'];
    }
    if (Array.isArray(ruleValue) && ruleValue[0] === 'warn') {
      return [ruleName, ['error', ...ruleValue.slice(1)]];
    }
    return [ruleName, ruleValue];
  });
  return {
    ...config,
    rules: Object.fromEntries(errorRuleEntries),
  };
}
