import type { Config } from 'eslint/config';
import { builtinRules } from 'eslint/use-at-your-own-risk';
import { describe, expect, it } from 'vitest';

import { baseConfig } from '../baseConfig.ts';
import { createConfig } from '../configs/createConfig.ts';

// ESLint checks that a configured rule exists only when its severity is above `off`, and only for blocks
// whose `files` glob matches the file being linted. An override that switches a rule off therefore goes
// inert without a diagnostic once a plugin renames the rule it names.

type ConfigPlugin = NonNullable<Config['plugins']>[string];

const factories = Object.entries(createConfig);

describe('rule ids configured by the base config', () => {
  it('name rules that exist', () => {
    expect(findUnresolvedRuleIds(baseConfig)).toStrictEqual([]);
  });
});

describe('rule ids configured by the opt-in factories', () => {
  it.each(factories)('%s: name rules that exist', async (_name, load) => {
    expect(findUnresolvedRuleIds(await load())).toStrictEqual([]);
  });
});

// region | Helpers

/** Collects every rule id the blocks configure that no registered plugin and no core rule defines. */
function findUnresolvedRuleIds(blocks: readonly Config[]): string[] {
  const plugins = collectPlugins(blocks);
  const ruleIds = new Set(blocks.flatMap((block) => Object.keys(block.rules ?? {})));

  return [...ruleIds].filter((ruleId) => !resolvesToRule(ruleId, plugins));
}

/** Merges the blocks' plugin registrations; a block's rules may name a plugin that a sibling block registers. */
function collectPlugins(blocks: readonly Config[]): Map<string, ConfigPlugin> {
  const plugins = new Map<string, ConfigPlugin>();

  for (const block of blocks) {
    const registrations = Object.entries(block.plugins ?? {});

    for (const [name, plugin] of registrations) {
      plugins.set(name, plugin);
    }
  }

  return plugins;
}

/**
 * Splits a rule id into the plugin expected to define it and the rule's own name, matching how ESLint
 * resolves one: a scoped id splits at its last `/`, any other at its first. Both boundaries carry weight --
 * `@next/next/no-img-element` names a scoped plugin, and `n/no-unsupported-features/es-syntax` a rule whose
 * own name contains a `/`. A core rule has no plugin.
 */
function parseRuleId(ruleId: string): { pluginName: string | undefined; ruleName: string } {
  if (!ruleId.includes('/')) {
    return { pluginName: undefined, ruleName: ruleId };
  }

  const boundary = ruleId.startsWith('@') ? ruleId.lastIndexOf('/') : ruleId.indexOf('/');

  return { pluginName: ruleId.slice(0, boundary), ruleName: ruleId.slice(boundary + 1) };
}

/** Reports whether a rule id names a rule that one of the registered plugins, or ESLint itself, defines. */
function resolvesToRule(ruleId: string, plugins: Map<string, ConfigPlugin>): boolean {
  const { pluginName, ruleName } = parseRuleId(ruleId);

  if (pluginName === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the only runtime registry of core rules that lists the deprecated ones this config still sets
    return builtinRules.has(ruleName);
  }

  return plugins.get(pluginName)?.rules?.[ruleName] !== undefined;
}

// endregion | Helpers
