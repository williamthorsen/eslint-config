import rule from '../prefer-function-declaration.ts';
import { RuleTester } from './ruleTester.ts';

const ruleTester = new RuleTester();

ruleTester.run('prefer-function-declaration', rule, {
  valid: [
    // Non-firing: a typed function expression is exempt
    'const add: (a: number, b: number) => number = (a, b) => a + b;',
    // Non-firing: a function declaration is not a variable initializer
    'function add(a: number, b: number) { return a + b; }',
    // Non-firing: an arrow that uses `this` cannot become a declaration
    'const getValue = () => this.value;',
  ],
  invalid: [
    {
      // Firing: an untyped arrow-function initializer
      code: 'const add = (a: number, b: number) => a + b;',
      errors: [{ messageId: 'preferDeclaration' }],
    },
    {
      // Firing: an untyped function-expression initializer
      code: 'const add = function (a: number, b: number) { return a + b; };',
      errors: [{ messageId: 'preferDeclaration' }],
    },
  ],
});
