import { describe, expect, it } from 'vitest';

import { fixText } from '../fixText.ts';
import { fixtureWiring } from '../lintFixture.ts';

// `lintFixture` calls the same guard; text needs no fixture on disk, where `projectService` would load it beside the
// fixtures that do parse.
describe('the parse guard of the fixture-lint helpers', () => {
  it('rejects text that does not parse, naming the file', async () => {
    await expect(fixText([fixtureWiring], 'parse-guard.ts', 'const = ;')).rejects.toThrow(
      'parse-guard.ts failed to parse',
    );
  });
});
