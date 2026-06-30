import type { ESLint, Linter } from 'eslint';

type ESLintPluginWithRules = Omit<ESLint.Plugin, 'configs'> & {
  configs: Record<string, { rules: Record<string, Linter.RuleEntry> }>;
};

/**
 * Type guard to ensure that a plugin is a valid ESLint plugin.
 * This guards against type inconsistencies during the migration to the flat ESLint config.
 */
export function getSafeLinterPlugin<T>(plugin: T): Omit<T, 'configs'> & ESLintPluginWithRules {
  if (!isLinterPlugin(plugin)) {
    throw new Error('Plugin is not a valid ESLint plugin');
  }

  return plugin;
}

function isLinterPlugin(plugin: unknown): plugin is ESLintPluginWithRules {
  return !!plugin && typeof plugin === 'object' && 'configs' in plugin;
}
