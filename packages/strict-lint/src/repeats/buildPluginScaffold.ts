import type { Linter } from 'eslint';

/**
 * Projects each element to a copy without `rules`, dropping any element left with no keys. Both sides of a comparison
 * receive the projection of the whole config, so that a rule id resolves on either side; without the scaffold, a side
 * naming a rule whose plugin only the other side registers cannot resolve the plugin.
 */
export function buildPluginScaffold(elements: readonly Linter.Config[]): Linter.Config[] {
  const scaffold: Linter.Config[] = [];
  for (const { rules, ...rest } of elements) {
    if (Object.keys(rest).length > 0) {
      scaffold.push(rest);
    }
  }
  return scaffold;
}
