// The `./config` subpath entry, imported by config files that Node loads with native type stripping. It must never
// gain a value import — including an inline `import { type … }`, which leaves the specifier behind — so that a config
// file resolves this function and nothing else. `__tests__/defineConfig.unit.test.ts` enforces that.

import type { StrictLintConfig } from './types.ts';

export type { MaxSeverityMap, StrictLintConfig } from './types.ts';

/**
 * Types a strict-lint config at its definition site, so an editor completes its keys and rejects unknown ones. The
 * config is returned unchanged: `loadStrictLintConfigs` is the sole validator, so a config authored with this helper
 * and one authored without it fail identically.
 *
 * Not generic on purpose. A `<T extends StrictLintConfig>` signature infers `T` from the literal, which suppresses
 * excess-property checking and lets a misspelled key through.
 */
export function defineConfig(config: StrictLintConfig): StrictLintConfig {
  return config;
}
