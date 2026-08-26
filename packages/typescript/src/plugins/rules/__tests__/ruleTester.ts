import path from 'node:path';

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

// Builds a tester for type-aware rules, which need a TS program. `allowDefaultProject` routes the inline code to the
// default project, and `defaultProject` names the fixture `tsconfig.json` as that project; an unnamed default project
// is inferred, and carries TypeScript's own `compilerOptions` rather than the fixture's.
export function createTypedRuleTester(): RuleTester {
  return new RuleTester({
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.ts*'],
          defaultProject: 'tsconfig.json',
        },
        tsconfigRootDir: path.join(import.meta.dirname, '../../../../__fixtures__/rules'),
      },
    },
  });
}
