import type { Linter } from 'eslint';

/**
 * Every severity ESLint accepts, in the order diagnostics report them. This is the single definition of the
 * vocabulary: the type guard and the diagnostic text both read it, so a message can never list a value the guard
 * rejects.
 */
const RULE_SEVERITIES: readonly Linter.RuleSeverity[] = ['off', 'warn', 'error', 0, 1, 2];

const RULE_SEVERITY_SET: ReadonlySet<unknown> = new Set(RULE_SEVERITIES);

export function isRuleSeverity(value: unknown): value is Linter.RuleSeverity {
  return RULE_SEVERITY_SET.has(value);
}

/** The ceilings that leave promotion to `error` on the table; every other severity caps the rule below it. */
const PROMOTING_CEILINGS: ReadonlySet<Linter.RuleSeverity> = new Set<Linter.RuleSeverity>(['error', 2]);

/**
 * Whether a `maxSeverity` ceiling lets strict-lint promote its rule to an error. An absent ceiling and an `error`
 * ceiling give the same answer, so callers never have to distinguish "unlisted" from "listed at the top severity".
 */
export function allowsPromotion(ceiling: Linter.RuleSeverity | undefined): boolean {
  return ceiling === undefined || PROMOTING_CEILINGS.has(ceiling);
}

/** Renders the accepted vocabulary for a diagnostic, as `"off", "warn", "error", 0, 1, or 2`. */
export function formatRuleSeverities(): string {
  const rendered = RULE_SEVERITIES.map((severity) => (typeof severity === 'string' ? `"${severity}"` : severity));
  return `${rendered.slice(0, -1).join(', ')}, or ${String(rendered.at(-1))}`;
}
