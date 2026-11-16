import type { RepeatReport } from './findRepeatedRules.ts';

/**
 * Writes a comparison's outcome to stderr, where it stays clear of the formatter output and of the counts that decide
 * a run's exit code. It writes nothing for a comparison that found nothing, as a clean lint run does.
 */
export function reportRepeatedRules(report: RepeatReport, configName: string): void {
  const { repeatedRules, unsortableLabels } = report;

  if (unsortableLabels.length > 0) {
    console.error(
      `strict-lint: shared-config check skipped: ${formatCount(unsortableLabels.length, 'config element')} could not be sorted`,
    );
    for (const label of unsortableLabels) {
      console.error(`strict-lint:   ${label}`);
    }
    console.error("strict-lint: add each listed element's source config to sharedConfigs");
    return;
  }

  if (repeatedRules.length === 0) {
    return;
  }

  console.error(
    `strict-lint: ${configName} repeats the shared config for ${formatCount(repeatedRules.length, 'rule')}:`,
  );
  for (const { fileCount, ruleId } of repeatedRules) {
    console.error(`strict-lint:   ${ruleId} (${formatCount(fileCount, 'file')})`);
  }
}

// region | Helpers

/** Renders a count with its noun, pluralized by adding an `s`, which every noun that this reporter names accepts. */
function formatCount(count: number, noun: string): string {
  return `${String(count)} ${noun}${count === 1 ? '' : 's'}`;
}

// endregion | Helpers
