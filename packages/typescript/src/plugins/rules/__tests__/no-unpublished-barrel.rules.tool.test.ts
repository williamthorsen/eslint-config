import path from 'node:path';

import rule from '../no-unpublished-barrel.ts';
import { RuleTester } from './ruleTester.ts';

const ruleTester = new RuleTester();

ruleTester.run('no-unpublished-barrel', rule, {
  valid: [
    {
      // Non-firing: the root entry point a conditional `exports` names
      code: "export * from './a.ts';",
      filename: fixtureFile('conditional-exports', 'src/index.ts'),
    },
    {
      // Non-firing: a subpath entry point the same map names
      code: "export * from './a.ts';",
      filename: fixtureFile('conditional-exports', 'src/configs/index.ts'),
    },
    {
      // Non-firing: the bare-string `exports` form names its target without a condition
      code: "export * from './a.ts';",
      filename: fixtureFile('string-exports', 'src/index.ts'),
    },
    {
      // Non-firing: a package publishing through `main` alone still has an entry point
      code: "export * from './a.ts';",
      filename: fixtureFile('legacy-main', 'src/index.ts'),
    },
    {
      // Non-firing: the option maps the source onto a build directory other than the default
      code: "export * from './a.ts';",
      filename: fixtureFile('custom-out-dir', 'src/index.ts'),
      options: [{ outDir: 'build' }],
    },
    {
      // Non-firing: fixture scaffolding ships nothing
      code: "export * from './a.ts';",
      filename: fixtureFile('conditional-exports', 'src/__fixtures__/index.ts'),
    },
    {
      // Non-firing: mock scaffolding ships nothing
      code: "export * from './a.ts';",
      filename: fixtureFile('conditional-exports', 'src/__mocks__/index.ts'),
    },
    {
      // Non-firing: test scaffolding ships nothing
      code: "export * from './a.ts';",
      filename: fixtureFile('conditional-exports', 'src/__tests__/index.ts'),
    },
    {
      // Non-firing: test-helper scaffolding ships nothing
      code: "export * from './a.ts';",
      filename: fixtureFile('conditional-exports', 'src/test-utils/index.ts'),
    },
    {
      // Non-firing: a file that defines something is not a barrel, wherever it sits
      code: "export const a = 1;\nexport * from './b.ts';",
      filename: fixtureFile('conditional-exports', 'src/utils/index.ts'),
    },
    {
      // Non-firing: a side-effect import gives the file a purpose beyond re-exporting
      code: "import './setup.ts';\nexport * from './a.ts';",
      filename: fixtureFile('conditional-exports', 'src/utils/index.ts'),
    },
    {
      // Non-firing: a source-less export naming a binding the file defines is not a re-export
      code: "import { a } from './a.ts';\nconst b = 2;\nexport { a, b };",
      filename: fixtureFile('conditional-exports', 'src/utils/index.ts'),
    },
    {
      // Non-firing: re-exporting an imported binding as the default, at a published entry point
      code: "import a from './a.ts';\nexport default a;",
      filename: fixtureFile('conditional-exports', 'src/index.ts'),
    },
    {
      // Non-firing: a type-only re-export is still a re-export, and this one is published
      code: "export type * from './types.ts';",
      filename: fixtureFile('conditional-exports', 'src/index.ts'),
    },
    {
      // Non-firing: a declaration file is already an emitted form, so it keeps its extension
      code: "export * from './a.ts';",
      filename: fixtureFile('conditional-exports', 'src/index.d.ts'),
    },
  ],
  invalid: [
    {
      // Firing: a barrel below the published entry points
      code: "export * from './a.ts';",
      filename: fixtureFile('conditional-exports', 'src/utils/index.ts'),
      errors: [{ messageId: 'unpublishedBarrel', data: { target: 'dist/esm/utils/index.js' } }],
    },
    {
      // Firing: detection is by content, so a re-export hub under any name reports
      code: "export type * from './a.ts';",
      filename: fixtureFile('conditional-exports', 'src/types.ts'),
      errors: [{ messageId: 'unpublishedBarrel', data: { target: 'dist/esm/types.js' } }],
    },
    {
      // Firing: the named re-export form reports like the star form
      code: "export { a } from './a.ts';",
      filename: fixtureFile('conditional-exports', 'src/utils/index.ts'),
      errors: [{ messageId: 'unpublishedBarrel', data: { target: 'dist/esm/utils/index.js' } }],
    },
    {
      // Firing: a default re-export below the published entry points
      code: "import a from './a.ts';\nexport default a;",
      filename: fixtureFile('conditional-exports', 'src/utils/index.ts'),
      errors: [{ messageId: 'unpublishedBarrel', data: { target: 'dist/esm/utils/index.js' } }],
    },
    {
      // Firing: a manifest naming no entry point publishes nothing
      code: "export * from './a.ts';",
      filename: fixtureFile('no-entries', 'src/index.ts'),
      errors: [{ messageId: 'unpublishedBarrel', data: { target: 'dist/esm/index.js' } }],
    },
    {
      // Firing: `main` names one entry point, not every path below it
      code: "export * from './a.ts';",
      filename: fixtureFile('legacy-main', 'src/utils/index.ts'),
      errors: [{ messageId: 'unpublishedBarrel', data: { target: 'dist/esm/utils/index.js' } }],
    },
    {
      // Firing: a mapping the package does not build to reports its own entry point, loudly
      code: "export * from './a.ts';",
      filename: fixtureFile('custom-out-dir', 'src/index.ts'),
      errors: [{ messageId: 'unpublishedBarrel', data: { target: 'dist/esm/index.js' } }],
    },
    {
      // Firing: a file outside the source directory is never built, so nothing publishes it
      code: "export * from './a.ts';",
      filename: fixtureFile('conditional-exports', 'scripts/index.ts'),
      errors: [{ messageId: 'unbuiltBarrel', data: { sourceDir: 'src' } }],
    },
  ],
});

// region | Helper functions

/** Builds the path of a file inside one of this rule's fixture packages. */
function fixtureFile(fixturePackage: string, relativePath: string): string {
  return path.join(import.meta.dirname, '../../../../__fixtures__/no-unpublished-barrel', fixturePackage, relativePath);
}

// endregion | Helper functions
