import type { StrictLintCascade } from '#src/loadStrictLintConfigs.ts';
import type { StrictLintConfig } from '#src/types.ts';

/** Builds a cascade with one entry per config, given nearest first, each at its own level below `/project`. */
export function buildCascade(configs: StrictLintConfig[]): StrictLintCascade {
  return {
    entries: configs.map((config, index) => ({
      config,
      dir: `/project/level-${String(index)}`,
      filePath: buildConfigPath(`/project/level-${String(index)}`),
    })),
    projectRoot: { marker: 'pnpm-workspace.yaml', rootDir: '/project', source: 'marker' },
    stopReason: 'stop-dir',
  };
}

/** Returns the strict-lint config path within a directory. */
export function buildConfigPath(dir: string): string {
  return `${dir}/.config/strict-lint.config.ts`;
}
