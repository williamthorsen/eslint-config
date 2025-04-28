# @williamthorsen/eslint-config-basic

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

## 1.0.0

First stable release.

### Refactoring

- Upgraded all dependencies to latest version

## 0.17.0

### Dependencies

- Upgraded all dependencies to latest version

## 0.16.0

### Dependencies

- Upgraded all dependencies except for `eslint` to latest version
- Upgraded `eslint` to latest v8.x (for compatibility with `@typescript-eslint` packages)

## 0.15.1

### Patch Changes

- Upgrade all dependencies to latest version

## 0.15.0

### Minor Changes

- Simplify configs, upgrade dependencies

## 0.14.2

### Fixes

Fixed the issue that `relativePathToDir` was finding the relative path to the target directory from the location of the `relativePathToDir.js` file instead of the caller's file.
The function now accepts a second argument specifying which directory should serve as the base directory.

## 0.14.1

### Fixes

Fixed the failure to include `relativePathToDir` helper function in the distribution bundle.

## 0.14.0

### Features

Added `relativePathToDir` helper function to assist in writing monorepo configs.

## 0.13.0

### Features

Aligned rules with Deno style:

- Changed `comma-brace` style from `stroustrup` to `1tbs`

## 0.12.5

### Dependencies

- Upgraded all dependencies to latest version

## 0.12.4

### Dependencies

- Upgraded all dependencies to latest version
- Closed vulnerability in the transitive dependency `semver`

## 0.12.2

### Dependencies

- Upgraded all dependies & runtimes to latest version

## 0.12.1

### Dependencies

- Upgraded all dependencies to latest version.

## 0.12.0

### Features

- Updated `package.json` ordering rules to align more closely with `json-sort-cli`.

### Dependencies

- Upgraded all dependencies to latest version

## 0.11.1

### Features

- Updated `package.json` ordering rules to align more closely with `json-sort-cli`

## 0.11.0

### Features

- Updated `package.json` ordering rules to align more closely with `json-sort-cli`

### Tooling

- Added strict linting to code checks
- Removed the `audit` check, which should now be performed only from the monorepo root
- Centralized the linter config in the monorepo root

## 0.10.11

### Dependencies

- Upgraded all dependencies to latest version

## 0.10.10

### Fixes

- Fixed skipping of scripts directories

## 0.10.9

### Dependencies

- Upgraded all dependencies to latest version

## 0.10.8

### Dependencies

- Upgraded all dependencies to latest version

## 0.10.7

### Dependencies

- Upgraded all dependencies to latest minor version

## 0.10.6

### Dependencies

- Upgraded dependencies to latest minor version
- Closed vulnerability in `yaml` package by forcing use of ^2.2.2 instead of 2.1.3

## 0.10.5

### Dependencies

- Upgraded all dependencies to latest version.

## 0.10.4

### Dependencies

- Upgraded all dependencies & runtimes to latest version.

## 0.10.3

### Dependencies

- Upgraded all dependencies to latest version

## 0.10.1

### Tooling

- Removed unneeded ignores

## 0.10.0

### Features

- Disabled `no-extra-parens` rule

## 0.9.1

### Dependencies

- Upgraded all dependencies to latest version

## 0.9.0

### BREAKING CHANGES

- Changed from ESLint nested config to ESLint flat config.

## 0.8.0

### Tooling

- Deprecation notice: Versions below v0.9.0 are deprecated.

## 0.7.5

### Refactoring

- Removed unused import plugin

## 0.7.4

### Dependencies

- Upgraded all dependencies to latest version

## 0.7.3

### Dependencies

- Upgraded dependencies

## 0.7.2

### Dependencies

- Upgraded dependencies

## 0.7.1

### Dependencies

- Upgraded dependencies

## 0.7.0

### Dependencies

- Upgraded dependencies

## 0.1.6

### Dependencies

- Upgraded dependencies
