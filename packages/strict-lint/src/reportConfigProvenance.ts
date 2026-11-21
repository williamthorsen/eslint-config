import type { ProjectRoot } from '@williamthorsen/toolbelt.packaging/candidate';

import { describeRootSource } from './common/describeRootSource.ts';
import type { StrictLintCascade } from './loadStrictLintConfigs.ts';

/** Reports where the ceilings came from, on stderr, so that the report stays clear of the formatter output. */
export function reportConfigProvenance(cascades: ReadonlyMap<string, StrictLintCascade>): void {
  if (cascades.size === 0) {
    console.error('strict-lint: no files were linted, so no config was resolved');
    return;
  }

  for (const projectRoot of listDistinctProjectRoots(cascades)) {
    console.error(`strict-lint: project root ${projectRoot.rootDir} (${describeRootSource(projectRoot)})`);
  }

  for (const group of groupByConfigFiles(cascades)) {
    if (group.filePaths.length === 0) {
      console.error(`strict-lint: no config file found for ${describeDirs(group.dirs)}`);
    } else {
      console.error(`strict-lint: config files for ${describeDirs(group.dirs)}, lowest precedence first:`);
      for (const filePath of group.filePaths) {
        console.error(`strict-lint:   ${filePath}`);
      }
    }
    if (group.stoppedByPredicate) {
      console.error('strict-lint: ascent stopped by shouldIgnoreAncestors');
    }
  }
}

// region | Helpers

/** How many directories a provenance line names before it collapses the rest into a count. */
const MAX_REPORTED_DIRS = 3;

/** The directories sharing one resolved set of ceiling config files. */
interface CascadeGroup {
  dirs: string[];
  filePaths: string[];
  stoppedByPredicate: boolean;
}

/** Names the directories that a cascade governs, collapsing a long tail into a count to keep one group on one line. */
function describeDirs(dirs: readonly string[]): string {
  const shown = dirs.slice(0, MAX_REPORTED_DIRS).join(', ');
  const remaining = dirs.length - MAX_REPORTED_DIRS;
  return remaining > 0 ? `${shown} (and ${String(remaining)} more)` : shown;
}

/**
 * Collapses the per-directory walks into one entry per distinct outcome. A monorepo resolves one cascade per
 * directory containing linted files, but only a handful of distinct config sets, and the report names those.
 */
function groupByConfigFiles(cascades: ReadonlyMap<string, StrictLintCascade>): CascadeGroup[] {
  const groups = new Map<string, CascadeGroup>();
  for (const [dir, cascade] of cascades) {
    // Reverse to lowest precedence first, the order in which the report prints them.
    const filePaths = cascade.entries.toReversed().map((entry) => entry.filePath);
    const key = `${cascade.stopReason}\n${filePaths.join('\n')}`;
    const group = groups.get(key);
    if (group) {
      group.dirs.push(dir);
    } else {
      groups.set(key, { dirs: [dir], filePaths, stoppedByPredicate: cascade.stopReason === 'predicate' });
    }
  }
  return groups.values().toArray();
}

/** Lists the distinct project roots at which the walks stopped: A run spanning one repository reports exactly one. */
function listDistinctProjectRoots(cascades: ReadonlyMap<string, StrictLintCascade>): ProjectRoot[] {
  const roots = new Map<string, ProjectRoot>();
  for (const cascade of cascades.values()) {
    roots.set(cascade.projectRoot.rootDir, cascade.projectRoot);
  }
  return roots.values().toArray();
}

// endregion | Helpers
