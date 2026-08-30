import type { InvalidTestCase } from '@typescript-eslint/rule-tester';

import rule from '../no-split-imports.ts';
import { RuleTester } from '../test-utils/ruleTester.ts';

type MessageId = 'splitImports';

const ruleTester = new RuleTester();

ruleTester.run('no-split-imports', rule, {
  valid: [
    // Non-firing: one statement per module, in every shape
    "import { v } from 'm';",
    "import type { T } from 'm';",
    "import d, { type T, v } from 'm';",
    "import { v } from 'm';\nimport { w } from 'n';",
    // Non-firing: a namespace import cannot share a statement with named specifiers
    ...bothOrders("import * as ns from 'm';", "import type { T } from 'm';"),
    ...bothOrders("import * as a from 'm';", "import * as b from 'm';"),
    // Non-firing: a side-effect import stays a statement of its own, so the module keeps loading at runtime
    ...bothOrders("import 'm';", "import type { T } from 'm';"),
    ...bothOrders("import 'm';", "import { v } from 'm';"),
    ...bothOrders("import {} from 'm';", "import { v } from 'm';"),
    // Non-firing: a type-only default cannot join named bindings, and joining a value statement would make it a value
    ...bothOrders("import type d from 'm';", "import type { T } from 'm';"),
    ...bothOrders("import type d from 'm';", "import { v } from 'm';"),
    // Non-firing: two defaults cannot share a statement
    ...bothOrders("import a from 'm';", "import b, { v } from 'm';"),
    // Non-firing: import attributes are left where they are
    ...bothOrders("import a from './x.json' with { type: 'json' };", "import { b } from './x.json';"),
  ],
  invalid: [
    // Firing: a value statement and a type statement merge with `type` moved onto the specifier (row A)
    ...merges("import { v } from 'm';", "import type { T } from 'm';", [
      "import { v, type T } from 'm';",
      "import { type T, v } from 'm';",
    ]),
    // Firing: a default import takes the type specifier as named bindings (row B)
    ...merges("import d from 'm';", "import type { T } from 'm';", [
      "import d, { type T } from 'm';",
      "import d, { type T } from 'm';",
    ]),
    // Firing: a default with named bindings takes the type specifier too (row H)
    ...merges("import d, { v } from 'm';", "import type { T } from 'm';", [
      "import d, { v, type T } from 'm';",
      "import d, { type T, v } from 'm';",
    ]),
    // Firing: an inline type specifier merges as it is
    ...merges("import { v } from 'm';", "import { type T } from 'm';", [
      "import { v, type T } from 'm';",
      "import { type T, v } from 'm';",
    ]),
    // Firing: a top-level type statement joining a mixed statement moves `type` onto its specifiers
    ...merges("import type { T } from 'm';", "import { type U, v } from 'm';", [
      "import { type T, type U, v } from 'm';",
      "import { type U, v, type T } from 'm';",
    ]),
    // Firing: two type statements merge into one type statement
    ...merges("import type { T } from 'm';", "import type { U } from 'm';", [
      "import type { T, U } from 'm';",
      "import type { U, T } from 'm';",
    ]),
    // Firing: two inline-only type statements merge into a top-level type statement
    ...merges("import { type T } from 'm';", "import { type U } from 'm';", [
      "import type { T, U } from 'm';",
      "import type { U, T } from 'm';",
    ]),
    // Firing: two value statements merge
    ...merges("import { v } from 'm';", "import { w } from 'm';", [
      "import { v, w } from 'm';",
      "import { w, v } from 'm';",
    ]),
    // Firing: a default and a named statement merge
    ...merges("import d from 'm';", "import { v } from 'm';", [
      "import d, { v } from 'm';",
      "import d, { v } from 'm';",
    ]),
    // Firing: aliases and string-named imports survive the merge
    ...merges("import { a as b } from 'm';", "import type { T as U, 'x-y' as xy } from 'm';", [
      "import { a as b, type T as U, type 'x-y' as xy } from 'm';",
      "import { type T as U, type 'x-y' as xy, a as b } from 'm';",
    ]),
    // Firing: a specifier imported twice is kept once
    ...merges("import { v } from 'm';", "import { v, w } from 'm';", [
      "import { v, w } from 'm';",
      "import { v, w } from 'm';",
    ]),
    {
      // Firing: three statements collapse into the first, in one fix
      code: "import { a } from 'm';\nimport type { T } from 'm';\nimport { b } from 'm';\n",
      errors: [{ messageId: 'splitImports', data: { count: 3, source: 'm' }, line: 2 }],
      output: "import { a, type T, b } from 'm';\n",
    },
    {
      // Firing: an unrelated statement between the two stays where it is
      code: "import { v } from 'm';\nimport { x } from 'x';\nimport type { T } from 'm';\n",
      errors: [{ messageId: 'splitImports', line: 3 }],
      output: "import { v, type T } from 'm';\nimport { x } from 'x';\n",
    },
    {
      // Firing: a statement that shares its line with other code is removed without taking the line
      code: "import { v } from 'm'; import type { T } from 'm'; export {};",
      errors: [{ messageId: 'splitImports' }],
      output: "import { v, type T } from 'm'; export {};",
    },
    {
      // Firing: a side-effect statement in the group is neither merged nor removed
      code: "import 'm';\nimport { v } from 'm';\nimport type { T } from 'm';\n",
      errors: [{ messageId: 'splitImports', data: { count: 2, source: 'm' } }],
      output: "import 'm';\nimport { v, type T } from 'm';\n",
    },
    {
      // Firing: a comment inside the group's span withholds the fix, which would drop it
      code: "import { v } from 'm';\n// The type is used below.\nimport type { T } from 'm';\n",
      errors: [{ messageId: 'splitImports' }],
      output: null,
    },
    {
      // Firing: a comment trailing a statement withholds the fix too
      code: "import { v } from 'm'; // value\nimport type { T } from 'm';\n",
      errors: [{ messageId: 'splitImports' }],
      output: null,
    },
  ],
});

// region | Helpers

// Renders the pair in both source orders, since a merge that is right in one order can be wrong in the other.
function bothOrders(first: string, second: string): string[] {
  return [`${first}\n${second}\n`, `${second}\n${first}\n`];
}

// Renders the pair in both source orders as fixable cases, each with the output that order produces.
function merges(
  first: string,
  second: string,
  outputs: readonly [firstThenSecond: string, secondThenFirst: string],
): InvalidTestCase<MessageId, []>[] {
  return bothOrders(first, second).map((code, index) => ({
    code,
    errors: [{ messageId: 'splitImports', data: { count: 2, source: 'm' }, line: 2 }],
    output: `${outputs[index]}\n`,
  }));
}

// endregion | Helpers
