import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { disposeOnTestFinished, listConsoleLines, silenceConsole } from '@williamthorsen/toolbelt.vitest/candidate';
import { afterAll, describe, expect, it } from 'vitest';

import { STRICT_LINT_CONFIG_NAME } from '../../loadStrictLintConfigs.ts';
import { CONFIG_TEMPLATE } from '../configTemplate.ts';
import { runInit } from '../initCommand.ts';

const ROOT_MARKER = 'pnpm-lock.yaml';

const createdDirs: string[] = [];

describe(runInit, () => {
  afterAll(() => {
    for (const dir of createdDirs) {
      fs.rmSync(dir, { force: true, recursive: true });
    }
  });

  it('writes the template into the target directory', () => {
    const dir = makeTree();
    const reported = captureConsole();

    expect(runInit([], dir)).toBe(0);
    expect(readConfig(dir)).toBe(CONFIG_TEMPLATE);
    expect(reported.info()).toContain(`Created ${path.join(dir, STRICT_LINT_CONFIG_NAME)}`);
  });

  it('reports the project root and the marker that chose it', () => {
    const dir = makeTree();
    const reported = captureConsole();

    runInit([], dir);

    expect(reported.info()).toContain(`project root at ${dir} (marker: ${ROOT_MARKER})`);
  });

  // A fallback root is the case a reader most needs qualified: the cascade may not be the one they expect.
  it('qualifies a project root reached by fallback', () => {
    const dir = makeTree({ 'package.json': '{}' }, { hasRootMarker: false });
    const reported = captureConsole();

    runInit([], dir);

    expect(reported.info()).toContain('(nearest package.json)');
  });

  it('prints an install step when the package cannot be imported from the target', () => {
    const dir = makeTree();
    const reported = captureConsole();

    expect(runInit([], dir)).toBe(0);
    expect(reported.info()).toContain('pnpm add -D @williamthorsen/strict-lint eslint');
  });

  it('prints no install step when the package is installed', () => {
    const dir = makeTree();
    writeFile(path.join(dir, 'node_modules/@williamthorsen/strict-lint/package.json'), '{}');
    const reported = captureConsole();

    runInit([], dir);

    expect(reported.info()).not.toContain('pnpm add -D');
  });

  it('writes nothing under --dry-run', () => {
    const dir = makeTree();
    const reported = captureConsole();

    expect(runInit(['--dry-run'], dir)).toBe(0);
    expect(fs.existsSync(path.join(dir, STRICT_LINT_CONFIG_NAME))).toBe(false);
    expect(reported.info()).toContain('Would create');
  });

  it('keeps a diverged config and names the flag that would replace it', () => {
    const dir = makeTree();
    writeConfig(dir, 'export default {};\n');
    const reported = captureConsole();

    expect(runInit([], dir)).toBe(0);
    expect(readConfig(dir)).toBe('export default {};\n');
    expect(reported.info()).toContain('Pass --force to overwrite it.');
  });

  it('replaces a diverged config under --force', () => {
    const dir = makeTree();
    writeConfig(dir, 'export default {};\n');
    const reported = captureConsole();

    runInit(['--force'], dir);

    expect(readConfig(dir)).toBe(CONFIG_TEMPLATE);
    expect(reported.info()).toContain('Overwrote');
  });

  it('reports the overwrite it would make under --dry-run --force', () => {
    const dir = makeTree();
    writeConfig(dir, 'export default {};\n');
    const reported = captureConsole();

    expect(runInit(['--dry-run', '--force'], dir)).toBe(0);
    expect(readConfig(dir)).toBe('export default {};\n');
    expect(reported.info()).toContain('Would overwrite');
  });

  // A directory where the config belongs exists for `existsSync` and throws for `readFileSync`.
  it('names the reason when the existing config cannot be read', () => {
    const dir = makeTree();
    fs.mkdirSync(path.join(dir, STRICT_LINT_CONFIG_NAME), { recursive: true });
    const reported = captureConsole();

    expect(runInit([], dir)).toBe(0);
    expect(reported.info()).toContain('could not be read');
  });

  // `reconcileFile` compares before it consults the conflict policy, so `--force` reports no write it did not make.
  it.each([[[]], [['--force']]])('reports an unchanged config as up to date, given %j', (argv) => {
    const dir = makeTree();
    writeConfig(dir, CONFIG_TEMPLATE);
    const reported = captureConsole();

    runInit(argv, dir);

    expect(reported.info()).toContain('is already up to date');
  });

  // A file where the `.config` directory belongs makes the write fail at `mkdir`.
  it('reports a failed write on stderr and returns a non-zero code', () => {
    const dir = makeTree({ '.config': '' });
    const reported = captureConsole();

    expect(runInit([], dir)).toBe(1);
    expect(reported.error()).toContain('Failed to write');
    expect(reported.info()).not.toContain('project root at');
  });

  it.each([[['--help']], [['-h']]])('writes nothing and returns 0 for %j', (argv) => {
    const dir = makeTree();
    captureConsole();

    expect(runInit(argv, dir)).toBe(0);
    expect(fs.existsSync(path.join(dir, STRICT_LINT_CONFIG_NAME))).toBe(false);
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

/** A throwaway tree, carrying a project-root marker unless one is withheld to exercise the fallback. */
function makeTree(files: Record<string, string> = {}, { hasRootMarker = true } = {}): string {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'strict-lint-init-unit-')));
  createdDirs.push(dir);
  const entries = Object.entries(hasRootMarker ? { [ROOT_MARKER]: '', ...files } : files);
  for (const [name, content] of entries) {
    writeFile(path.join(dir, name), content);
  }
  return dir;
}

function readConfig(dir: string): string {
  return fs.readFileSync(path.join(dir, STRICT_LINT_CONFIG_NAME), 'utf8');
}

function writeConfig(dir: string, content: string): void {
  writeFile(path.join(dir, STRICT_LINT_CONFIG_NAME), content);
}

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

// endregion | Helpers
