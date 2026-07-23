import path from 'node:path';

import type { Linter } from 'eslint';

import { findNearestFile } from './common/findNearestFile.ts';
import { importConfigModule } from './common/importConfigModule.ts';

/** ESLint's flat-config filenames, in the priority order ESLint itself resolves them. */
export const ESLINT_CONFIG_FILENAMES = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  'eslint.config.mts',
  'eslint.config.cts',
] as const;

/**
 * Resolves and loads the ESLint flat config, either from an explicit path or by walking up for the first of
 * ESLint's config filenames. TypeScript configs load through Node's native loader (Node >=24).
 */
export async function resolveEslintConfig(configPath?: string): Promise<Linter.Config[]> {
  const filePath = configPath ?? findNearestFile(ESLINT_CONFIG_FILENAMES);
  if (!filePath) {
    throw new Error(`Could not find an ESLint config file (looked for ${ESLINT_CONFIG_FILENAMES.join(', ')}).`);
  }

  const mod = await importConfigModule(path.resolve(filePath));
  assertIsConfig(mod);
  return mod.default;
}

function assertIsConfig(mod: unknown): asserts mod is { default: Linter.Config[] } {
  if (typeof mod !== 'object' || mod === null) {
    throw new TypeError('Expected module to be an object');
  }
  if (!('default' in mod)) {
    throw new TypeError('Expected module to have a default export');
  }
  if (!Array.isArray(mod.default)) {
    throw new TypeError('Expected config to be an array');
  }
  for (const item of mod.default) {
    if (typeof item !== 'object') {
      throw new TypeError('Expected config item to be an object');
    }
  }
}
