import type { ExtendsElement } from '@eslint/config-helpers';

/**
 * Types a plugin config as an `ExtendsElement`, confining to one call site the type mismatch that
 * typescript-eslint recommends ignoring:
 * https://typescript-eslint.io/packages/typescript-eslint/#migrating-to-defineconfig
 */
export function ensureExtendsElement(config: Record<string, unknown>): ExtendsElement {
  return config;
}
