import type { ReleaseType } from '@williamthorsen/release-kit';
import { releasePrepareMono } from '@williamthorsen/release-kit';

import { config } from './release.config.ts';

const VALID_BUMP_TYPES: readonly ReleaseType[] = ['major', 'minor', 'patch'];

function isReleaseType(value: string): value is ReleaseType {
  const types: readonly string[] = VALID_BUMP_TYPES;
  return types.includes(value);
}

function parseArgs(): { dryRun: boolean; bumpOverride?: ReleaseType; only?: string[] } {
  const args = process.argv.slice(2);
  let dryRun = false;
  let bumpOverride: ReleaseType | undefined;
  let only: string[] | undefined;

  for (const arg of args) {
    if (arg === '--dry-run') dryRun = true;
    else if (arg.startsWith('--bump=')) {
      const value = arg.slice('--bump='.length);
      if (!isReleaseType(value)) {
        throw new Error(`Invalid bump type "${value}". Must be: ${VALID_BUMP_TYPES.join(', ')}`);
      }
      bumpOverride = value;
    } else if (arg.startsWith('--only=')) {
      only = arg.slice('--only='.length).split(',');
    }
  }

  return { dryRun, bumpOverride, only };
}

const { dryRun, bumpOverride, only } = parseArgs();

let effectiveConfig = config;
if (only) {
  const filtered = config.components.filter((c) => {
    const name = c.tagPrefix.replace(/-v$/, '');
    return only.includes(name);
  });
  effectiveConfig = { ...config, components: filtered };
}

releasePrepareMono(effectiveConfig, { dryRun, ...(bumpOverride ? { bumpOverride } : {}) });
