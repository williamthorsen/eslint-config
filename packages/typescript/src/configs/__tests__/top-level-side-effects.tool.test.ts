import { describe, expect, it } from 'vitest';

import { baseConfig } from '#src/baseConfig.ts';

import { lintFixture, typedParserSettings } from '../test-utils/lintFixture.ts';

const ruleId = 'unicorn/no-top-level-side-effects';

describe('unicorn/no-top-level-side-effects', () => {
  it.each([
    { fixture: 'side-effects/global-mutation.ts', isReported: true },
    { fixture: 'side-effects/unknown-call.ts', isReported: false },
  ])('reports a top-level side effect in $fixture: $isReported', async ({ fixture, isReported }) => {
    const results = await lintFixture([...baseConfig, typedParserSettings], fixture);

    const messages = results[0]?.messages ?? [];

    expect(messages.some((message) => message.ruleId === ruleId)).toBe(isReported);
  });
});
