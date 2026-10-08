import { checkTestFileConventions } from '@williamthorsen/nmr/tests';

import { excludedTestDirs } from '../.config/test-scope.ts';

// eslint-disable-next-line vitest/require-hook -- the call declares the suite, whereas the rule reads it as setup work.
checkTestFileConventions({ excludedBasenames: excludedTestDirs });
