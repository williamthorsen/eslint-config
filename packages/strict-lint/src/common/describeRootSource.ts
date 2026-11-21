import type { ProjectRoot } from '@williamthorsen/toolbelt.packaging/candidate';

/** Describes how the project root was chosen: by a marker file, or by one of the fallbacks. */
export function describeRootSource(projectRoot: ProjectRoot): string {
  if (projectRoot.source === 'marker') {
    return `marker: ${projectRoot.marker}`;
  }
  return projectRoot.source === 'package-json'
    ? 'nearest package.json'
    : 'no project marker; using the start directory';
}
