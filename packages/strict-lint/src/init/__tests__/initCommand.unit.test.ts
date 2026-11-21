import { createTempTree, type TempTree } from '@williamthorsen/toolbelt.testing/candidate';
import { disposeOnTestFinished, silenceConsole } from '@williamthorsen/toolbelt.vitest';
import { listConsoleLines } from '@williamthorsen/toolbelt.vitest/candidate';
import { describe, expect, it } from 'vitest';

import { STRICT_LINT_CONFIG_NAME } from '#src/loadStrictLintConfigs.ts';

import { CONFIG_TEMPLATE } from '../configTemplate.ts';
import { runInit } from '../initCommand.ts';

const ROOT_MARKER = 'pnpm-lock.yaml';

describe(runInit, () => {
  it('writes the template into the target directory', () => {
    using tree = makeTree();
    const reported = captureConsole();

    expect(runInit([], tree.dir)).toBe(0);
    expect(tree.read(STRICT_LINT_CONFIG_NAME)).toBe(CONFIG_TEMPLATE);
    expect(reported.info()).toContain(`Created ${tree.resolve(STRICT_LINT_CONFIG_NAME)}`);
  });

  it('reports the project root and the marker that identified it', () => {
    using tree = makeTree();
    const reported = captureConsole();

    runInit([], tree.dir);

    expect(reported.info()).toContain(`project root at ${tree.dir} (marker: ${ROOT_MARKER})`);
  });

  // A fallback root is the case that a reader most needs qualified: The cascade may not be the one that they expect.
  it('qualifies a project root reached by fallback', () => {
    using tree = makeTree({ 'package.json': '{}' }, { hasRootMarker: false });
    const reported = captureConsole();

    runInit([], tree.dir);

    expect(reported.info()).toContain('(nearest package.json)');
  });

  it('prints an install step when the package cannot be imported from the target', () => {
    using tree = makeTree();
    const reported = captureConsole();

    expect(runInit([], tree.dir)).toBe(0);
    expect(reported.info()).toContain('pnpm add -D @williamthorsen/strict-lint eslint');
  });

  it('prints no install step when the package is installed', () => {
    using tree = makeTree();
    tree.write('node_modules/@williamthorsen/strict-lint/package.json', '{}');
    const reported = captureConsole();

    runInit([], tree.dir);

    expect(reported.info()).not.toContain('pnpm add -D');
  });

  it('writes nothing under --dry-run', () => {
    using tree = makeTree();
    const reported = captureConsole();

    expect(runInit(['--dry-run'], tree.dir)).toBe(0);
    expect(tree.exists(STRICT_LINT_CONFIG_NAME)).toBe(false);
    expect(reported.info()).toContain('Would create');
  });

  it('keeps a diverged config and names the flag that would replace it', () => {
    using tree = makeTree();
    tree.write(STRICT_LINT_CONFIG_NAME, 'export default {};\n');
    const reported = captureConsole();

    expect(runInit([], tree.dir)).toBe(0);
    expect(tree.read(STRICT_LINT_CONFIG_NAME)).toBe('export default {};\n');
    expect(reported.info()).toContain('Pass --force to overwrite it.');
  });

  it('replaces a diverged config under --force', () => {
    using tree = makeTree();
    tree.write(STRICT_LINT_CONFIG_NAME, 'export default {};\n');
    const reported = captureConsole();

    runInit(['--force'], tree.dir);

    expect(tree.read(STRICT_LINT_CONFIG_NAME)).toBe(CONFIG_TEMPLATE);
    expect(reported.info()).toContain('Overwrote');
  });

  it('reports the overwrite that it would make under --dry-run --force', () => {
    using tree = makeTree();
    tree.write(STRICT_LINT_CONFIG_NAME, 'export default {};\n');
    const reported = captureConsole();

    expect(runInit(['--dry-run', '--force'], tree.dir)).toBe(0);
    expect(tree.read(STRICT_LINT_CONFIG_NAME)).toBe('export default {};\n');
    expect(reported.info()).toContain('Would overwrite');
  });

  // A directory where the config belongs exists for `existsSync` and throws for `readFileSync`.
  it('names the reason when the existing config cannot be read', () => {
    using tree = makeTree();
    tree.mkdir(STRICT_LINT_CONFIG_NAME);
    const reported = captureConsole();

    expect(runInit([], tree.dir)).toBe(0);
    expect(reported.info()).toContain('could not be read');
  });

  // `reconcileFile` compares before it consults the conflict policy, so `--force` makes no write here.
  it.each([[[]], [['--force']]])('reports an unchanged config as up to date, given %j', (argv) => {
    using tree = makeTree();
    tree.write(STRICT_LINT_CONFIG_NAME, CONFIG_TEMPLATE);
    const reported = captureConsole();

    runInit(argv, tree.dir);

    expect(reported.info()).toContain('is already up to date');
  });

  // A file where the `.config` directory belongs makes the write fail at `mkdir`.
  it('reports a failed write on stderr and returns a non-zero code', () => {
    using tree = makeTree({ '.config': '' });
    const reported = captureConsole();

    expect(runInit([], tree.dir)).toBe(1);
    expect(reported.error()).toContain('strict-lint init: failed to write');
    expect(reported.info()).not.toContain('project root at');
  });

  it.each([[['--help']], [['-h']]])('writes nothing and returns 0 for %j', (argv) => {
    using tree = makeTree();
    captureConsole();

    expect(runInit(argv, tree.dir)).toBe(0);
    expect(tree.exists(STRICT_LINT_CONFIG_NAME)).toBe(false);
  });
});

// region | Helpers

/** Silences the console and returns accessors for everything written to each stream since. */
function captureConsole(): { error: () => string; info: () => string } {
  const silenced = disposeOnTestFinished(silenceConsole(['error', 'info']));
  return {
    error: () => listConsoleLines(silenced.error).join('\n'),
    info: () => listConsoleLines(silenced.info).join('\n'),
  };
}

/** Creates a throwaway tree with a project-root marker, unless `hasRootMarker` is false. */
function makeTree(files: Record<string, string> = {}, { hasRootMarker = true } = {}): TempTree {
  return createTempTree(hasRootMarker ? { [ROOT_MARKER]: '', ...files } : files, { prefix: 'strict-lint-init-unit-' });
}

// endregion | Helpers
