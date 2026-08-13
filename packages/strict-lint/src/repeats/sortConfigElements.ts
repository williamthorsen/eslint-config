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
  const sharedRuleSets = sharedElements.map((element) => element.rules).filter((rules) => rules !== undefined);

  const own: Linter.Config[] = [];
  const unsortable: Linter.Config[] = [];

  for (const element of consumerElements) {
    if (element.rules === undefined || sharedIdentities.has(element)) {
      continue;
    }
    // `defineConfig` rebuilds the elements it reaches through `extends`, so an expansion of a shared config matches by
    // neither reference nor name. Its `rules` object survives the rebuild intact, which is what identifies it.
    if (sharedRuleSets.some((rules) => isDeepStrictEqual(rules, element.rules))) {
      continue;
    }
    if (hasExtendsLabel(element)) {
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

// endregion | Helpers
