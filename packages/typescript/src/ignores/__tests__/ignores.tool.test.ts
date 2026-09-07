import { ESLint } from 'eslint';
import { globalIgnores } from 'eslint/config';
import { describe, expect, it } from 'vitest';

import { commonIgnores } from '../common.ts';
import { toolIgnores } from '../tool.ts';

// `isPathIgnored` reports true for any path that no config block matches, so a positive assertion on
// its own would still pass once its glob stopped matching. Every case below pairs one with a
// negative, and the `files` block claims each extension queried so that an unmatched path cannot be
// mistaken for an ignored one. The paths need not exist: `isPathIgnored` answers on the path alone.
const eslint = new ESLint({
  cwd: import.meta.dirname,
  overrideConfig: [globalIgnores([...commonIgnores, ...toolIgnores]), { files: ['**/*.{cjs,js,json,mjs,sh,ts}'] }],
  overrideConfigFile: true,
});

describe('commonIgnores', () => {
  it('ignores build output', async () => {
    await expect(eslint.isPathIgnored('dist/index.js')).resolves.toBe(true);
  });

  it('ignores a shell script, which no config parses', async () => {
    await expect(eslint.isPathIgnored('scripts/deploy.sh')).resolves.toBe(true);
  });

  // `**/lib/**`, `**/output/**`, and `*.d.ts` were dropped from the list because these are the paths
  // they reached: authored source in the repos consuming this config, and no build output anywhere.
  it('leaves authored source under lib and output, and a hand-written declaration, alone', async () => {
    await expect(eslint.isPathIgnored('src/lib/helpers.ts')).resolves.toBe(false);
    await expect(eslint.isPathIgnored('src/output/terminal.ts')).resolves.toBe(false);
    await expect(eslint.isPathIgnored('src/types/global.d.ts')).resolves.toBe(false);
  });
});

describe('toolIgnores', () => {
  it('ignores a compiled kit bundle and the manifest recording its hash', async () => {
    await expect(eslint.isPathIgnored('.readyup/kits/default.js')).resolves.toBe(true);
    await expect(eslint.isPathIgnored('.readyup/manifest.json')).resolves.toBe(true);
  });

  // The two readyup entries are scoped rather than covering the directory, so widening either one
  // would take the kit declaration and its predicates out of the lint run without failing anything else.
  it('leaves the authored TypeScript sharing that directory alone', async () => {
    await expect(eslint.isPathIgnored('.readyup/kits/default.ts')).resolves.toBe(false);
    await expect(eslint.isPathIgnored('.readyup/lib/predicate.ts')).resolves.toBe(false);
  });

  it('ignores what an agent harness generates', async () => {
    await expect(eslint.isPathIgnored('.claude/settings.json')).resolves.toBe(true);
    await expect(eslint.isPathIgnored('.rovo/generated.js')).resolves.toBe(true);
    await expect(eslint.isPathIgnored('.rovodev/generated.js')).resolves.toBe(true);
  });

  it('leaves hand-written JavaScript outside every tool directory alone', async () => {
    await expect(eslint.isPathIgnored('bin/wrapper.js')).resolves.toBe(false);
  });
});
