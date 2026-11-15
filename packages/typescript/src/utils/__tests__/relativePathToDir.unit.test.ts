import { createTempTree, pointCwdAt } from '@williamthorsen/toolbelt.testing/candidate';
import { describe, expect, it } from 'vitest';

import { relativePathToDir } from '../relativePathToDir.ts';

describe(relativePathToDir, () => {
  it.each([
    { expected: 'packages/shared', targetDir: '../shared' },
    { expected: '../elsewhere', targetDir: '../../../elsewhere' },
    { expected: '', targetDir: '../..' },
  ])(
    'resolves $targetDir against currentDir and returns "$expected" from the working directory',
    ({ expected, targetDir }) => {
      using tree = createTempTree({ 'repo/packages/config/': '' });
      using _cwd = pointCwdAt(tree.resolve('repo'));

      expect(relativePathToDir(targetDir, tree.resolve('repo/packages/config'))).toBe(expected);
    },
  );
});
