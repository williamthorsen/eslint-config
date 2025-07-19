/* eslint n/no-process-exit: off */
/* eslint unicorn/no-process-exit: off */

import { isObject } from '@williamthorsen/toolbelt.objects';

import packageJson from '../package.json' with { type: 'json' };

function isStringRecord(value: unknown): value is Record<string, string> {
  return isObject(value) && Object.values(value).every((v) => typeof v === 'string');
}

const overrides =
  isObject(packageJson.pnpm) && isStringRecord(packageJson.pnpm.overrides) ? packageJson.pnpm.overrides : {};

if (Object.keys(overrides).length === 0) {
  process.exit(0);
}

console.warn('🔒 WARN: pnpm overrides are active! Check whether these are still needed:');
for (const [name, version] of Object.entries(overrides)) {
  if (typeof version !== 'string') continue; // type guard only
  console.warn(`- ${name} → ${version}`);
}
