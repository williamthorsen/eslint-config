import { compareVersions } from 'readyup/check-utils';

// The first eslint major that loads a TypeScript config, below which a shadowed config is expected.
const ESLINT_TYPESCRIPT_FLOOR = '10.0.0';

/** Returns the reason to skip a check that needs eslint to load a TypeScript config, or false when it can. */
export function skipBelowTypeScriptConfigSupport(installed: string | undefined): false | string {
  if (installed === undefined) return 'eslint is not installed';
  return (
    compareVersions(installed, ESLINT_TYPESCRIPT_FLOOR) < 0 &&
    'eslint is below 10, which cannot load a TypeScript eslint config'
  );
}
