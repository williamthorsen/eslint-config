import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';

// `RuleTester` reads `describe`/`it`/`afterAll` off the global scope, which Vitest
// populates only when `globals: true`. This repo's Vitest config does not enable
// globals, so wire the hooks explicitly. `describeSkip`/`itOnly`/`itSkip` derive
// from `describe.skip` / `it.only` / `it.skip`, which Vitest provides.
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

// eslint-disable-next-line unicorn/prefer-export-from -- re-export follows the static-hook wiring above
export { RuleTester };
