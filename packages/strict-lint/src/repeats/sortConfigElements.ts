import { isDeepStrictEqual } from 'node:util';

import type { Linter } from 'eslint';

/** The separator `defineConfig` places between the segments of a name it generates while expanding `extends`. */
const EXTENDS_LABEL_SEPARATOR = ' > ';

/** A consumer's rule-bearing config elements, grouped by whether their settings can be attributed to the consumer. */
export interface SortedConfigElements {
  own: Linter.Config[];
  unsortable: Linter.Config[];
}

/**
 * Sorts a consumer's config elements into the consumer's own and the unsortable, dropping the shared ones and every
 * element that sets no rule. An element setting no rule resolves no rule value, so the side it lands on cannot change
 * an answer.
 */
export function sortConfigElements(
  consumerElements: readonly Linter.Config[],
  sharedElements: readonly Linter.Config[],
): SortedConfigElements {
  const sharedIdentities = new Set(sharedElements);
  const sharedRuleBearers = sharedElements.filter((element) => element.rules !== undefined);

  const own: Linter.Config[] = [];
  const unsortable: Linter.Config[] = [];

  for (const element of consumerElements) {
    if (element.rules === undefined || sharedIdentities.has(element)) {
      continue;
    }
    const isExpansion = hasExtendsLabel(element);
    if (sharedRuleBearers.some((shared) => isRestatementOf(element, shared, isExpansion))) {
      continue;
    }
    if (isExpansion) {
      unsortable.push(element);
    } else {
      own.push(element);
    }
  }

  return { own, unsortable };
}

// region | Helpers

/** Whether the element carries a name `defineConfig` generated while expanding an `extends`. */
function hasExtendsLabel(element: Linter.Config): boolean {
  return typeof element.name === 'string' && element.name.includes(EXTENDS_LABEL_SEPARATOR);
}

/**
 * Whether a consumer element restates a shared one rather than configuring anything of the consumer's own.
 *
 * An expansion is matched on its `rules` alone: `defineConfig` rebuilds what it reaches through `extends`, merging the
 * extending config's scope into each element, so the scope it carries is the consumer's while the rules are the shared
 * config's. Every other element must match scope too, or a literal that narrows a shared setting to a subset of its
 * files would be taken for the shared element itself and never compared.
 */
function isRestatementOf(element: Linter.Config, shared: Linter.Config, isExpansion: boolean): boolean {
  if (!isDeepStrictEqual(element.rules, shared.rules)) {
    return false;
  }
  return (
    isExpansion ||
    (isDeepStrictEqual(element.files, shared.files) && isDeepStrictEqual(element.ignores, shared.ignores))
  );
}

// endregion | Helpers
