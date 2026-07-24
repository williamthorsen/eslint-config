import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import { ensurePluginRules } from '../../../utils/ensurePluginRules.ts';
import rule from '../no-unused-map.ts';
import { RuleTester } from './ruleTester.ts';

// This rule's receiver guard is type-aware (it consults the TS type checker), so the tester needs a TS program.
// `projectService` with `allowDefaultProject` type-checks the inline code against the fixtures `tsconfig.json`.
const typedRuleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ['*.ts*'],
      },
      tsconfigRootDir: import.meta.dirname + '/fixtures',
    },
  },
});

typedRuleTester.run('no-unused-map', rule, {
  valid: [
    // Non-firing: result assigned to a variable
    'const doubled = [1, 2, 3].map((n) => n * 2);',
    // Non-firing: result returned
    'function double(xs: number[]) { return xs.map((n) => n * 2); }',
    // Non-firing: result passed as a call argument
    'console.log([1, 2, 3].map((n) => n * 2));',
    // Non-firing: result passed as a constructor argument
    'new Set([1, 2, 3].map((n) => n * 2));',
    // Non-firing: result passed as a constructor argument inside a `for...of` head
    'declare const hits: { path: string }[]; for (const path of new Set(hits.map((hit) => hit.path))) { console.log(path); }',
    // Non-firing: result spread into an array
    'const combined = [0, ...[1, 2, 3].map((n) => n * 2)];',
    // Non-firing: result interpolated into a template literal
    'const rendered = `${[1, 2, 3].map((n) => n * 2)}`;',
    // Non-firing: result implicitly returned from an arrow function
    'const double = (xs: number[]) => xs.map((n) => n * 2);',
    // Non-firing: `void` marks an explicit discard
    'void [1, 2, 3].map((n) => n * 2);',
    // Non-firing: a non-`map` method call is ignored
    '[1, 2, 3].forEach((n) => console.log(n));',
    // Non-firing: a side-effecting `.map` on a non-array receiver
    'declare const builder: { map(callback: (n: number) => number): void }; builder.map((n) => n * 2);',
    // Non-firing: an `any`-typed receiver suppresses the report
    'declare const items: any; items.map((n: number) => n * 2);',
    // Non-firing: a union receiver reports only when every constituent is array-like
    'interface Mapper { map(callback: (n: number) => number): void } declare const items: number[] | Mapper; items.map((n: number) => n * 2);',
  ],
  invalid: [
    {
      // Firing: the mapped result is discarded
      code: '[1, 2, 3].map((n) => console.log(n));',
      errors: [{ messageId: 'unusedMap' }],
    },
    {
      // Firing: discarded inside a nested callback body
      code: '[[1], [2]].forEach((xs) => { xs.map((n) => console.log(n)); });',
      errors: [{ messageId: 'unusedMap' }],
    },
    {
      // Firing: discarded behind optional chaining
      code: 'declare const items: number[] | undefined; items?.map((n) => console.log(n));',
      errors: [{ messageId: 'unusedMap' }],
    },
    {
      // Firing: a readonly-array receiver is still an array
      code: 'declare const items: readonly number[]; items.map((n) => console.log(n));',
      errors: [{ messageId: 'unusedMap' }],
    },
  ],
});

// Without `projectService` the tester provides no TS program, so this exercises the syntactic fallback:
// The rule must still report statement-position calls, not crash or silently disable.
const untypedRuleTester = new RuleTester();

untypedRuleTester.run('no-unused-map (syntactic fallback)', rule, {
  valid: [
    // Non-firing: value-consuming position needs no type information
    'new Set([1, 2, 3].map((n) => n * 2));',
    // Non-firing: computed member access is not a `map` call
    'declare const record: { [key: string]: (callback: () => void) => void }; declare const map: string; record[map](() => {});',
  ],
  invalid: [
    {
      // Firing: statement position reports even without type information
      code: '[1, 2, 3].map((n) => console.log(n));',
      errors: [{ messageId: 'unusedMap' }],
    },
    {
      // Firing: the receiver guard needs a program, so the fallback reports a receiver
      // the typed suite accepts; this case fails if the suite ever gains type information
      code: 'declare const builder: { map(callback: (n: number) => number): void }; builder.map((n) => n * 2);',
      errors: [{ messageId: 'unusedMap' }],
    },
  ],
});

// `Linter` runs its default parser (espree), which supplies no parser services at all,
// which is a case that a TypeScript-aware tester cannot produce.
describe('no-unused-map under a non-TypeScript parser', () => {
  it('applies the syntactic check instead of crashing', () => {
    const linter = new Linter();
    const messages = linter.verify('[1, 2, 3].map((n) => console.log(n));', {
      plugins: { 'sky-pilot': { rules: ensurePluginRules({ 'no-unused-map': rule }) } },
      rules: { 'sky-pilot/no-unused-map': 'error' },
    });

    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageId).toBe('unusedMap');
  });
});
