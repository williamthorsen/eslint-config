import type { TSESLint } from '@typescript-eslint/utils';
import type { ESLint } from 'eslint';

/**
 * Function to isolate the type assertion needed to expose typescript-eslint-authored rules
 * as ESLint core rules. `@typescript-eslint/utils` still types `RuleContext` with members
 * ESLint 10 removed (`parserPath`, `getAncestors`, and others), so its `RuleModule` is not
 * assignable to core's `RuleDefinition` even though the rules run correctly under ESLint 10.
 * The `LooseRuleDefinition` parameter keeps the input rule-shaped (each value must expose a
 * `create` function), so the assertion narrows only the `RuleContext` axis the comment describes.
 */
export function ensurePluginRules(
  rules: Record<string, TSESLint.LooseRuleDefinition>,
): NonNullable<ESLint.Plugin['rules']> {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- see comment above
  return rules as NonNullable<ESLint.Plugin['rules']>;
}
