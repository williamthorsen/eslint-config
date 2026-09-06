import type { ESLint } from 'eslint';
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
});

// region | Helpers

/** Collects the messages `import-x/extensions` reported against the first linted file. */
function listExtensionMessages(results: readonly ESLint.LintResult[]): string[] {
  const messages = results[0]?.messages ?? [];

  return messages.filter((message) => message.ruleId === 'import-x/extensions').map((message) => message.message);
}

// endregion | Helpers
