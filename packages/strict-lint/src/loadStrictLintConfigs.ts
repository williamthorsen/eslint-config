import { type ConfigCascade, loadConfigCascade } from '@williamthorsen/toolbelt.filesystem';
import { findProjectRoot, type ProjectRoot } from '@williamthorsen/toolbelt.packaging';
import type { Linter } from 'eslint';

import { isRecord } from './common/isRecord.ts';
import { formatRuleSeverities, isRuleSeverity } from './common/severity.ts';
import { wrapNativeTsError } from './common/wrapNativeTsError.ts';
import type { StrictLintConfig } from './types.ts';

/** The config file that strict-lint looks for, relative to each directory level of the walk. */
export const STRICT_LINT_CONFIG_NAME = '.config/strict-lint.config.ts';

/** A cascade of strict-lint configs, with the project root that bounded its ascent. */
export interface StrictLintCascade extends ConfigCascade<StrictLintConfig> {
  projectRoot: ProjectRoot;
}

/**
 * Loads every strict-lint config between `startDir` and the project root, nearest first, stopping at the first one
 * that declares `shouldIgnoreAncestors`. The result includes the cascade's provenance, so that callers can report
 * which files contributed and where the walk was bounded.
 */
export async function loadStrictLintConfigs(startDir: string): Promise<StrictLintCascade> {
  const projectRoot = findProjectRoot(startDir);
  const cascade = await loadCascade(startDir, projectRoot.rootDir);

  return {
    entries: cascade.entries.map(({ config, dir, filePath }) => {
      assertIsStrictLintConfig(config, filePath);
      return { config, dir, filePath };
    }),
    projectRoot,
    stopReason: cascade.stopReason,
  };
}

/**
 * Returns the nearest declared shared configs, flattened into one element list. The nearest level wins outright rather
 * than merging with the levels above it: a declaration names the configs that one ESLint config extends, and two
 * levels' lists concatenated would assert a composition that neither level wrote.
 */
export function resolveSharedConfigs(cascade: StrictLintCascade): Linter.Config[] {
  const entry = cascade.entries.find(({ config }) => config.sharedConfigs !== undefined);
  return entry?.config.sharedConfigs?.flat() ?? [];
}

// region | Helpers

/** Runs the cascade, mapping the native-TypeScript failure modes that its plain `import()` surfaces. */
async function loadCascade(startDir: string, stopAtDir: string): Promise<ConfigCascade<unknown>> {
  try {
    return await loadConfigCascade({
      fileNames: [STRICT_LINT_CONFIG_NAME],
      shouldStopAscent: isIgnoringAncestors,
      startDir,
      stopAtDir,
    });
  } catch (error: unknown) {
    throw wrapNativeTsError(error, STRICT_LINT_CONFIG_NAME) ?? error;
  }
}

/**
 * Checks whether a config bounds the walk at its own level. The cascade calls this as it loads each config, before
 * strict-lint validates any of them, so it must tolerate every value; validation later rejects an ill-typed flag.
 */
function isIgnoringAncestors(config: unknown): boolean {
  return isRecord(config) && config['shouldIgnoreAncestors'] === true;
}

/** Asserts that the default export of a config file is a valid strict-lint config. */
function assertIsStrictLintConfig(config: unknown, filePath: string): asserts config is StrictLintConfig {
  if (!isRecord(config)) {
    throw new TypeError(`Expected the default export of "${filePath}" to be an object`);
  }

  const { maxSeverity, sharedConfigs, shouldIgnoreAncestors } = config;

  if (maxSeverity !== undefined) {
    if (!isRecord(maxSeverity)) {
      throw new TypeError(`Expected maxSeverity in "${filePath}" to be an object`);
    }
    for (const [rule, severity] of Object.entries(maxSeverity)) {
      // Skip an explicit `undefined`, which means "no ceiling", as an absent key does.
      if (severity !== undefined && !isRuleSeverity(severity)) {
        const expectation = `to be a rule severity (${formatRuleSeverities()})`;
        throw new TypeError(
          `Expected maxSeverity["${rule}"] in "${filePath}" ${expectation}, got "${describeValue(severity)}"`,
        );
      }
    }
  }

  if (sharedConfigs !== undefined) {
    assertIsSharedConfigs(sharedConfigs, filePath);
  }

  if (shouldIgnoreAncestors !== undefined && typeof shouldIgnoreAncestors !== 'boolean') {
    throw new TypeError(`Expected shouldIgnoreAncestors in "${filePath}" to be a boolean`);
  }
}

/** Asserts that `value` is a list whose entries are each a config object or an array of them, as `flat()` expects. */
function assertIsSharedConfigs(value: unknown, filePath: string): void {
  if (!Array.isArray(value)) {
    throw new TypeError(`Expected sharedConfigs in "${filePath}" to be an array`);
  }
  for (const [index, entry] of value.entries()) {
    const elements: unknown[] = Array.isArray(entry) ? entry : [entry];
    for (const element of elements) {
      if (!isRecord(element)) {
        const expectation = 'to be a config object or an array of them';
        throw new TypeError(
          `Expected sharedConfigs[${String(index)}] in "${filePath}" ${expectation}, got "${describeValue(element)}"`,
        );
      }
    }
  }
}

/** Renders a rejected value for a diagnostic, so that an object reports its shape rather than `[object Object]`. */
function describeValue(value: unknown): string {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}

// endregion | Helpers
