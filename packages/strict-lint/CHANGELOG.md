# @williamthorsen/strict-lint

## 5.3.0

### Minor Changes

- Upgrade all deps to latest version

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

### Patch Changes

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
