import type { Linter } from 'eslint';

/**
 * Projects each element to a copy carrying no `rules`. Both sides of a comparison receive the projection of the whole
 * config, so a rule id resolves on whichever side names it; without it, a side naming a rule whose plugin the other
 * side registers cannot resolve the plugin at all. An element left with no keys is dropped.
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
