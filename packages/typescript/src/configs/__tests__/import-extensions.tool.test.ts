import type { ESLint } from 'eslint';
import type { Config } from 'eslint/config';
import { describe, expect, it } from 'vitest';

import { baseConfig } from '../../baseConfig.ts';
import { lintFixture, typedParserSettings } from '../test-utils/lintFixture.ts';

// The resolver alias the config ships is what makes the extension rule read `q.ts` for a specifier written
// `./q.js`. Without it the rule reads the written extension, finds `js` where it expects `js`, and passes.

describe('the extension rule the import config sets', () => {
  it('reports a `.js` specifier that names a TypeScript file', async () => {
    const results = await lintFixture([...baseConfig, typedParserSettings], 'cycle-jsvalue-a.ts');

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(listExtensionMessages(results)).toStrictEqual(['Missing file extension "ts" for "./cycle-jsvalue-b.js"']);
  });

  // `js-target.ts` sits beside `js-target.js`, so the specifier resolves to whichever the alias reaches
  // first: the TypeScript sibling wherever the alias applies, the JavaScript one where it does not. Without
  // that sibling the case passes whether or not the alias is scoped, guarding nothing.
  it('reports nothing for a `.js` specifier that names a JavaScript file', async () => {
    const results = await lintFixture([...baseConfig, typedParserSettings], 'js-importer.js');

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(listExtensionMessages(results)).toStrictEqual([]);
  });

  // `js-target.ts` and `js-target.js` both sit beside the fixture, so the message names whichever the
  // resolver's `extensions` list reaches first. The list is ordered by resolution priority, and the
  // alphabetical ordering it departs from would name `js` here.
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
  // whether or not the fixture's `exports` map is reached. Composing the options the override replaces is
  // what proves the fixture resolves, and that the override is what silences it.
  it('reports that subpath where the path-group override is absent', async () => {
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

  // ESLint merges `settings` deeply, which is what lets a consumer add a resolver key without displacing
  // the shipped `extensionAlias`. The README documents the override on that basis.
  it('keeps the alias where a later config adds a resolver key of its own', async () => {
    const override = { settings: { 'import-x/resolver': { node: { conditionNames: ['import'] } } } };

    const results = await lintFixture([...baseConfig, typedParserSettings, override], 'cycle-jsvalue-a.ts');

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(listExtensionMessages(results)).toStrictEqual(['Missing file extension "ts" for "./cycle-jsvalue-b.js"']);
  });
});

// region | Helpers

/** Collects the messages `import-x/extensions` reported against the first linted file. */
function listExtensionMessages(results: readonly ESLint.LintResult[]): string[] {
  const messages = results[0]?.messages ?? [];

  return messages.filter((message) => message.ruleId === 'import-x/extensions').map((message) => message.message);
}

// endregion | Helpers
