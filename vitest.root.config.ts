import { defineRootVitestConfig } from '@williamthorsen/nmr/vitest';

import { excludedTestDirs } from './.config/test-scope.ts';

// Vitest configuration for the monorepo's root-level tests, which exclude workspace tests.
export default defineRootVitestConfig({ monorepoRoot: import.meta.dirname, testCollectionExclude: excludedTestDirs });
