import { isDeepStrictEqual } from 'node:util';

import { ESLint, type Linter } from 'eslint';

import { isRecord } from '../common/isRecord.ts';
import { buildPluginScaffold } from './buildPluginScaffold.ts';
import { sortConfigElements } from './sortConfigElements.ts';

/** A rule the consumer's own config sets to the value the shared config already resolves. */
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
 * both sides set to an equal value. ESLint performs all glob expansion, `files` scoping, and last-wins ordering,
 * because the question is asked per real file rather than reconstructed from patterns.
 *
 * An element that sorts to neither side stops the comparison: attributing it wrongly would invite a finding against a
 * setting the consumer never wrote, so the elements are named instead and nothing is reported.
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

  // A rule repeating on only some of the files the consumer sets it for is load-bearing on the rest, so deleting the
  // entry that repeats would change them. Only a rule redundant everywhere the consumer sets it is safe to report.
  const repeatedRules = [...repeatFileCounts]
    .filter(([ruleId, fileCount]) => fileCount === ownFileCounts.get(ruleId))
    .map(([ruleId, fileCount]) => ({ fileCount, ruleId }))
    .toSorted((a, b) => a.ruleId.localeCompare(b.ruleId));

  return { repeatedRules, unsortableLabels: [] };
}

// region | Helpers

/** Builds an instance resolving one side of the comparison, with the whole config's plugin registrations beneath it. */
function createInstance(cwd: string, scaffold: Linter.Config[], side: readonly Linter.Config[]): ESLint {
  return new ESLint({ baseConfig: [...scaffold, ...side], cwd, overrideConfigFile: true });
}

/** Names an element for a diagnostic, falling back to the keys it carries when it has no name. */
function describeElement(element: Linter.Config): string {
  return element.name ?? `unnamed config carrying ${Object.keys(element).toSorted().join(', ')}`;
}

/**
 * The rules one side resolves for a file. ESLint returns them normalized to `[severity, ...options]` with schema
 * defaults filled in, which is what lets `'error'`, `2`, and `['error']` compare as one value without further work.
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
