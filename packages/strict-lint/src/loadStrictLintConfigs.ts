import { type ConfigCascade, loadConfigCascade } from '@williamthorsen/toolbelt.filesystem';

import { wrapNativeTsError } from './common/importConfigModule.ts';
import { formatRuleSeverities, isRuleSeverity } from './common/severity.ts';
import type { StrictLintConfig } from './types.ts';

/** The config file strict-lint looks for, relative to each directory level of the walk. */
export const STRICT_LINT_CONFIG_NAME = '.config/strict-lint.config.ts';

/**
 * Loads every strict-lint config between `startDir` and the project root, nearest first, stopping at the first one
 * that declares `shouldIgnoreAncestors`. The cascade's provenance rides along so callers can report which files
 * contributed and where the walk was bounded.
 */
export async function loadStrictLintConfigs(startDir: string): Promise<ConfigCascade<StrictLintConfig>> {
  const cascade = await loadCascade(startDir);

  return {
    entries: cascade.entries.map(({ config, dir, filePath }) => {
      assertIsStrictLintConfig(config, filePath);
      return { config, dir, filePath };
    }),
    projectRoot: cascade.projectRoot,
    stopReason: cascade.stopReason,
  };
}

// region | Helpers

/** Runs the cascade, mapping the native-TypeScript failure modes its plain `import()` surfaces. */
async function loadCascade(startDir: string): Promise<ConfigCascade<unknown>> {
  try {
    return await loadConfigCascade({
      fileNames: [STRICT_LINT_CONFIG_NAME],
      shouldStopAscent: isIgnoringAncestors,
      startDir,
    });
  } catch (error: unknown) {
    throw wrapNativeTsError(error, STRICT_LINT_CONFIG_NAME) ?? error;
  }
}

/**
 * Whether a config bounds the walk at its own level. The cascade consults this the moment a config is loaded, before
 * strict-lint validates any of them, so every value has to be tolerated; an ill-typed flag fails validation instead.
 */
function isIgnoringAncestors(config: unknown): boolean {
  return isRecord(config) && config['shouldIgnoreAncestors'] === true;
}

function assertIsStrictLintConfig(config: unknown, filePath: string): asserts config is StrictLintConfig {
  if (!isRecord(config)) {
    throw new TypeError(`Expected the default export of "${filePath}" to be an object`);
  }

  const { maxSeverity, shouldIgnoreAncestors } = config;

  if (maxSeverity !== undefined) {
    if (!isRecord(maxSeverity)) {
      throw new TypeError(`Expected maxSeverity in "${filePath}" to be an object`);
    }
    for (const [rule, severity] of Object.entries(maxSeverity)) {
      // An explicit `undefined` reads as "no ceiling", exactly as an absent key does, so it never reaches the guard.
      if (severity !== undefined && !isRuleSeverity(severity)) {
        const expectation = `to be a rule severity (${formatRuleSeverities()})`;
        throw new TypeError(
          `Expected maxSeverity["${rule}"] in "${filePath}" ${expectation}, got "${describeValue(severity)}"`,
        );
      }
    }
  }

  if (shouldIgnoreAncestors !== undefined && typeof shouldIgnoreAncestors !== 'boolean') {
    throw new TypeError(`Expected shouldIgnoreAncestors in "${filePath}" to be a boolean`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Renders a rejected value for a diagnostic, so an object reports its shape rather than `[object Object]`. */
function describeValue(value: unknown): string {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}

// endregion | Helpers
