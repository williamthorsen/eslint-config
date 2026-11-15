import type { Linter } from 'eslint';

/**
 * Returns the rules of a plugin's named config, throwing when the config or its rules are not shaped as ESLint
 * expects.
 */
export function readConfigRules(plugin: unknown, configName: string): Linter.RulesRecord {
  const configs = isPlainObject(plugin) ? plugin['configs'] : undefined;
  const config = isPlainObject(configs) ? configs[configName] : undefined;
  if (!isPlainObject(config)) {
    throw new Error(`Plugin config "${configName}" is missing or is not an object`);
  }

  const rules = config['rules'];
  if (!isRulesRecord(rules)) {
    throw new Error(`Plugin config "${configName}" does not contain a rules object`);
  }

  return rules;
}

// region | Helpers
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isRuleEntry(value: unknown): value is Linter.RuleEntry {
  const severity: unknown = Array.isArray(value) ? value[0] : value;
  return (
    severity === 0 ||
    severity === 1 ||
    severity === 2 ||
    severity === 'off' ||
    severity === 'warn' ||
    severity === 'error'
  );
}

function isRulesRecord(value: unknown): value is Linter.RulesRecord {
  return isPlainObject(value) && Object.values(value).every(isRuleEntry);
}
// endregion | Helpers
