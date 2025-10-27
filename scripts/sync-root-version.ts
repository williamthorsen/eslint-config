/* eslint n/no-process-exit: off */
/* eslint unicorn/no-process-exit: off */

/**
 * Synchronize root package.json version with the highest published package version
 */

import { join } from 'node:path';

import rootPackageJson from '../package.json' with { type: 'json' };
import { readPackageJson, writePackageJson } from './helpers/package-json.ts';
import { getHighestVersion } from './helpers/version-utils.ts';

/**
 * Published packages that should influence root version
 */
const PUBLISHED_PACKAGES = ['@williamthorsen/eslint-config-typescript', '@williamthorsen/strict-lint'] as const;

function getPublishedPackageVersions(): Record<string, string> {
  const versions: Record<string, string> = {};

  const packageMap = {
    '@williamthorsen/eslint-config-typescript': 'packages/typescript',
    '@williamthorsen/strict-lint': 'packages/strict-lint',
  } as const;

  for (const packageName of PUBLISHED_PACKAGES) {
    const packageDir = packageMap[packageName];

    const packageJsonPath = join(packageDir, 'package.json');

    try {
      const pkg = readPackageJson(packageJsonPath);
      versions[packageName] = pkg.version;
      console.log(`Found ${packageName}@${pkg.version}`);
    } catch (error) {
      console.warn(
        `Could not read version for ${packageName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return versions;
}

function syncRootVersion(): void {
  console.log('Synchronizing root package version...');

  // Get published package versions
  const publishedVersions = getPublishedPackageVersions();

  if (Object.keys(publishedVersions).length === 0) {
    console.log('No published packages found, skipping synchronization');
    return;
  }

  // Find highest version
  const highest = getHighestVersion(publishedVersions);
  if (!highest) {
    console.log('Could not determine highest version');
    return;
  }

  console.log(`Highest version: ${highest.version} from ${highest.packageName}`);

  // Use imported root package.json
  const currentRootVersion = rootPackageJson.version;

  console.log(`Current root version: ${currentRootVersion}`);

  // Check if update is needed
  if (currentRootVersion === highest.version) {
    console.log('Root version is already up to date');
    return;
  }

  // Update root version
  const updatedPackageJson = { ...rootPackageJson, version: highest.version };
  writePackageJson('package.json', updatedPackageJson);

  console.log(`✓ Updated root version: ${currentRootVersion} → ${highest.version}`);
}

function main(): void {
  try {
    syncRootVersion();
  } catch (error) {
    console.error('Error synchronizing root version:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { getPublishedPackageVersions, syncRootVersion };
export { compareVersions, getHighestVersion } from './helpers/version-utils.ts';
