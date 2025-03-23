# @williamthorsen/eslint-config-typescript

## 3.2.2

### Dependencies

- Upgraded all dependencies to latest version

## 3.2.1

### Dependencies

- Upgraded all dependencies to latest version

## 3.1.1

### Dependencies

- Upgraded all dependencies to latest minor version

## 3.1.0

### Features

Rule changes:

- Reduced `@typescript-eslint/unbound-method` from `error` to `warn`
- Loosened `no-unused-vars` (for JavaScript files) to allow `_` prefix (same as corresponding TS rule)

### Refactoring

- Simplified the main configuration

### Dependencies

- Upgraded all dependencies to latest version

## 3.0.4

### Fixes

- Fixed the file extension of the primary export in the manifest, where it was wrongly specified to be `.mjs`

## 3.0.3

### Fixes

- Attempted to fix the issue where the exported utility `relativePathToDir` could not be resolved when imported

## 3.0.2

### Fixes

- Set the `index.js` file extension to `.mjs` in attempt to fix ESLint's failure to find module

## 3.0.1

### Fixes

- Fixed the issue that files were missing from the distribution bundle after the reconfiguration of exports.

## 3.0.0

### Breaking changes

- Changes in export structure may require import adjustments.
- Strict type-checked TypeScript rules are now enabled. (Previously, only recommended rules were enabled.)

### Features

- Enabled strict, type-checked rules

### Refactoring

- Modernize all configurations and rules

## 2.2.0

### Feature

- Improved rule priority for TS files

### Dependencies

- Upgraded all runtimes to latest version (Node pinned to v20)

## 2.1.1

### Fixes

- Fixed the issue where the distribution paths pointed to TypeScript files instead of transpiled JavaScript files

## 2.1.0

### Tooling

- Reconfigure exports to allow use of config file with explicit `.mjs` extension

## 2.0.0

### Major Changes

- Added new peer dependency: `typescript-eslint`

### Features

- Modernized ESLint configs and plugins: Rules are now ESLint recommended and Typescript recommended with type-checking

### Refactoring

- Converted all source files to TypeScript
- Replaced `@typescript-eslint/eslint-plugin` with `typescript-eslint`
- Replaced rules from `eslint` with rules from `@elint/js`

### Tooling

- Added support for publication to jsr.io

### Dependencies

- Upgraded all dependencies to latest version

## 1.0.0

First stable release.

### Refactoring

- Upgraded all dependencies to latest version

## 0.17.0

### Content

- Added `no-constant-condition` and `no-restricted-imports` to the rules for JavaScript files

### Dependencies

- Upgraded dependencies

## 0.16.0

### Dependencies

- Upgraded all dependencies except for `eslint` to latest version
- Upgraded `eslint` to latest v8.x (for compatibility with `@typescript-eslint` packages)

## 0.15.1

### Patch Changes

- Upgraded all dependencies to latest version

## 0.15.0

### Minor Changes

- Simplified configs, upgraded dependencies

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
- Changed `comma-dangle` style for functions and tuples to `always-multiline`, making it consistent with all other
  comma-dangle rules

## 0.12.5

### Dependencies

- Upgraded all dependencies to latest version

## 0.12.4

### Dependencies

- Upgraded all dependencies to latest version
- Closed vulnerability in the transitive dependency `semver`

## 0.12.3

### Dependencies

- Upgraded all dependies & runtimes to latest version

## 0.12.2

### Dependencies

- Upgraded all dependencies to latest version

## 0.12.1

### Dependencies

- Upgraded all dependencies to latest version

## 0.12.0

### Features

- Updated `package.json` ordering rules to align more closely with `json-sort-cli`.

### Dependencies

- Upgraded all dependencies to latest version

## 0.11.3

### Fixes

- Fixed an issue where the `tuples: "ignore"` setting in the `@typescript-eslint/comma-dangle` rule caused a `ruleListener not found` error when a tuple was encountered. The workaround was to set `tuples: "only-multiline"` in that rule.

## 0.11.2

### Dependencies

- Upgraded all dependencies to latest version

## 0.11.1

### Features

- Updated `package.json` ordering rules to align more closely with `json-sort-cli`.

## 0.11.0

### Features

- Updated `package.json` ordering rules to align more closely with `json-sort-cli`

## 0.10.11

### Features

- Updated `package.json` ordering rules to align more closely with `json-sort-cli`.

### Dependencies

- Upgraded all dependencies to latest version
- Removed unneeded `typescript` package and TS config

### Tooling

- Added strict linting to code checks
- Removed the `audit` check, which should now be performed only from the monorepo root
- Centralized the linter config in the monorepo root

## 0.10.10

### Tooling

- Fixed skipping of scripts directories

## 0.10.9

### Dependencies

- Upgraded all dependencies to latest version

## 0.10.8

### Dependencies

- Upgraded all dependencies to latest version

## 0.10.7

### Dependencies

- Upgrade all dependencies to latest minor version

## 0.10.6

### Dependencies

- Upgraded dependencies to latest minor version
- Closed vulnerability in `yaml` package by forcing use of ^2.2.2 instead of 2.1.3

## 0.10.5

### Dependencies

- Upgraded all dependencies to latest version

## Dependencies

### Dependencies

- Upgraded all dependencies & runtimes to latest version

## Dependencies

### Dependencies

- Upgraded all dependencies to latest version

## 0.10.2

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
- Renamed `@williamthorsen/eslint-config-typescript-flat` to `@williamthorsen/eslint-config-typescript`

## 0.8.0

### Tooling

- Deprecation notice: Versions below v0.9.0 are deprecated.

## 0.7.5

### Refactoring

- Removed unused import plugin

## 0.7.4

### Dependencies

- Upgrade all dependencies to latest version

## 0.7.3

### Dependencies

- Upgraded all dependencies to latest version

## 0.7.2

### Dependencies

- Upgraded all dependencies to latest version

## 0.7.1

### Dependencies

- Upgraded all dependencies to latest version

## 0.7.0

### Dependencies

- Upgraded dependencies

## 0.6.1

### Refactoring

- Replaced `sort-imports` with `simple-sort-imports`

## 0.6.0

### Refactoring

- Exported common ignore patterns

## 0.5.0

### Features

- Enforced use of braces for all control statements
  Disabled `no-use-before-define` in TypeScript files

## 0.4.1

### Fixes

- Removed erroneous commonIgnores reference from TS rules

## 0.4.0

### Features

- Combined JS/TS rules now ignore commonly ignored files
  Disabled `no-undef` rule in TypeScript files

## 0.3.0

### Features

- BREAKING CHANGE: Removed legacy config.

### Refactoring

- Simplified structure
- Made plugins direct dependencies of the flat TypeScript config

### Features

## 0.2.0

### Features

- A legacy config with the same rules as the flat config is now exported.

## 0.1.7

### Fixes

- Fixed nonpropagating ignores, Node globals

## 0.1.6

### Dependencies

- Upgraded dependencies
