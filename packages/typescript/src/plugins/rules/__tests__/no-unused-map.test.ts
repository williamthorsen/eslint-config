import rule from '../no-unused-map.ts';
import { RuleTester } from './ruleTester.ts';

const ruleTester = new RuleTester();

ruleTester.run('no-unused-map', rule, {
  valid: [
    // Non-firing: result assigned to a variable
    'const doubled = [1, 2, 3].map((n) => n * 2);',
    // Non-firing: result returned
    'function double(xs: number[]) { return xs.map((n) => n * 2); }',
    // Non-firing: result passed as a call argument
    'console.log([1, 2, 3].map((n) => n * 2));',
    // Non-firing: a non-`map` method call is ignored
    '[1, 2, 3].forEach((n) => console.log(n));',
  ],
  invalid: [
    {
      // Firing: the mapped result is discarded
      code: '[1, 2, 3].map((n) => console.log(n));',
      errors: [{ messageId: 'unusedMap' }],
    },
  ],
});
