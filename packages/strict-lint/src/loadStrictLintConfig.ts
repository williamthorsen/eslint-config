import { findNearestFile } from './common/findNearestFile.ts';
import { importConfigModule } from './common/importConfigModule.ts';
import type { StrictLintConfig } from './types.ts';

const STRICT_LINT_CONFIG_NAME = '.config/strict-lint.config.ts';

/**
 * Loads the nearest strict-lint config at or above `eslintConfigDir`, mirroring ESLint's own find-up. The nearest
 * config wins outright; configs at farther levels are ignored rather than merged. Returns undefined when the walk
 * reaches the filesystem root without a match.
 */
export async function loadStrictLintConfig(eslintConfigDir: string): Promise<StrictLintConfig | undefined> {
  const configFilePath = findNearestFile(STRICT_LINT_CONFIG_NAME, eslintConfigDir);

  if (configFilePath === undefined) {
    return undefined;
  }

  const mod = await importConfigModule(configFilePath);
  assertIsStrictLintConfig(mod);
  return mod.default;
}

function assertIsStrictLintConfig(mod: unknown): asserts mod is { default: StrictLintConfig } {
  if (typeof mod !== 'object' || mod === null) {
    throw new TypeError('Expected strict-lint config module to be an object');
  }
  if (!('default' in mod)) {
    throw new TypeError('Expected strict-lint config module to have a default export');
  }

  const config = mod.default;
  if (typeof config !== 'object' || config === null) {
    throw new TypeError('Expected strict-lint config default export to be an object');
  }

  if ('maxSeverity' in config && config.maxSeverity !== undefined) {
    if (typeof config.maxSeverity !== 'object' || config.maxSeverity === null) {
      throw new TypeError('Expected maxSeverity to be an object');
    }
    for (const [key, value] of Object.entries(config.maxSeverity)) {
      if (value !== 'warn' && value !== 'error') {
        throw new TypeError(`Expected maxSeverity["${key}"] to be "warn" or "error", got "${String(value)}"`);
      }
    }
  }
}
