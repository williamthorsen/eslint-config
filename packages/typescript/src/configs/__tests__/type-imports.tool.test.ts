import { describe, expect, it } from 'vitest';

import { baseConfig } from '../../baseConfig.ts';
import { fixText } from '../test-utils/fixText.ts';

// Building the TS program on a cold module cache runs well past Vitest's 5s default.
const COLD_START_TIMEOUT_MS = 30_000;

const MODULE = "'./type-imports-module.ts'";

/**
 * One row of the shape matrix in #172. `imports` holds the statements in one source order; a two-statement
 * row also runs reversed. `usage` references every binding the way the row intends, as a type or a value,
 * so that nothing reports an unused binding and `consistent-type-imports` sees the intended kind.
 * `expected` is the import block `--fix` must converge on, one statement per line, in any order.
 */
interface Row {
  expected: string[];
  id: string;
  imports: string[];
  usage: string;
}

const rows: Row[] = [
  {
    id: 'A: value + type',
    imports: [`import { v } from ${MODULE};`, `import type { T } from ${MODULE};`],
    usage: 'export type X = T; export const used = [v];',
    expected: [`import { type T, v } from ${MODULE};`],
  },
  {
    id: 'B: default + type',
    imports: [`import d from ${MODULE};`, `import type { T } from ${MODULE};`],
    usage: 'export type X = T; export const used = [d];',
    expected: [`import d, { type T } from ${MODULE};`],
  },
  {
    id: 'C: namespace + type',
    imports: [`import * as ns from ${MODULE};`, `import type { T } from ${MODULE};`],
    usage: 'export type X = T; export const used = [ns];',
    expected: [`import * as ns from ${MODULE};`, `import type { T } from ${MODULE};`],
  },
  {
    id: 'D: side effect + type',
    imports: [`import ${MODULE};`, `import type { T } from ${MODULE};`],
    usage: 'export type X = T;',
    expected: [`import ${MODULE};`, `import type { T } from ${MODULE};`],
  },
  {
    id: 'E: side effect + value',
    imports: [`import ${MODULE};`, `import { v } from ${MODULE};`],
    usage: 'export const used = [v];',
    expected: [`import ${MODULE};`, `import { v } from ${MODULE};`],
  },
  {
    id: 'F: type default + type',
    imports: [`import type d from ${MODULE};`, `import type { T } from ${MODULE};`],
    usage: 'export type X = T; export type Y = typeof d;',
    expected: [`import type d from ${MODULE};`, `import type { T } from ${MODULE};`],
  },
  {
    id: 'G: type default + value',
    imports: [`import type d from ${MODULE};`, `import { v } from ${MODULE};`],
    usage: 'export type Y = typeof d; export const used = [v];',
    expected: [`import type d from ${MODULE};`, `import { v } from ${MODULE};`],
  },
  {
    id: 'H: default with value + type',
    imports: [`import d, { v } from ${MODULE};`, `import type { T } from ${MODULE};`],
    usage: 'export type X = T; export const used = [d, v];',
    expected: [`import d, { type T, v } from ${MODULE};`],
  },
  {
    id: 'I: inline type alone',
    imports: [`import { type T } from ${MODULE};`],
    usage: 'export type X = T;',
    expected: [`import type { T } from ${MODULE};`],
  },
  {
    id: 'J: unmarked type beside a value',
    imports: [`import { v, T } from ${MODULE};`],
    usage: 'export type X = T; export const used = [v];',
    expected: [`import { type T, v } from ${MODULE};`],
  },
  {
    id: 'K: unmarked type alone',
    imports: [`import { T } from ${MODULE};`],
    usage: 'export type X = T;',
    expected: [`import type { T } from ${MODULE};`],
  },
  {
    id: 'L: unmarked default and named, both types',
    imports: [`import d, { T } from ${MODULE};`],
    usage: 'export type X = T; export type Y = typeof d;',
    expected: [`import type d from ${MODULE};`, `import type { T } from ${MODULE};`],
  },
];

const cases = rows.flatMap((row) =>
  row.imports.length === 1
    ? [{ id: row.id, row, source: renderSource(row.imports, row.usage) }]
    : [
        { id: `${row.id} (as written)`, row, source: renderSource(row.imports, row.usage) },
        { id: `${row.id} (reversed)`, row, source: renderSource(row.imports.toReversed(), row.usage) },
      ],
);

describe('type-import shapes under --fix', () => {
  it.each(cases)(
    '$id converges on the expected statements with nothing left to report',
    async ({ row, source }) => {
      const fixed = await fixText(baseConfig, 'type-imports-row.ts', source);

      expect(fixed.messages.map((message) => `${message.ruleId ?? 'fatal'}: ${message.message}`)).toStrictEqual([]);
      expect(importLines(fixed.output).toSorted()).toStrictEqual(row.expected.toSorted());

      const again = await fixText(baseConfig, 'type-imports-row.ts', fixed.output);

      expect(again.output).toBe(fixed.output);
      expect(again.messages).toStrictEqual([]);
    },
    COLD_START_TIMEOUT_MS,
  );

  it.each(rows.filter((row) => row.imports.length === 2))(
    '$id fixes to the same text in both source orders',
    async (row) => {
      const [asWritten, reversed] = await Promise.all([
        fixText(baseConfig, 'type-imports-row.ts', renderSource(row.imports, row.usage)),
        fixText(baseConfig, 'type-imports-row.ts', renderSource(row.imports.toReversed(), row.usage)),
      ]);

      expect(reversed.output).toBe(asWritten.output);
    },
    COLD_START_TIMEOUT_MS,
  );
});

// region | Helpers

/**
 * Collects the import statements of the text, one per line, with the spacing around braces and commas
 * normalized: the fixers leave that loose (`{ type T , v }`), and the formatter rather than lint owns it.
 */
function importLines(text: string): string[] {
  return text
    .split('\n')
    .filter((line) => line.startsWith('import '))
    .map((line) =>
      line
        .replaceAll(/\s+/g, ' ')
        .replaceAll(/\{\s*/g, '{ ')
        .replaceAll(/\s*\}/g, ' }')
        .replaceAll(/\s*,\s*/g, ', '),
    );
}

function renderSource(imports: readonly string[], usage: string): string {
  return `${imports.join('\n')}\n\n${usage}\n`;
}

// endregion | Helpers
