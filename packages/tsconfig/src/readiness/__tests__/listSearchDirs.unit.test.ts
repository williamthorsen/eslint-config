import { describe, expect, it } from 'vitest';

import { listSearchDirs } from '../listSearchDirs.ts';

describe(listSearchDirs, () => {
  it('supplies the repo root when the workspace list omits it', () => {
    expect(listSearchDirs(['packages/a', 'packages/b'])).toStrictEqual(['.', 'packages/a', 'packages/b']);
  });

  it('holds the repo root once when the workspace list reports it', () => {
    expect(listSearchDirs(['.', 'packages/a'])).toStrictEqual(['.', 'packages/a']);
  });
});
