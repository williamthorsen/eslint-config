import { disposeOnTestFinished, silenceConsole } from '@williamthorsen/toolbelt.vitest';
import { listConsoleLines } from '@williamthorsen/toolbelt.vitest/candidate';
import { describe, expect, it } from 'vitest';

import type { StrictLintCascade } from '../loadStrictLintConfigs.ts';
import { reportConfigProvenance } from '../reportConfigProvenance.ts';
import { buildConfigPath } from '../test-utils/strictLintCascades.ts';

describe(reportConfigProvenance, () => {
  it('names the project root and every contributing config file, lowest precedence first', () => {
    const lines = capture(new Map([['/project', buildCascade(['/project/level-0', '/project/level-1'])]]));

    expect(lines).toStrictEqual([
      'strict-lint: project root /project (marker: pnpm-workspace.yaml)',
      'strict-lint: config files for /project, lowest precedence first:',
      `strict-lint:   ${buildConfigPath('/project/level-1')}`,
      `strict-lint:   ${buildConfigPath('/project/level-0')}`,
    ]);
  });

  it('reports one block per distinct config set rather than one per directory', () => {
    const lines = capture(
      new Map([
        ['/project/a', buildCascade([])],
        ['/project/b', buildCascade([])],
        ['/other', buildCascade(['/other'])],
      ]),
    );

    expect(lines).toStrictEqual([
      'strict-lint: project root /project (marker: pnpm-workspace.yaml)',
      'strict-lint: no config file found for /project/a, /project/b',
      'strict-lint: config files for /other, lowest precedence first:',
      `strict-lint:   ${buildConfigPath('/other')}`,
    ]);
  });

  it('collapses a long directory list into a count', () => {
    const dirs = ['/one', '/two', '/three', '/four', '/five'];

    const lines = capture(new Map(dirs.map((dir) => [dir, buildCascade([])])));

    expect(lines).toContain('strict-lint: no config file found for /one, /two, /three (and 2 more)');
  });

  it('reports the stop when a config bounded the ascent', () => {
    const lines = capture(new Map([['/project', buildCascade(['/project'], 'predicate')]]));

    expect(lines).toContain('strict-lint: ascent stopped by shouldIgnoreAncestors');
  });

  it('says so when no file was linted, rather than reporting a config that nothing consulted', () => {
    expect(capture(new Map())).toStrictEqual(['strict-lint: no files were linted, so no config was resolved']);
  });
});

// region | Helpers

/** Builds a cascade with one entry per config directory, nearest first, bounded by a marker-identified root. */
function buildCascade(configDirs: string[], stopReason: 'predicate' | 'stop-dir' = 'stop-dir'): StrictLintCascade {
  return {
    entries: configDirs.map((dir) => ({ config: {}, dir, filePath: buildConfigPath(dir) })),
    projectRoot: { marker: 'pnpm-workspace.yaml', rootDir: '/project', source: 'marker' },
    stopReason,
  };
}

/** Returns the lines that the report writes to stderr for the given cascades. */
function capture(cascades: ReadonlyMap<string, StrictLintCascade>): string[] {
  const { error } = disposeOnTestFinished(silenceConsole(['error']));
  reportConfigProvenance(cascades);
  return listConsoleLines(error);
}

// endregion | Helpers
