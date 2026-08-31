# Migrating ESLint configs to TypeScript

An `eslint.config.js` is type-checked by nothing: a misspelled `files` key or a malformed `languageOptions` block becomes lint config that silently fails to apply. ESLint 10 loads `eslint.config.ts` natively through `jiti`, so renaming the config brings it into the compiler and the project service, where those mistakes surface as errors.

The [readiness kit](../packages/typescript/README.md#checking-your-configuration) reports the two tsconfig prerequisites steps 5 and 6 name, and errors when a `.js` config shares a directory with a `.ts` one: the loaders resolve the JavaScript basename first, so the TypeScript config never runs.

## Prerequisites

- **ESLint 10.** Earlier majors do not load a TypeScript config.
- **`@williamthorsen/strict-lint` 8**, if the repo runs `nmr lint:strict`. Version 7 finds only `eslint.config.js`.
- **`@williamthorsen/eslint-config-typescript` 7**, if any config composes `createConfig.*` with `defineConfig`. v7's factories return types assignable to `defineConfig`; v6's do not.

## Steps

1. **Declare `jiti`** if it is not already resolvable. ESLint loads a TypeScript config through it but declares it an optional peer, so pnpm does not install it on ESLint's behalf:

   ```shell
   pnpm add --save-dev jiti
   ```

2. **Rename each `eslint.config.js` to `eslint.config.ts`,** and delete the `.js`. Leaving both in one directory makes the `.js` win by precedence, so the `.ts` is dead weight the kit reports as an error.

3. **Type the config with `defineConfig`** from `eslint/config`, dropping any `@type {import('eslint').Linter.Config[]}` JSDoc it replaces. Express a standalone ignores block as `globalIgnores([...])` so its meaning stays a global ignore rather than a per-file filter:

   ```ts
   import { defineConfig, globalIgnores } from 'eslint/config';
   import config from '@williamthorsen/eslint-config-typescript';

   export default defineConfig(...config, globalIgnores(['**/dist/**']), {
     files: ['**/*.ts'],
     languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } },
   });
   ```

4. **Keep the config to erasable TypeScript syntax.** A `.ts` config is read by two loaders that disagree on what TypeScript means: ESLint through `jiti`, which compiles, and strict-lint through Node's native type stripping, which only erases. An `enum`, a value-holding namespace, or a parameter property loads under one and fails the other with `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`. Type annotations, `interface`, `type`, and `import type` are all safe.

5. **Point cross-config imports at the `.ts` file.** A workspace config importing the root config keeps a working specifier only as `'../../eslint.config.ts'`: `jiti` substitutes a `.js` specifier to the `.ts` file, but strict-lint's native loader does not. That specifier needs `allowImportingTsExtensions` in the tsconfig owning the importing file, which TypeScript accepts only alongside `noEmit`, `emitDeclarationOnly`, or `rewriteRelativeImportExtensions`. The last of the three permits the import on its own, rewriting the extension as it emits. Module resolution decides nothing here: `bundler` raises the same TS5097 as `nodenext` does. A type-only import is exempt, needing no option at all.

6. **Add the new config to any `tsconfig.json` naming its siblings one by one** rather than reaching them by a `*.ts` glob. A package whose `files` or `include` enumerates `vite.config.ts`, `vitest.config.ts`, and the like must gain `eslint.config.ts`, or the project service rejects the file. Prefer replacing the enumeration with `*.ts`, which carries the next config file to arrive as well; appending the one file leaves the next arrival to fail the same way.

7. **Reinstall** and commit the lockfile:

   ```shell
   pnpm install
   ```

## Verify

```shell
pnpm exec nmr check
```

Both `nmr lint` and `nmr typecheck` should pass from the repo root and every package. To confirm the rename changed no effective rule, diff `pnpm exec eslint --print-config <file>` for a representative file before and after; the output should be identical.
