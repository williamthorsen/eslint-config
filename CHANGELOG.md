# @williamthorsen/eslint-config-monorepo

## 5.5.0

### Dependencies

- Upgraded all dependencies to latest version

## 5.4.0

### Dependencies

- Upgraded all dependencies to latest version

## 5.3.0

### Dependencies

- Upgraded all dependencies to latest version

## 5.1.0

### Tooling

- Extended linter coverage to non-package files

### Docs

- Added Junie AI guidelines

## 5.0.2

### Tooling

- Replaced custom workspace scripts with the generic `run-workspace-script` script runner

### Dependencies

- Added `@williamthorsen/toolbelt.objects` to dev dependencies to support the generic script runner

## 4.0.0

### Dependencies

- Upgraded all dependencies to latest version

## 3.2.2

### Dependencies

- Upgraded all dependencies to latest version
- Upgraded all runtimes to latest version

## 3.3.0

### Features

- Added SkyPilot custom plugin and linting rules to TypeScript config

### Dependencies

- Upgraded all dependencies to latest version
- Upgraded pnpm runtime to latest version (10.6.5 → 10.7.1)

## 3.2.1

### Dependencies

- Upgraded all dependencies to latest version
- Upgraded all runtimes to latest version

### Security

- Removed `esbuild` vulnerability GHSA-67mh-4wv8-2f99 from audit ignorelist

## 3.1.0

### Features

### Tooling

- Simplified the ESLint config

### Dependencies

- Upgraded all dependencies to latest version

## 0.17.0

### Dependencies

- Upgraded PNPM runtime to latest version
- Upgraded NodeJS runtime to latest LTS version
- Upgraded all dependencies to latest version
- Removed unneeed `@types/eslint` dependency (types are now included in `eslint` package)

## 0.16.0

### Dependencies

- Upgraded all dependencies except for `eslint` to latest version
- Upgraded `eslint` to latest v8.x (for compatibility with `@typescript-eslint` packages)
- Upgraded Node.js runtime to latest minor version (v20.x)
- Upgraded `pnpm` runtime to latest version

## 0.14.0

### Dependencies

Upgraded all dependencies to latest version.

## 0.12.5

### Dependencies

- Upgraded all dependencies to latest version
- Upgraded all runtimes to latest version

## 0.12.2

### Dependencies

- Upgraded all dependencies to latest version
- Upgraded all runtimes to latest version

## 0.11.0

### Dependencies

- Added `vitest` and its `v8` coverage engine to dev dependencies
- Added `rimraf` to dev dependencies for use in build scripts
- Added ESM Loader to dev dependencies to allow TypeScript scripts to run in Node.js
- Upgraded all dependencies to latest version

### Tooling

- Added `audit-ci` as a wrapper for `pnpm audit` checks
- Added "GHSA-c2qf-rxjj-qqgw" vulnerability to the `audit-ci` ignore list
- Added `lint:strict` check and included it in the standard `check` script
