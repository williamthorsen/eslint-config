import path from 'node:path';

import { RuleTester, type RunTests } from '@typescript-eslint/rule-tester';
import type { RuleModule } from '@typescript-eslint/utils/ts-eslint';
import { afterAll, describe, it } from 'vitest';

import { type CaseTypeError, findCaseTypeErrors, type RuleTestCase } from './findCaseTypeErrors.ts';

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
  return new TypecheckedRuleTester({
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

// Renders the offending cases as the one message a failing suite reports.
export function formatCaseTypeErrors(ruleName: string, errors: readonly CaseTypeError[]): string {
  const details = errors.map((error) =>
    [`${error.label}: ${error.code}`, ...error.messages.map((message) => `  ${message}`)].join('\n'),
  );
  return `${ruleName}: the following cases do not typecheck under the rule fixture's compilerOptions.\n\n${details.join('\n\n')}`;
}

// region | Helpers

// Labels each case by the list and position it occupies, which is how a failure points back at the source.
function toTypecheckedCases<MessageIds extends string, Options extends readonly unknown[]>(
  tests: RunTests<MessageIds, Options>,
): RuleTestCase[] {
  return [
    ...tests.valid.map((test, index) => ({
      code: typeof test === 'string' ? test : test.code,
      label: `valid[${index}]`,
    })),
    ...tests.invalid.map((test, index) => ({ code: test.code, label: `invalid[${index}]` })),
  ];
}

// A tester that also holds every case to the fixture program. A case referencing a shape the program does not declare
// typechecks as `any`, on which a type-aware rule returns early, so the case can pass while exercising none of the
// behavior it names.
class TypecheckedRuleTester extends RuleTester {
  override run<MessageIds extends string, Options extends readonly unknown[]>(
    ruleName: string,
    rule: RuleModule<MessageIds, Options>,
    tests: RunTests<MessageIds, Options>,
  ): void {
    it(`${ruleName}: every case typechecks`, () => {
      const errors = findCaseTypeErrors(toTypecheckedCases(tests));
      if (errors.length > 0) {
        throw new Error(formatCaseTypeErrors(ruleName, errors));
      }
    });

    super.run(ruleName, rule, tests);
  }
}

// endregion | Helpers
