# @williamthorsen/strict-lint

## 5.3.7

### Patch Changes

- ## @williamthorsen/eslint-config-typescript

  ### Features
  - Relax the complexity threshold from 11 to default

  ### Refactoring
  - Use explicit .ts extension
  - Adapt syntax and type annotations to satisfy stricter typing
  - Modernize plugin syntax

  ### Dependencies
  - Upgrade all deps to latest version
  - Add @eslint/config-helpers to dev deps

  ### Tooling
  - Remove fragile automatic compilation

## 5.3.6

### Patch Changes

Fixes the issue where all files other than `index.js` were missing from the distribution because they did not match any pattern in the `files` array of `package.json`.

## 5.3.5

### Fixes

Compiled `src/` files are missing from distribution.

Fixes the issue where `src/` source files were not being compiled to the `dist/esm/` directory because they did not match a pattern all files other than `index.js` were missing from the distribution because they did not match any pattern in the build config.

## 5.3.4

### Fixes

The `strict-lint` command is not found after build-step modernization.

## 5.3.3

### Refactoring

Replace all `.js` extensions with actual `.ts` extensions.

### Dependencies

Upgrade all dependencies to latest minor version.

## 5.3.2

### Dependencies

- Upgraded all dependencies to latest version

## 5.4.1

### Dependencies

- Upgraded all dependencies to latest version

## 5.3.0

### Dependencies

- Upgraded all dependencies to latest version

## 5.2.0

### Dependencies

- Upgraded all dependencies to latest version

## 5.0.2

### Tooling

- Replaced custom workspace scripts with the generic `run-workspace-script` script runner

## 4.0.0

### Dependencies

- Upgraded all dependencies to latest version

## 3.4.0

### Dependencies

- Upgraded all dependencies to latest version

## 3.3.0

### Dependencies

- Upgraded all dependencies to latest version

## 3.2.2

### Dependencies

- Upgraded all dependencies to latest version

## 3.2.1

### Dependencies

- Upgraded all dependencies to latest version

## 3.1.1

### Dependencies

- Upgraded all dependencies to latest minor version

## 3.0.0

### Refactoring

- Fixed lint identified when strict rules were enabled.

## 1.0.1

### Dependencies

- Upgraded all dependencies to latest version

### Refactoring

- Aligned types with upgraded dependencies

## 1.0.0

First stable release.

### Refactoring

- Removed shebangs `@esbuild-kit/esm-loader` shebang from scripts. These are now run by `tsx`.

### Dependencies

- Upgraded all dependencies to latest version
- Replaced `@esbuild-kit/esm-loader` with `tsx`.
-

## 0.17.0

### Dependencies

- Upgraded all dependencies to latest version

### Refactoring

- Removed the shims added to support the use of a flat config in `strictLint.ts`.\
  Because the flat config is now the default, the shims are no longer required.

## 0.12.1

### Patch Changes

- Upgraded all dependencies to latest version

## 0.12.0

### Minor Changes

- Simplify configs, upgrade dependencies

## 0.11.6

### Dependencies

- Upgraded all dependencies to latest version

## 0.11.5

### Dependencies

- Upgrade all dependies & runtimes to latest version

## 0.11.4

### Dependencies

- Upgraded all dependencies to latest version

## 0.11.3

### Patch Changes

- Removed the unneeded ESM loader from strict-lint script. The loader is needed to run TypeScript files but not to run the transpiled JavaScript script.

## 0.11.2

### Tooling

- Simplify build config & file structure

## 0.11.1

### Features

- Added the `strict-lint` script to the Node.js package

## 0.11.0

### Features

- Added `strict-lint` workspace to the monorepo
- Added the `strictLint` function, which wraps ESLint and treats all warnings as errors

### Dependencies

- Added `eslint` and `typescript` as dev dependencies

### Tooling

- Configured the package for distribution as a Node.js package
- Removed the `audit` check, which should now be performed only from the monorepo root
- Centralized the linter config in the monorepo root
