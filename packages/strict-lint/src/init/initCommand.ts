import path from 'node:path';

import { type FileReconciliation, reconcileFile } from '@williamthorsen/toolbelt.filesystem';
import { findProjectRoot } from '@williamthorsen/toolbelt.packaging';

import { describeRootSource } from '../common/describeRootSource.ts';
import { STRICT_LINT_CONFIG_NAME } from '../loadStrictLintConfigs.ts';
import { showInitUsage } from '../usage.ts';
import { canResolveStrictLint } from './canResolveStrictLint.ts';
import { CONFIG_TEMPLATE } from './configTemplate.ts';
import { parseInitArgs } from './parseInitArgs.ts';

/**
 * Scaffolds a strict-lint config in the working directory, returning the exit code the caller should exit with.
 * The command never refuses: a target the package cannot be imported from still gets its config, plus the install
 * step that would make the config load.
 */
export function runInit(argv: string[], targetDir: string): number {
  const { isDryRun, shouldOverwrite, shouldShowHelp } = parseInitArgs(argv);

  if (shouldShowHelp) {
    showInitUsage();
    return 0;
  }

  const filePath = path.join(targetDir, STRICT_LINT_CONFIG_NAME);

  const reconciliation = reconcileFile(filePath, CONFIG_TEMPLATE, {
    conflictPolicy: shouldOverwrite ? 'replace' : 'skip',
    isDryRun,
  });
  reportReconciliation(reconciliation, isDryRun);

  if (reconciliation.outcome === 'failed') {
    return 1;
  }

  reportProjectRoot(targetDir);

  if (!canResolveStrictLint(targetDir)) {
    console.info('\nInstall it so the config resolves: pnpm add -D @williamthorsen/strict-lint eslint');
  }

  return 0;
}

// region | Helpers

/** Reports where the config sits in the cascade, which is what tells the reader which files its ceilings govern. */
function reportProjectRoot(targetDir: string): void {
  const projectRoot = findProjectRoot(targetDir);
  const attribution = describeRootSource(projectRoot);
  console.info(
    `Ceilings merge from the project root at ${projectRoot.rootDir} (${attribution}) down to each linted file.`,
  );
}

/** Reports what the write did, in the outcome vocabulary `reconcileFile` returns. */
function reportReconciliation(reconciliation: FileReconciliation, isDryRun: boolean): void {
  const { filePath } = reconciliation;
  switch (reconciliation.outcome) {
    case 'created':
      console.info(isDryRun ? `Would create ${filePath}` : `Created ${filePath}`);
      break;
    case 'overwritten':
      console.info(isDryRun ? `Would overwrite ${filePath}` : `Overwrote ${filePath}`);
      break;
    case 'up-to-date':
      console.info(`${filePath} is already up to date`);
      break;
    case 'skipped': {
      const reason = reconciliation.error === undefined ? '' : ` (could not be read: ${reconciliation.error})`;
      console.info(`Kept the existing ${filePath}${reason}. Pass --force to overwrite it.`);
      break;
    }
    case 'failed':
      console.error(`Failed to write ${filePath}: ${reconciliation.error}`);
      break;
  }
}

// endregion | Helpers
