import type { ESLint } from 'eslint';
import type { Config } from 'eslint/config';
import { describe, expect, it } from 'vitest';

import { baseConfig } from '#src/baseConfig.ts';

import { lintFixture, typedParserSettings } from '../test-utils/lintFixture.ts';

const extensionRuleIds: ReadonlySet<string> = new Set(['import-x/extensions', 'sky-pilot/no-js-extension-for-ts']);

// `import-x/extensions` reports a missing extension, and `sky-pilot/no-js-extension-for-ts` reports a JavaScript
// extension naming a TypeScript source. Each case asserts both rules' messages, so a specifier reported by the wrong
// rule, or by both, fails it.

describe('the extension rules that the shipped config sets', () => {
  it('reports a `.js` specifier that names a TypeScript file', async () => {
    const results = await lintFixture([...baseConfig, typedParserSettings], 'cycle-jsvalue-a.ts');

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(listExtensionMessages(results)).toStrictEqual([
      'sky-pilot/no-js-extension-for-ts: Expected file extension "ts" for "./cycle-jsvalue-b.js"',
    ]);
  });

  // `js-target.ts` is next to `js-target.js`, and TypeScript resolves the specifier to the TypeScript sibling, so the
  // case fails if `sky-pilot/no-js-extension-for-ts` reaches a JavaScript file with type information.
  it('reports nothing for a `.js` specifier that names a JavaScript file', async () => {
    const results = await lintFixture([...baseConfig, typedParserSettings], 'js-importer.js');

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(listExtensionMessages(results)).toStrictEqual([]);
  });

  // `js-target.ts` and `js-target.js` are both next to the fixture. The message names whichever comes first
  // in the resolver's `extensions` list. The list is ordered by resolution priority, and the alphabetical
  // ordering from which it departs would name `js` here.
  it('resolves an extensionless specifier to the TypeScript sibling', async () => {
    const results = await lintFixture([...baseConfig, typedParserSettings], 'extensionless-importer.ts');

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(listExtensionMessages(results)).toStrictEqual([
      'import-x/extensions: Missing file extension "ts" for "./js-target"',
    ]);
  });

  it('reports nothing for a package subpath imported from inside that package', async () => {
    const results = await lintFixture([...baseConfig, typedParserSettings], 'self-reference/importer.ts');

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(listExtensionMessages(results)).toStrictEqual([
      'import-x/extensions: Missing file extension "ts" for "./sibling"',
    ]);
  });

  // The override exempts an unresolvable specifier as readily as a resolved one, so the case above passes
  // whether or not the resolver consults the fixture's `exports` map. Composing the options without the override
  // proves that the fixture resolves, and that the override alone silences it. The extension map names only the
  // TypeScript extensions: Under a map that also requires `js`, the plugin infers an extensionless specifier's
  // extension through both and reports that it cannot be determined.
  // The fixture package is unscoped: `ignorePackages` exempts a scoped subpath through the `isScoped` arm of
  // `isPackage`. A scoped name would silence the subpath here too and leave the case above guarding nothing.
  it('reports that subpath when the path-group override is absent', async () => {
    const withoutOverride = {
      rules: {
        'import-x/extensions': ['error', 'ignorePackages', { ts: 'always', tsx: 'always' }],
      },
    } satisfies Config;

    const results = await lintFixture(
      [...baseConfig, typedParserSettings, withoutOverride],
      'self-reference/importer.ts',
    );

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(listExtensionMessages(results)).toStrictEqual([
      'import-x/extensions: Missing file extension "ts" for "fixtures-self-reference/target"',
      'import-x/extensions: Missing file extension "ts" for "./sibling"',
    ]);
  });

  // `#target` is an exact mapping to `./src/target.ts`, so its specifier cannot carry an extension: `#target.ts`
  // resolves to nothing.
  it('reports a multi-segment `#` import that omits its extension, and no other `#` import', async () => {
    const results = await lintFixture([...baseConfig, typedParserSettings], 'subpath-imports/src/importer.ts');

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(listExtensionMessages(results)).toStrictEqual([
      'import-x/extensions: Missing file extension "ts" for "#src/target"',
    ]);
  });

  // The `imports` pattern maps `#src/*` to `./src/*`, through which TypeScript substitutes `target.ts` for
  // `target.js`.
  it('reports a multi-segment `#` import written with `.js` that names a TypeScript file', async () => {
    const results = await lintFixture([...baseConfig, typedParserSettings], 'subpath-imports/src/js-importer.ts');

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(listExtensionMessages(results)).toStrictEqual([
      'sky-pilot/no-js-extension-for-ts: Expected file extension "ts" for "#src/target.js"',
    ]);
  });
});

// region | Helpers

/** Collects the messages that either extension rule reported against the first linted file, each led by its rule id. */
function listExtensionMessages(results: readonly ESLint.LintResult[]): string[] {
  const messages = results[0]?.messages ?? [];

  return messages
    .filter((message) => message.ruleId !== null && extensionRuleIds.has(message.ruleId))
    .map((message) => `${message.ruleId}: ${message.message}`);
}

// endregion | Helpers
