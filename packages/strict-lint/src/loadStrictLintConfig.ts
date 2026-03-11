import fs from 'node:fs';
import path from 'node:path';

import { tsImport } from 'tsx/esm/api';

import type { StrictLintConfig } from './types.ts';

export async function loadStrictLintConfig(eslintConfigDir: string): Promise<StrictLintConfig | undefined> {
  const configFilePath = path.join(eslintConfigDir, '.config/strict-lint.config.ts');

  if (!fs.existsSync(configFilePath)) {
    return undefined;
  }

  const mod: unknown = await tsImport(configFilePath, { parentURL: import.meta.url });
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
