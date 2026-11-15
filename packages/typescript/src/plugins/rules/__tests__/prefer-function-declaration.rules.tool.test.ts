import { preferFunctionDeclarationRule } from '../prefer-function-declaration.ts';
import { RuleTester } from '../test-utils/ruleTester.ts';

const ruleTester = new RuleTester();

ruleTester.run('prefer-function-declaration', preferFunctionDeclarationRule, {
  valid: [
    // Non-firing: a typed function expression is exempt
    'const add: (a: number, b: number) => number = (a, b) => a + b;',
    // Non-firing: a function declaration is not a variable initializer
    'function add(a: number, b: number) { return a + b; }',
    // Non-firing: an arrow that uses `this` cannot become a declaration
    'const getValue = () => this.value;',
    // Non-firing: a nested arrow inherits the outer arrow's `this`
    'const getValue = () => () => this.value;',
    // Non-firing: a `this` in a nested class field initializer still exempts the arrow
    'const makeClass = () => class { value = this; };',
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
    {
      // Firing: a `this` in the enclosing method does not bind to the arrow
      code: 'class A { m() { this.x; const f = () => 1; } }',
      errors: [{ messageId: 'preferDeclaration' }],
    },
    {
      // Firing: a `this` inside a nested function expression binds to that function
      code: 'const f = () => function () { return this; };',
      errors: [{ messageId: 'preferDeclaration' }],
    },
    {
      // Firing: a `this` inside a nested function declaration binds to that function
      code: 'const f = () => { function g() { return this; } return g; };',
      errors: [{ messageId: 'preferDeclaration' }],
    },
  ],
});
