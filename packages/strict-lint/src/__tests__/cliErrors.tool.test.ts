import { createTempTree, type TempTree } from '@williamthorsen/toolbelt.testing/candidate';
import { describe, expect, it } from 'vitest';

import { runCli } from '../test-utils/strictLintCli.ts';

const ROOT_MARKER = 'pnpm-lock.yaml';

describe('CLI error reporting (subprocess)', () => {
  it('reports an unknown lint option as a usage error, exiting 2', () => {
    using tree = makeFixture();

    const { status, stderr } = runCli(tree.dir, ['--bogus']);

    expect(status).toBe(2);
    expect(stderr).toMatch(/^strict-lint: Unknown option '--bogus'/);
  });

  it('reports a --config path that names nothing as a usage error, exiting 2', () => {
    using tree = makeFixture();

    const { status, stderr } = runCli(tree.dir, ['--config', 'missing.config.js', 'a.js']);

    expect(status).toBe(2);
    expect(stderr.trim()).toBe('strict-lint: --config missing.config.js: file not found');
  });

  it("reports ESLint's own handled error as one prefixed line without a stack, exiting 1", () => {
    using tree = makeFixture();

    const { status, stderr } = runCli(tree.dir, ['missing-dir']);

    expect(status).toBe(1);
    expect(stderr.trim()).toBe("strict-lint: No files matching 'missing-dir' were found.");
  }, 30_000);
});

// region | Helpers

/** Writes a project with an ESLint config and one lintable file. */
function makeFixture(): TempTree {
  return createTempTree(
    { [ROOT_MARKER]: '', 'eslint.config.js': 'export default [];\n', 'a.js': 'export const a = 1;\n' },
    { prefix: 'strict-lint-errors-' },
  );
}

// endregion | Helpers
