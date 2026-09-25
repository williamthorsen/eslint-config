import { isDeepStrictEqual } from 'node:util';

import { ESLint, type Linter } from 'eslint';

import { isRecord } from '../common/isRecord.ts';
import { isRuleSeverity, toSeverityNumber } from '../common/severity.ts';
import { buildPluginScaffold } from './buildPluginScaffold.ts';
import { sortConfigElements } from './sortConfigElements.ts';

/** A rule that the consumer's own config sets to the value that the shared config already resolves. */
export interface RepeatedRule {
  fileCount: number;
  ruleId: string;
}

/** What the comparison found, or the elements that stopped it before it ran. */
export interface RepeatReport {
  repeatedRules: RepeatedRule[];
  unsortableLabels: string[];
}

export interface RepeatComparison {
  consumerElements: readonly Linter.Config[];
  cwd: string;
  filePaths: readonly string[];
  sharedElements: readonly Linter.Config[];
}

/**
 * Compares what the consumer's own config elements and the shared ones resolve for each file, reporting every rule
 * that both sides set to an equal value. ESLint performs all glob expansion, `files` scoping, and last-wins ordering,
 * because the comparison asks about each real file rather than reconstructing the answer from patterns.
 *
 * An element that sorts to neither side stops the comparison: attributing it wrongly would invite a finding against a
 * setting that the consumer never wrote, so the report names the elements instead and lists no repeated rule.
 */
export async function findRepeatedRules(comparison: RepeatComparison): Promise<RepeatReport> {
  const { consumerElements, cwd, filePaths, sharedElements } = comparison;
  const { own, unsortable } = sortConfigElements(consumerElements, sharedElements);

  if (unsortable.length > 0) {
    return { repeatedRules: [], unsortableLabels: unsortable.map(describeElement) };
  }

  const scaffold = buildPluginScaffold(consumerElements);
  const ownLint = createInstance(cwd, scaffold, own);
  const sharedLint = createInstance(cwd, scaffold, sharedElements);

  const ownFileCounts = new Map<string, number>();
  const repeatFileCounts = new Map<string, number>();
  const resolved = await Promise.all(
    filePaths.map(async (filePath) => ({
      own: await resolveRules(ownLint, filePath),
      shared: await resolveRules(sharedLint, filePath),
    })),
  );
  for (const { own: ownRules, shared: sharedRules } of resolved) {
    for (const [ruleId, value] of Object.entries(ownRules)) {
      ownFileCounts.set(ruleId, (ownFileCounts.get(ruleId) ?? 0) + 1);
      // A resolved rule is always an array, so `undefined` is the shared side leaving the rule unset.
      const sharedValue = sharedRules[ruleId];
      if (sharedValue !== undefined && isDeepStrictEqual(value, sharedValue)) {
        repeatFileCounts.set(ruleId, (repeatFileCounts.get(ruleId) ?? 0) + 1);
      }
    }
  }

  // Report only a rule that repeats on every file for which the consumer sets it: on the rest, deleting the repeating
  // entry would change the result. Never report a contested rule, whose file counts agree whenever the run lints one
  // scope alone.
  const contested = findContestedRules(own);
  const repeatedRules = [...repeatFileCounts]
    .filter(([ruleId, fileCount]) => fileCount === ownFileCounts.get(ruleId) && !contested.has(ruleId))
    .map(([ruleId, fileCount]) => ({ fileCount, ruleId }))
    .toSorted((a, b) => a.ruleId.localeCompare(b.ruleId));

  return { repeatedRules, unsortableLabels: [] };
}

// region | Helpers

/**
 * Reduces a rule entry to `[severity, ...options]` with a numeric severity, the form that two entries must share
 * before a comparison can tell one setting from two. ESLint applies the same reduction to what it resolves.
 */
function canonicalizeRuleEntry(entry: unknown): unknown[] {
  const [severity, ...options] = isUnknownArray(entry) ? entry : [entry];
  return [isRuleSeverity(severity) ? toSeverityNumber(severity) : severity, ...options];
}

/** Builds an ESLint instance that resolves one side of the comparison over the whole config's plugin registrations. */
function createInstance(cwd: string, scaffold: Linter.Config[], side: readonly Linter.Config[]): ESLint {
  return new ESLint({ baseConfig: [...scaffold, ...side], cwd, overrideConfigFile: true });
}

/** Names an element for a diagnostic, falling back to its keys when it has no name. */
function describeElement(element: Linter.Config): string {
  return element.name ?? `unnamed config carrying ${Object.keys(element).toSorted().join(', ')}`;
}

/**
 * Finds the rules that the consumer's own elements set to more than one value. Whether such a rule is redundant
 * depends on which element wins for a given file, which the files linted by one run cannot settle.
 */
function findContestedRules(own: readonly Linter.Config[]): Set<string> {
  const valuesByRule = new Map<string, unknown[]>();
  for (const element of own) {
    const entries = Object.entries(element.rules ?? {});
    for (const [ruleId, entry] of entries) {
      const value = canonicalizeRuleEntry(entry);
      const values = valuesByRule.get(ruleId) ?? [];
      if (values.every((seen) => !isDeepStrictEqual(seen, value))) {
        values.push(value);
      }
      valuesByRule.set(ruleId, values);
    }
  }
  return new Set([...valuesByRule].filter(([, values]) => values.length > 1).map(([ruleId]) => ruleId));
}

/** Checks whether a value is an array, narrowing to `unknown[]`, whereas `Array.isArray` narrows to `any[]`. */
function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Returns the rules that one side resolves for a file. ESLint normalizes them to `[severity, ...options]` with schema
 * defaults filled in, so `'error'`, `2`, and `['error']` compare as one value without further work.
 */
async function resolveRules(eslint: ESLint, filePath: string): Promise<Record<string, unknown>> {
  const config: unknown = await eslint.calculateConfigForFile(filePath);
  if (!isRecord(config)) {
    return {};
  }
  const { rules } = config;
  return isRecord(rules) ? rules : {};
}

// endregion | Helpers
