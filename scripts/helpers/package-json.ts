/**
 * Package.json file utilities
 */

import { readFileSync, writeFileSync } from 'node:fs';

import { isObject } from '@williamthorsen/toolbelt.objects';

export interface PackageJson {
  name?: string;
  packageManager?: string;
  version: string;
  [key: string]: unknown;
}

export function isPackageJson(obj: unknown): obj is PackageJson {
  return isObject(obj) && typeof obj.version === 'string';
}

export function readPackageJson(filepath: string): PackageJson {
  try {
    const content = readFileSync(filepath, 'utf8');
    const parsed: unknown = JSON.parse(content);
    if (!isPackageJson(parsed)) {
      throw new Error(`Invalid package.json format: ${filepath}`);
    }
    return parsed;
  } catch (error) {
    throw new Error(
      `Failed to read package.json: ${filepath}\n${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function writePackageJson(filepath: string, pkg: PackageJson): void {
  try {
    const content = JSON.stringify(pkg, null, 2) + String.raw`\n`;
    writeFileSync(filepath, content);
  } catch (error) {
    throw new Error(
      `Failed to write package.json: ${filepath}\n${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
