import type { ESLint, Linter } from 'eslint';

type ESLintPluginWithRules = Omit<ESLint.Plugin, 'configs'> & {
  configs: Record<string, { rules: Record<string, Linter.RuleEntry> }>;
};

/** Returns the plugin typed as one whose `configs` contain rules, throwing when it has no `configs`. */
export function getSafeLinterPlugin<T>(plugin: T): Omit<T, 'configs'> & ESLintPluginWithRules {
  if (!isLinterPlugin(plugin)) {
    throw new Error('Plugin is not a valid ESLint plugin');
  }

  return plugin;
}

/** Reports whether a value is an object with a `configs` key. */
function isLinterPlugin(plugin: unknown): plugin is ESLintPluginWithRules {
  return !!plugin && typeof plugin === 'object' && 'configs' in plugin;
}
