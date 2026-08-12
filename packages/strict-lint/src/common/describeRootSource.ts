import type { ProjectRoot } from '@williamthorsen/toolbelt.packaging';

/** How the project root was chosen: by a marker file, or by one of the fallbacks. */
export function describeRootSource({ marker, source }: ProjectRoot): string {
  if (marker !== null) {
    return `marker: ${marker}`;
  }
  return source === 'package-json' ? 'nearest package.json' : 'no project marker; using the start directory';
}
