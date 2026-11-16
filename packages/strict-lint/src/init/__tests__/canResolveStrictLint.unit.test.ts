import { createTempTree, type TempTree } from '@williamthorsen/toolbelt.testing/candidate';
import { describe, expect, it } from 'vitest';

import { canResolveStrictLint } from '../canResolveStrictLint.ts';

describe(canResolveStrictLint, () => {
  it('reports an installed package in the directory itself', () => {
    using tree = makeTree({ install: '.' });

    expect(canResolveStrictLint(tree.dir)).toBe(true);
  });

  it('reports an installed package in an ancestor directory', () => {
    using tree = makeTree({ install: '.' });

    expect(canResolveStrictLint(tree.resolve('packages/pkg/src'))).toBe(true);
  });

  it('reports no package when the tree contains no node_modules', () => {
    using tree = makeTree({});

    expect(canResolveStrictLint(tree.resolve('packages/pkg'))).toBe(false);
  });

  it('reports no package when node_modules contains a different package', () => {
    using tree = makeTree({});
    tree.write('node_modules/@williamthorsen/tsconfig/package.json', '{}');

    expect(canResolveStrictLint(tree.dir)).toBe(false);
  });

  // A pnpm install links the package, so a walk that did not follow the link would miss it.
  it('follows a symlinked install', () => {
    using tree = makeTree({});
    tree.write('store/strict-lint/package.json', '{}');
    tree.symlink('node_modules/@williamthorsen/strict-lint', tree.resolve('store/strict-lint'));

    expect(canResolveStrictLint(tree.dir)).toBe(true);
  });
});

// region | Helpers

/** Creates a throwaway tree containing `packages/pkg/src`, optionally with the package installed at `install`. */
function makeTree({ install }: { install?: string }): TempTree {
  return createTempTree(
    {
      'packages/pkg/src/': '',
      ...(install !== undefined && { [`${install}/node_modules/@williamthorsen/strict-lint/package.json`]: '{}' }),
    },
    { prefix: 'strict-lint-resolve-' },
  );
}

// endregion | Helpers
