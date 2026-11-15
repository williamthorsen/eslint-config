import type { Linter } from 'eslint';
import type { Config } from 'eslint/config';

/**
 * Retypes configs as the `Linter.Config[]` that `new ESLint({ overrideConfig })` accepts, which models
 * `languageOptions` with a nominally-incompatible index signature. Only that constructor calls it, never
 * the factory results, whose assignability to `Config[]` the composability suite proves.
 */
export function toLinterConfigs(configs: readonly Config[]): Linter.Config[] {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- see comment above
  return configs as Linter.Config[];
}
