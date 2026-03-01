import type { ExtendsElement } from '@eslint/config-helpers';

/**
 * Function to isolate the type assertion needed to satisfy ESLint.
 * The recommendation of `typescript-eslint` is to ignore the type misaligment:
 * https://typescript-eslint.io/packages/typescript-eslint/#migrating-to-defineconfig
 * The override performed by this function is designed to have a small blast radius.
 */
export function ensureExtendsElement(config: Record<string, unknown>): ExtendsElement {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return config as ExtendsElement;
}
