import rule from '../no-undefined-with-number.ts';
import { RuleTester } from './ruleTester.ts';

// This rule is type-aware (it consults the TS type checker), so the tester needs a
// TS program. `projectService` with `allowDefaultProject` type-checks the inline
// code against the fixtures `tsconfig.json`.
const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ['*.ts*'],
      },
      tsconfigRootDir: import.meta.dirname + '/fixtures',
    },
  },
});

ruleTester.run('no-undefined-with-number', rule, {
  valid: [
    // Non-firing: the argument cannot be undefined
    'declare const value: number; Number(value);',
    // Non-firing: a string argument
    "Number('42');",
    // Non-firing: no argument at all
    'Number();',
  ],
  invalid: [
    {
      // Firing: a possibly-undefined argument
      code: 'declare const value: number | undefined; Number(value);',
      errors: [{ messageId: 'undefinedWithNumber' }],
    },
  ],
});
