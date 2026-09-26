import type { ESLint } from 'eslint';
import type { Config } from 'eslint/config';
import { describe, expect, it } from 'vitest';

import { baseConfig } from '../../baseConfig.ts';
import { lintFixture, typedParserSettings } from '../test-utils/lintFixture.ts';

// The resolver alias that the config provides makes the extension rule read `q.ts` for a specifier written
// `./q.js`. Without it the rule reads the written extension, finds `js` where it expects `js`, and passes.

describe('the extension rule that the import config sets', () => {
  it('reports a `.js` specifier that names a TypeScript file', async () => {
    const results = await lintFixture([...baseConfig, typedParserSettings], 'cycle-jsvalue-a.ts');

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(listExtensionMessages(results)).toStrictEqual(['Missing file extension "ts" for "./cycle-jsvalue-b.js"']);
  });

  // `js-target.ts` is next to `js-target.js`, so the specifier resolves to whichever the alias tries
  // first: the TypeScript sibling wherever the alias applies, the JavaScript one where it does not. Without
  // that sibling the case passes whether or not the alias is scoped, guarding nothing.
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
    expect(listExtensionMessages(results)).toStrictEqual(['Missing file extension "ts" for "./js-target"']);
  });

  it('reports nothing for a package subpath imported from inside that package', async () => {
    const results = await lintFixture([...baseConfig, typedParserSettings], 'self-reference/importer.ts');

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(listExtensionMessages(results)).toStrictEqual(['Missing file extension "ts" for "./sibling"']);
  });

  // The override exempts an unresolvable specifier as readily as a resolved one, so the case above passes
  // whether or not the resolver consults the fixture's `exports` map. Composing the options that the override
  // replaces proves that the fixture resolves, and that the override alone silences it.
  // The fixture package is unscoped: `ignorePackages` exempts a scoped subpath through the `isScoped` arm of
  // `isPackage`. A scoped name would silence the subpath here too and leave the case above guarding nothing.
  it('reports that subpath when the path-group override is absent', async () => {
    const withoutOverride = {
      rules: {
        'import-x/extensions': [
          'error',
          'ignorePackages',
          { js: 'always', jsx: 'always', ts: 'always', tsx: 'always' },
        ],
      },
    } satisfies Config;

    const results = await lintFixture(
      [...baseConfig, typedParserSettings, withoutOverride],
      'self-reference/importer.ts',
    );

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(listExtensionMessages(results)).toStrictEqual([
      'Missing file extension "ts" for "fixtures-self-reference/target"',
      'Missing file extension "ts" for "./sibling"',
    ]);
  });

  // ESLint merges `settings` deeply, which lets a consumer add a resolver key without displacing the
  // config's own `extensionAlias`. The README documents the override on that basis.
  it('keeps the alias when a later config adds a resolver key of its own', async () => {
    const override = { settings: { 'import-x/resolver': { node: { conditionNames: ['import'] } } } };

    const results = await lintFixture([...baseConfig, typedParserSettings, override], 'cycle-jsvalue-a.ts');

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(listExtensionMessages(results)).toStrictEqual(['Missing file extension "ts" for "./cycle-jsvalue-b.js"']);
  });
});

// region | Helpers

/** Collects the messages that `import-x/extensions` reported against the first linted file. */
function listExtensionMessages(results: readonly ESLint.LintResult[]): string[] {
  const messages = results[0]?.messages ?? [];

  return messages.filter((message) => message.ruleId === 'import-x/extensions').map((message) => message.message);
}

// endregion | Helpers
