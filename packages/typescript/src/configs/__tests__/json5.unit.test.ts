import jsoncPlugin from 'eslint-plugin-jsonc';
import { describe, expect, it } from 'vitest';

import { json5Config } from '../json5.ts';

describe('the JSON5 config', () => {
  it('turns off every rule that the JSON recommended config enables and the JSON5 one omits', () => {
    const json5Rules = collectRuleIds(jsoncPlugin.configs['recommended-with-json5']);
    const jsonOnlyRuleIds = collectRuleIds(jsoncPlugin.configs['recommended-with-jsonc']).filter(
      (ruleId) => !json5Rules.includes(ruleId),
    );
    const offRuleIds = new Set(
      json5Config.flatMap((config) =>
        Object.entries(config.rules ?? {})
          .filter(([, entry]) => entry === 'off')
          .map(([ruleId]) => ruleId),
      ),
    );

    expect(jsonOnlyRuleIds.filter((ruleId) => !offRuleIds.has(ruleId))).toStrictEqual([]);
  });
});

// region | Helpers
function collectRuleIds(configs: ReadonlyArray<{ rules?: Record<string, unknown> }>): string[] {
  return configs.flatMap((config) => Object.keys(config.rules ?? {}));
}
// endregion | Helpers
