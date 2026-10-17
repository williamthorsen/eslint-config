import { describe, expect, it } from 'vitest';

import { baseConfig } from '#src/baseConfig.ts';

import { lintFixture, typedParserSettings } from '../test-utils/lintFixture.ts';

const ruleId = 'unicorn/no-top-level-side-effects';

describe('unicorn/no-top-level-side-effects', () => {
  it.each([
    { fixture: 'side-effects/module.ts', isReported: true },
    { fixture: 'side-effects/tool.config.ts', isReported: false },
    { fixture: 'side-effects/.toolrc.ts', isReported: false },
    { fixture: 'side-effects/sanity.cli.ts', isReported: false },
    { fixture: 'side-effects/kit.ts', isReported: false },
    { fixture: 'side-effects/.readyup/kits/default.ts', isReported: false },
    { fixture: 'side-effects/.readyup/kits/checks/build-checks.ts', isReported: true },
    { fixture: 'side-effects/wxt/background.ts', isReported: false },
    { fixture: 'side-effects/wxt/imports.content.ts', isReported: false },
    { fixture: 'side-effects/wxt/side-effect.content.ts', isReported: true },
  ])('reports a default-exported call in $fixture: $isReported', async ({ fixture, isReported }) => {
    const results = await lintFixture([...baseConfig, typedParserSettings], fixture);

    // A fixture that failed to parse reports no rule at all, which would satisfy the exempt cases.
    expect(results[0]?.fatalErrorCount).toBe(0);

    const messages = results[0]?.messages ?? [];

    expect(messages.some((message) => message.ruleId === ruleId)).toBe(isReported);
  });
});
