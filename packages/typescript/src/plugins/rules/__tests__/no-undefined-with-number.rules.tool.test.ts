import rule from '../no-undefined-with-number.ts';
import { createTypedRuleTester } from '../test-utils/ruleTester.ts';

// This rule is type-aware, so it needs the tester backed by a TS program.
const ruleTester = createTypedRuleTester();

ruleTester.run('no-undefined-with-number', rule, {
  valid: [
    // Non-firing: the argument cannot be undefined
    'declare const value: number; Number(value);',
    // Non-firing: a string argument
    "Number('42');",
    // Non-firing: no argument at all
    'Number();',
  ],
  invalid: [
    {
      // Firing: a possibly-undefined argument
      code: 'declare const value: number | undefined; Number(value);',
      errors: [{ messageId: 'undefinedWithNumber' }],
    },
  ],
});
