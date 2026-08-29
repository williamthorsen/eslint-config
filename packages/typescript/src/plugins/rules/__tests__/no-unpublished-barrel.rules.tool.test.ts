import path from 'node:path';

import type { TestCaseError } from '@typescript-eslint/rule-tester';

import rule from '../no-unpublished-barrel.ts';
import { RuleTester } from '../test-utils/ruleTester.ts';

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
      // Non-firing: a subpath pattern publishes every path its `*` spans, `/` included
      code: "export * from './a.ts';",
      filename: fixtureFile('pattern-exports', 'src/configs/nested/index.ts'),
    },
    {
      // Non-firing: a literal target beside a pattern still matches on its own
      code: "export * from './a.ts';",
      filename: fixtureFile('pattern-exports', 'src/index.ts'),
    },
    {
      // Non-firing: a trailing-slash folder mapping publishes everything below it
      code: "export * from './a.ts';",
      filename: fixtureFile('folder-exports', 'src/configs/index.ts'),
    },
    {
      // Non-firing: a target naming the file's own source path publishes the source rather than a build of it
      code: "export * from './a.ts';",
      filename: fixtureFile('source-exports', 'src/mod.ts'),
    },
    {
      // Non-firing: a source-path pattern spans what a built-path pattern does, `/` included
      code: "export * from './a.ts';",
      filename: fixtureFile('source-exports', 'src/configs/nested/index.ts'),
    },
    {
      // Non-firing: a trailing-slash mapping onto source covers everything below it, as one onto a build does
      code: "export * from './a.ts';",
      filename: fixtureFile('source-exports', 'src/internal/index.ts'),
    },
    {
      // Non-firing: a named source path is published wherever it sits, `sourceDir` notwithstanding
      code: "export * from './a.ts';",
      filename: fixtureFile('root-source-exports', 'mod.ts'),
    },
    {
      // Non-firing: `exports` names this one, and it is what the manifest publishes
      code: "export * from './a.ts';",
      filename: fixtureFile('exports-with-legacy-main', 'src/index.ts'),
    },
    {
      // Non-firing: a package publishing through `main` alone still has an entry point
      code: "export * from './a.ts';",
      filename: fixtureFile('legacy-main', 'src/index.ts'),
    },
    {
      // Non-firing: `types` names the declaration entry the same manifest publishes
      code: "export * from './a.ts';",
      filename: fixtureFile('legacy-main', 'src/index.d.ts'),
    },
    {
      // Non-firing: `module` names the entry point where a manifest declares neither `exports` nor `main`
      code: "export * from './a.ts';",
      filename: fixtureFile('legacy-module-and-bin', 'src/index.ts'),
    },
    {
      // Non-firing: a `bin` target is published like any other
      code: "export * from './a.ts';",
      filename: fixtureFile('legacy-module-and-bin', 'src/bin/tool.ts'),
    },
    {
      // Non-firing: the option maps the source onto a build directory other than the default
      code: "export * from './a.ts';",
      filename: fixtureFile('custom-out-dir', 'src/index.ts'),
      options: [{ outDir: 'build' }],
    },
    {
      // Non-firing: the option also moves the source directory the mapping strips
      code: "export * from './a.ts';",
      filename: fixtureFile('string-exports', 'lib/index.ts'),
      options: [{ sourceDir: 'lib' }],
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
      // Non-firing: the same holds for a hoisted local, which the export declaration precedes
      code: "import { a } from './a.ts';\nexport { a, helper };\nfunction helper() {}",
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
      errors: [buildUnpublishedError('src/utils/index.ts', 'dist/esm/utils/index.js')],
    },
    {
      // Firing: detection is by content, so a re-export hub under any name reports
      code: "export type * from './a.ts';",
      filename: fixtureFile('conditional-exports', 'src/types.ts'),
      errors: [buildUnpublishedError('src/types.ts', 'dist/esm/types.js')],
    },
    {
      // Firing: the named re-export form reports like the star form
      code: "export { a } from './a.ts';",
      filename: fixtureFile('conditional-exports', 'src/utils/index.ts'),
      errors: [buildUnpublishedError('src/utils/index.ts', 'dist/esm/utils/index.js')],
    },
    {
      // Firing: a default re-export below the published entry points
      code: "import a from './a.ts';\nexport default a;",
      filename: fixtureFile('conditional-exports', 'src/utils/index.ts'),
      errors: [buildUnpublishedError('src/utils/index.ts', 'dist/esm/utils/index.js')],
    },
    {
      // Firing: a type expression wrapping the re-exported default is unwrapped before the check
      code: "import a from './a.ts';\nexport default a!;",
      filename: fixtureFile('conditional-exports', 'src/utils/index.ts'),
      errors: [buildUnpublishedError('src/utils/index.ts', 'dist/esm/utils/index.js')],
    },
    {
      // Firing: a manifest naming no entry point publishes nothing
      code: "export * from './a.ts';",
      filename: fixtureFile('no-entries', 'src/index.ts'),
      errors: [buildUnpublishedError('src/index.ts', 'dist/esm/index.js')],
    },
    {
      // Firing: `main` names one entry point, not every path below it
      code: "export * from './a.ts';",
      filename: fixtureFile('legacy-main', 'src/utils/index.ts'),
      errors: [buildUnpublishedError('src/utils/index.ts', 'dist/esm/utils/index.js')],
    },
    {
      // Firing: `main` is inert wherever `exports` is present, so its target is not published
      code: "export * from './a.ts';",
      filename: fixtureFile('exports-with-legacy-main', 'src/legacy/index.ts'),
      errors: [buildUnpublishedError('src/legacy/index.ts', 'dist/esm/legacy/index.js')],
    },
    {
      // Firing: a subpath pattern covers what it spans and no more
      code: "export * from './a.ts';",
      filename: fixtureFile('pattern-exports', 'src/utils/index.ts'),
      errors: [buildUnpublishedError('src/utils/index.ts', 'dist/esm/utils/index.js')],
    },
    {
      // Firing: a folder mapping covers its own prefix and no more
      code: "export * from './a.ts';",
      filename: fixtureFile('folder-exports', 'src/utils/index.ts'),
      errors: [buildUnpublishedError('src/utils/index.ts', 'dist/esm/utils/index.js')],
    },
    {
      // Firing: publishing source exempts the paths named and no others
      code: "export * from './a.ts';",
      filename: fixtureFile('source-exports', 'src/utils/index.ts'),
      errors: [buildUnpublishedError('src/utils/index.ts', 'dist/esm/utils/index.js')],
    },
    {
      // Firing: a mapping the package does not build to reports its own entry point, loudly
      code: "export * from './a.ts';",
      filename: fixtureFile('custom-out-dir', 'src/index.ts'),
      errors: [buildUnpublishedError('src/index.ts', 'dist/esm/index.js')],
    },
    {
      // Firing: a file outside the source directory is never built, so nothing publishes it
      code: "export * from './a.ts';",
      filename: fixtureFile('conditional-exports', 'scripts/index.ts'),
      errors: [{ messageId: 'unbuiltBarrel', data: { sourceDir: 'src', sourcePath: 'scripts/index.ts' } }],
    },
    {
      // Firing: publishing one source path leaves every other path in the package unbuilt and unpublished
      code: "export * from './a.ts';",
      filename: fixtureFile('root-source-exports', 'helpers/index.ts'),
      errors: [{ messageId: 'unbuiltBarrel', data: { sourceDir: 'src', sourcePath: 'helpers/index.ts' } }],
    },
  ],
});

// region | Helper functions

/**
 * Builds the error an `unpublishedBarrel` case expects. Both paths are stated literally rather than derived
 * from the rule's own mapping.
 */
function buildUnpublishedError(sourcePath: string, target: string): TestCaseError<'unpublishedBarrel'> {
  return { messageId: 'unpublishedBarrel', data: { sourcePath, target } };
}

/** Builds the path of a file inside one of this rule's fixture packages. */
function fixtureFile(fixturePackage: string, relativePath: string): string {
  return path.join(import.meta.dirname, '../../../../__fixtures__/no-unpublished-barrel', fixturePackage, relativePath);
}

// endregion | Helper functions
