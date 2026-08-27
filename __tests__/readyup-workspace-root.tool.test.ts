import { discoverWorkspaces } from 'readyup/check-utils';
import { describe, expect, it } from 'vitest';

describe('readyup workspace discovery', () => {
  // Both kits supply '.' to their search directories and dedupe with a Set, so the collapse holds only while
  // readyup spells the root the same way. A release normalizing it to '' or to an absolute path would make
  // every kit sweep the repo root twice, which no test inside either package can reach: each covers the
  // string list alone, and the projection from Workspace to string sits in the kit file.
  it('reports the repo root as the "." token both kits dedupe against', () => {
    const dirs = discoverWorkspaces().map((workspace) => workspace.dir);

    expect(dirs).toContain('.');
  });
});
