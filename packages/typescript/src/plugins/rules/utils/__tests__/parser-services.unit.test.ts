import type { ParserServices } from '@typescript-eslint/utils';
import type ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { findParserServices } from '../parser-services.ts';

const nodeMaps = {
  esTreeNodeToTSNodeMap: new WeakMap(),
  tsNodeToESTreeNodeMap: new WeakMap(),
};

describe(findParserServices, () => {
  it('returns typed services', () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- only the compiler constructs a `ts.Program`, and the helper never reads it.
    const services: Partial<ParserServices> = { ...nodeMaps, program: {} as ts.Program };

    expect(findParserServices(buildContext(services))).toBe(services);
  });

  it('returns untyped services', () => {
    const services: Partial<ParserServices> = { ...nodeMaps, program: null };

    expect(findParserServices(buildContext(services))).toBe(services);
  });

  it('returns undefined when the parser supplies no services', () => {
    expect(findParserServices(buildContext(undefined))).toBeUndefined();
  });

  it.each(['esTreeNodeToTSNodeMap', 'tsNodeToESTreeNodeMap'] as const)(
    'returns undefined when %s is missing',
    (key) => {
      const services: Partial<ParserServices> = { ...nodeMaps, program: null, [key]: undefined };

      expect(findParserServices(buildContext(services))).toBeUndefined();
    },
  );
});

// region | Helpers

/** Builds the slice of a rule context that the helper reads. */
function buildContext(parserServices: Partial<ParserServices> | undefined) {
  return { sourceCode: parserServices === undefined ? {} : { parserServices } };
}

// endregion | Helpers
