import type { TSESLint } from '@typescript-eslint/utils';
import type { ESLint } from 'eslint';

/**
 * Exposes typescript-eslint-authored rules as ESLint core rules, confining the type assertion to one site.
 * `@typescript-eslint/utils` still types `RuleContext` with members removed by ESLint 10 (`parserPath`,
 * `getAncestors`, and others), so its `RuleModule` is not assignable to core's `RuleDefinition` even though
 * the rules run correctly under ESLint 10. The `LooseRuleDefinition` parameter keeps the input rule-shaped
 * (each value must expose a `create` function), so the assertion narrows only the `RuleContext` axis.
 */
export function ensurePluginRules(
  rules: Record<string, TSESLint.LooseRuleDefinition>,
): NonNullable<ESLint.Plugin['rules']> {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- see comment above
  return rules as NonNullable<ESLint.Plugin['rules']>;
}
